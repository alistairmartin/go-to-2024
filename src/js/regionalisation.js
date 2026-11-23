/*
 * Regionalisation popup (ported from Honey Birdette "Regionalisation V2").
 *
 * There is NO automatic window.location redirect. When the visitor's detected
 * country belongs to a different store than the one they are on, we surface a
 * suggestion popup and let them choose. Googlebot crawls from US IPs, so a
 * forced redirect would stop it reaching AU/UK/EU URLs - a user-initiated
 * prompt avoids that entirely.
 *
 * Switching is a plain navigation to the target market domain (settings
 * "market_domains"). We deliberately avoid Shopify's localization form: it
 * saves a country preference cookie, and Shopify then bounces later direct
 * visits to us./uk. back to the saved domain. We also never forward returning
 * visitors - a URL typed directly always wins (OMG request, Nov 2026).
 */
(function () {
  const COOKIES = {
    PROMPTED: 'GTGeoPrompted',      // popup dismissed - don't nag for a while
    MANUAL: 'GTManualRegion',       // visitor picked a store themselves
    CONFIRMED: 'GTRegionConfirmed'  // legacy - no longer set, only cleared by reset()
  };

  const DAYS = { PROMPTED: 14, MANUAL: 30 };

  const BOT_PATTERN = new RegExp(
    '(googlebot|google favicon|mediapartners-google|adsbot-google|google-extended|googleother|apis-google|' +
    'bingbot|bingpreview|slurp|duckduckbot|baiduspider|yandexbot|yandex|sogou|exabot|facebot|facebookexternalhit|' +
    'ia_archiver|twitterbot|linkedinbot|pinterest|applebot|petalbot|bytespider|amazonbot|' +
    'semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot|screaming frog|sitebulb|' +
    'gptbot|chatgpt-user|oai-searchbot|claudebot|claude-web|anthropic-ai|perplexitybot|perplexity-user|cohere-ai|' +
    'wget|curl|python-urllib|python-requests|libwww|httpclient|java/|headlesschrome|lighthouse|chrome-lighthouse|' +
    'bot|crawler|spider)',
    'i'
  );

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function setCookie(name, value, days, domain) {
    let cookie = name + '=' + encodeURIComponent(value) + '; path=/; SameSite=Lax; Secure';
    if (typeof days === 'number') {
      const expires = new Date(Date.now() + days * 864e5);
      cookie += '; expires=' + expires.toUTCString();
    }
    if (domain) cookie += '; domain=' + domain;
    document.cookie = cookie;
  }

  function deleteCookie(name, domain) {
    setCookie(name, '', -1, domain);
  }

  class GeolocationRegion extends HTMLElement {
    constructor() {
      super();
      this.settings = null;
      this.popup = null;
      this.popupBound = false;
      this.cookieDomain = '';
      this.closePopup = this.closePopup.bind(this);
      this.onKeydown = this.onKeydown.bind(this);
    }

    connectedCallback() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init(), { once: true });
      } else {
        this.init();
      }
    }

    /* ---------- setup ---------- */

    init() {
      const settingsEl = document.querySelector('[data-geo-settings]');
      if (!settingsEl) return;

      try {
        this.settings = JSON.parse(settingsEl.textContent);
      } catch (error) {
        console.error('[geo] could not parse settings', error);
        return;
      }

      this.debug = Boolean(this.settings.debug) || Boolean(window.localStorage && localStorage.getItem('GTGeoDebug'));
      this.popup = this.querySelector('.geo-popup');
      this.cookieDomain = this.resolveCookieDomain();

      this.log('[geo] init', {
        host: window.location.hostname,
        market: this.settings.current_market,
        country: this.settings.current_country
      });

      // Remember explicit choices made via ANY localization form (header /
      // footer selectors included) so we never prompt someone who already chose.
      this.watchLocalizationForms();

      if (this.isRobot()) {
        this.log('[geo] crawler detected - no prompt');
        return;
      }

      if (window.Shopify && window.Shopify.designMode) {
        this.log('[geo] theme editor - no prompt');
        return;
      }

      if (getCookie(COOKIES.MANUAL)) {
        this.log('[geo] manual selection cookie present - skipping');
        return;
      }

      // The dismiss cookie only applies to the popup; auto-redirect mode has
      // nothing to dismiss so it should not block the redirect.
      if (!this.settings.auto_redirect && getCookie(COOKIES.PROMPTED)) {
        this.log('[geo] prompt already dismissed - skipping');
        return;
      }

      this.detectCountry();
    }

    resolveCookieDomain() {
      const configured = String(this.settings.cookie_domain || '').trim().toLowerCase();
      const host = window.location.hostname.toLowerCase();
      if (configured && (host === configured || host.endsWith('.' + configured))) {
        return configured;
      }
      return '';
    }

    isRobot() {
      return BOT_PATTERN.test(navigator.userAgent || '');
    }

    watchLocalizationForms() {
      document.addEventListener('submit', (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;
        if (!/\/localization/.test(form.getAttribute('action') || '')) return;

        let country = '';
        const submitter = event.submitter;
        if (submitter && submitter.name === 'country_code' && submitter.value) {
          country = submitter.value;
        } else {
          const input = form.querySelector('[name="country_code"]');
          if (input) country = input.value;
        }

        if (country) {
          setCookie(COOKIES.MANUAL, '1', DAYS.MANUAL, this.cookieDomain);
          this.log('[geo] localization form submitted', country);
        }
      }, true);
    }

    /* ---------- resolution ---------- */

    /**
     * Absolute URL for the same path on the store's domain, or '' when no
     * domain is configured for any of the store's markets.
     */
    storeUrl(store) {
      const map = {};
      String(this.settings.market_domains || '').split(',').forEach((pair) => {
        const [market, domain] = pair.split(':').map((s) => (s || '').trim().toLowerCase());
        if (market && domain) map[market] = domain;
      });

      const markets = String(store.markets || '').split(',');
      const domain = markets.map((m) => map[m]).find(Boolean);
      if (!domain) return '';

      return 'https://' + domain + window.location.pathname + window.location.search;
    }

    storeForMarket(marketHandle) {
      const handle = String(marketHandle || '').toLowerCase();
      if (!handle) return null;
      const stores = this.settings.stores || [];
      return stores.find((store) => String(store.markets || '').split(',').includes(handle)) || null;
    }

    currentStore() {
      return this.storeForMarket(this.settings.current_market);
    }

    /**
     * Returns { country, name, store } when the detected country lives on a
     * different store than the one being browsed, else null.
     */
    resolveTarget(isoCode) {
      const iso = String(isoCode || '').toUpperCase();
      const entry = this.settings.countries && this.settings.countries[iso];
      if (!entry) {
        this.log('[geo] country not in any market', iso);
        return null;
      }

      const targetStore = this.storeForMarket(entry.m);
      const current = this.currentStore();

      if (!targetStore) {
        this.log('[geo] no store block for market', entry.m);
        return null;
      }

      if (current && current.id === targetStore.id) {
        return null;
      }

      return { country: iso, name: entry.n || iso, store: targetStore };
    }

    /* ---------- detection ---------- */

    detectCountry() {
      if (!window.Shopify || !window.Shopify.routes || !window.Shopify.routes.root) {
        this.log('[geo] Shopify routes unavailable');
        return;
      }

      const params = new URLSearchParams();
      params.set('country[enabled]', 'true');
      if (window.Shopify.country) params.set('country[exclude]', window.Shopify.country);

      const url = window.Shopify.routes.root + 'browsing_context_suggestions.json?' + params.toString();

      fetch(url, { credentials: 'same-origin' })
        .then((response) => {
          if (!response.ok) throw new Error('browsing_context_suggestions ' + response.status);
          return response.json();
        })
        .then((data) => {
          const detected =
            (data && data.detected_values && data.detected_values.country && data.detected_values.country.handle) ||
            (data && data.suggestions && data.suggestions[0] && data.suggestions[0].parts &&
              data.suggestions[0].parts.country && data.suggestions[0].parts.country.handle);

          if (!detected) {
            this.log('[geo] no country detected', data);
            return;
          }

          this.onDetected(String(detected).toUpperCase());
        })
        .catch((error) => this.log('[geo] detection failed', error));
    }

    onDetected(iso) {
      this.log('[geo] detected country', iso);

      const target = this.resolveTarget(iso);
      if (!target) {
        this.log('[geo] visitor is already on the right store');
        return;
      }

      if (this.settings.auto_redirect) {
        const url = this.storeUrl(target.store);
        this.log('[geo] auto-redirect enabled - switching', url);
        if (url) window.location.assign(url);
        return;
      }

      if (!this.storeUrl(target.store)) {
        this.log('[geo] no domain configured for store', target.store.title);
        return;
      }

      this.showPopup(target);
    }

    /* ---------- popup ---------- */

    showPopup(target) {
      const popup = this.popup;
      if (!popup) return;

      const headingTpl = popup.dataset.tplHeading || "Looks like you're in {country}";
      const subTpl = popup.dataset.tplSubtext || 'Shop all your Go-Tos on our {store} store.';
      const ctaTpl = popup.dataset.tplCta || 'Take me there';

      const headingEl = popup.querySelector('[data-geo-heading]');
      const subEl = popup.querySelector('[data-geo-subtext]');
      const ctaEl = popup.querySelector('[data-geo-cta-text]');

      if (headingEl) headingEl.innerHTML = headingTpl.replace('{country}', '<b>' + this.escape(target.name) + '</b>');
      if (subEl) subEl.innerHTML = subTpl.replace('{store}', '<b>' + this.escape(target.store.title) + '</b>');
      if (ctaEl) ctaEl.textContent = ctaTpl.replace('{store}', target.store.title);

      const fromFlag = popup.querySelector('[data-geo-from-flag]');
      const toFlag = popup.querySelector('[data-geo-to-flag]');
      const arrow = popup.querySelector('[data-geo-arrow]');

      const hasTo = this.populateStoreFlag(toFlag, target.store.id);
      // Skip the "from" flag when it would just duplicate the store flag (US -> US store).
      const sameFlag = hasTo && String(target.store.flag_iso || '').toUpperCase() === target.country;
      const hasFrom = !sameFlag && this.populateCountryFlag(fromFlag, target.country, target.name);

      if (fromFlag) fromFlag.hidden = !hasFrom;
      if (arrow) arrow.hidden = !(hasFrom && hasTo);
      if (toFlag) toFlag.hidden = !hasTo;

      const shopBtn = popup.querySelector('[data-geo-shop]');
      if (shopBtn) {
        shopBtn.href = this.storeUrl(target.store);
        if (!shopBtn.dataset.bound) {
          shopBtn.dataset.bound = '1';
          // Only remember that the popup was answered - no region preference.
          shopBtn.addEventListener('click', () => {
            setCookie(COOKIES.PROMPTED, '1', DAYS.PROMPTED, this.cookieDomain);
          });
        }
      }

      this.bindDismiss(popup);

      popup.hidden = false;
      document.documentElement.classList.add('geo-popup-open');
      document.addEventListener('keydown', this.onKeydown);

      if (shopBtn) {
        try { shopBtn.focus({ preventScroll: true }); } catch (e) { /* noop */ }
      }
    }

    populateStoreFlag(el, storeId) {
      if (!el || !this.popup) return false;
      const bank = this.popup.querySelector('[data-geo-flag-bank]');
      if (!bank) return false;
      const root = bank.content || bank;
      const source = root.querySelector('[data-flag-store="' + storeId + '"]');
      if (!source) return false;
      el.innerHTML = source.innerHTML;
      return true;
    }

    populateCountryFlag(el, iso, name) {
      if (!el) return false;
      const code = String(iso || '').toLowerCase();
      if (!/^[a-z]{2}$/.test(code)) return false;

      const img = document.createElement('img');
      img.src = 'https://cdn.shopify.com/static/images/flags/' + code + '.svg?width=64';
      img.alt = name || iso;
      img.width = 52;
      img.height = 52;
      img.loading = 'eager';
      img.addEventListener('error', () => {
        el.hidden = true;
        const arrow = this.popup && this.popup.querySelector('[data-geo-arrow]');
        if (arrow) arrow.hidden = true;
      });

      el.innerHTML = '';
      el.appendChild(img);
      return true;
    }

    bindDismiss(popup) {
      if (this.popupBound) return;
      this.popupBound = true;

      popup.querySelectorAll('[data-geo-close], [data-geo-stay]').forEach((el) => {
        el.addEventListener('click', this.closePopup);
      });
    }

    onKeydown(event) {
      if (event.key === 'Escape') this.closePopup();
    }

    closePopup() {
      if (!this.popup) return;
      this.popup.hidden = true;
      document.documentElement.classList.remove('geo-popup-open');
      document.removeEventListener('keydown', this.onKeydown);
      setCookie(COOKIES.PROMPTED, '1', DAYS.PROMPTED, this.cookieDomain);
    }

    /* ---------- utils ---------- */

    escape(value) {
      const div = document.createElement('div');
      div.textContent = value == null ? '' : String(value);
      return div.innerHTML;
    }

    log() {
      if (!this.debug) return;
      console.log.apply(console, arguments);
    }

    // Handy from the console: document.querySelector('geolocation-region').reset()
    reset() {
      deleteCookie(COOKIES.PROMPTED, this.cookieDomain);
      deleteCookie(COOKIES.MANUAL, this.cookieDomain);
      deleteCookie(COOKIES.CONFIRMED, this.cookieDomain);
      deleteCookie(COOKIES.PROMPTED);
      deleteCookie(COOKIES.MANUAL);
      deleteCookie(COOKIES.CONFIRMED);
    }
  }

  if (!customElements.get('geolocation-region')) {
    customElements.define('geolocation-region', GeolocationRegion);
  }
})();
