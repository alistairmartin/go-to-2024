document.addEventListener("DOMContentLoaded", function(event) {

    // Routine Switcher
    var contentRoutine = document.querySelector('.product-content-routine');
    if (contentRoutine) {
        contentRoutine.addEventListener("click", function() {
            if (contentRoutine.classList.contains('active--morning')) {
                contentRoutine.classList.add('active--evening');
                contentRoutine.classList.remove('active--morning');
            } else {
                contentRoutine.classList.add('active--morning');
                contentRoutine.classList.remove('active--evening');
            }
        });
    }

    // Teaser 
    var teaserOpen = document.querySelector('.product-content-description--teaser-open');
    var teaserClose = document.querySelector('.product-content-description--teaser-close');
    var teaser = document.querySelector('.product-content-description--teaser');
    
    if (teaserOpen && teaserClose && teaser) {
        teaserOpen.addEventListener("click", function() {
            this.classList.add("hidden");
            teaserClose.classList.remove("hidden");
            teaser.setAttribute('aria-revealed', 'true');
        });

        teaserClose.addEventListener("click", function() {
            this.classList.add("hidden");
            teaserOpen.classList.remove("hidden");
            teaser.setAttribute('aria-revealed', 'false');
        });
    }

    // Ingredients
    var ingredientItems = document.querySelectorAll('.product-content-ingredients--text-item__mobile');
    if (ingredientItems.length > 0) {
        ingredientItems.forEach(function(item) {
            item.addEventListener("click", function() {
                ingredientItems.forEach(function(el) {
                    el.classList.remove('active');
                });

                this.classList.add("active");
            });
        });
    }

    var subscriptionBlocks = document.querySelectorAll('[data-block-type="custom_subscription"]');
    if (subscriptionBlocks.length > 0) {
        subscriptionBlocks.forEach(function(block) {
            var planContainer = block.querySelector('[data-selling-plan-container]');
            var planSelect = block.querySelector('[data-selling-plan-select]');
            var subscribeRadio = block.querySelector('input[name="purchase_option"][value="subscribe"]');
            var oneTimeRadio = block.querySelector('input[name="purchase_option"][value="one_time"]');

            if (!planSelect || !subscribeRadio || !oneTimeRadio) {
                return;
            }

            if (planSelect.options.length === 0) {
                subscribeRadio.disabled = true;
                if (planContainer) {
                    planContainer.hidden = true;
                }
                planSelect.disabled = true;
                return;
            }

            var setSubscriptionState = function(isSubscribe) {
                if (planContainer) {
                    planContainer.hidden = !isSubscribe;
                }
                planSelect.disabled = !isSubscribe;
                if (isSubscribe && planSelect.selectedIndex === -1) {
                    planSelect.selectedIndex = 0;
                }
            };

            setSubscriptionState(subscribeRadio.checked);

            subscribeRadio.addEventListener("change", function(event) {
                setSubscriptionState(event.target.checked);
            });

            oneTimeRadio.addEventListener("change", function() {
                setSubscriptionState(false);
            });
        });
    }

    document.addEventListener('variant:changed', function(event) {
        var variant = event.detail && event.detail.variant;
        if (!variant) {
            return;
        }

        var handleize = function(value) {
            if (window.Shopify && typeof Shopify.handleize === "function") {
                return Shopify.handleize(value);
            }

            return String(value || "")
                .toLowerCase()
                .replace(/[^\w\u00C0-\u024f]+/g, "-")
                .replace(/^-+|-+$/g, "");
        };

        var optionHandle = handleize(variant.option1);
        if (!optionHandle) {
            return;
        }

        var form = event.target;
        var scope = form && typeof form.closest === "function" ? form.closest(".shopify-section") : null;
        var mediaParents = (scope || document).querySelectorAll(".product-media-desktop.enable-variant-images");

        if (mediaParents.length === 0) {
            return;
        }

        mediaParents.forEach(function(parent) {
            Array.from(parent.classList).forEach(function(className) {
                if (className.indexOf("current-option-") === 0) {
                    parent.classList.remove(className);
                }
            });

            parent.classList.add("current-option-" + optionHandle);
        });
    });

    document.addEventListener('variant:changed', function(event) {
        var variant = event.detail && event.detail.variant;
        if (!variant || typeof variant.price !== "number") {
            return;
        }

        var form = event.target;
        var scope = form && typeof form.closest === "function" ? form.closest(".shopify-section") : null;
        var loyaltyBlocks = (scope || document).querySelectorAll("[data-loyalty-points]");

        if (loyaltyBlocks.length === 0) {
            return;
        }

        loyaltyBlocks.forEach(function(block) {
            var multiplier = parseInt(block.getAttribute("data-points-multiplier"), 10);
            if (!multiplier || multiplier < 1) {
                multiplier = 1;
            }

            var pointsValue = Math.floor((variant.price * multiplier) / 100);
            var pointsValueEl = block.querySelector("[data-loyalty-points-value]");

            if (pointsValueEl) {
                pointsValueEl.textContent = pointsValue;
            }
        });
    });
});

/* =========================================================
   Collection card inline video (V3 "Shop All" card)
   Renders for products with a custom.collection_card_video metafield.
   Custom element so AJAX-injected cards (filter / pagination) auto-upgrade.
   ========================================================= */
class CollectionCardVideo extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    this.video = this.querySelector("video");
    this.stage = this.querySelector("[data-cv-stage]");

    var playBtn = this.querySelector("[data-cv-play]");
    var soundBtn = this.querySelector("[data-cv-sound]");
    var stopBtn = this.querySelector("[data-cv-stop]");
    var self = this;

    if (playBtn) playBtn.addEventListener("click", function (e) { e.preventDefault(); self.play(); });
    if (soundBtn) soundBtn.addEventListener("click", function (e) { e.preventDefault(); self.toggleSound(); });
    if (stopBtn) stopBtn.addEventListener("click", function (e) { e.preventDefault(); self.stop(); });
  }

  play() {
    if (!this.video) return;
    if (this.stage) this.stage.hidden = false;
    this.classList.add("is-playing");
    // Browsers require muted for a programmatic play(); user can unmute after.
    this.video.muted = true;
    this.classList.add("is-muted");
    try { this.video.currentTime = 0; } catch (e) {}
    var p = this.video.play();
    if (p && typeof p.catch === "function") p.catch(function () {});
  }

  stop() {
    if (this.video) this.video.pause();
    if (this.stage) this.stage.hidden = true;
    this.classList.remove("is-playing");
  }

  toggleSound() {
    if (!this.video) return;
    this.video.muted = !this.video.muted;
    this.classList.toggle("is-muted", this.video.muted);
  }
}

if (!customElements.get("collection-card-video")) {
  customElements.define("collection-card-video", CollectionCardVideo);
}

/* =========================================================
   Collection card mobile swipe gallery (V3 "Shop All" card)
   CSS scroll-snap handles the native swipe; this syncs the
   prev/next arrows (which swap at the ends) and the dots.
   Custom element so AJAX-injected cards auto-upgrade.
   ========================================================= */
class CardSlider extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    this.track = this.querySelector("[data-cs-track]");
    if (!this.track) return;

    this.prevBtn = this.querySelector("[data-cs-prev]");
    this.nextBtn = this.querySelector("[data-cs-next]");
    this.dots = Array.prototype.slice.call(this.querySelectorAll("[data-cs-dots] .product-card__dot"));
    this.slides = this.track.children;

    var self = this;
    this.track.addEventListener("scroll", function () {
      if (self._raf) return;
      self._raf = requestAnimationFrame(function () { self._raf = null; self.update(); });
    }, { passive: true });

    if (this.prevBtn) this.prevBtn.addEventListener("click", function (e) { e.preventDefault(); self.go(-1); });
    if (this.nextBtn) this.nextBtn.addEventListener("click", function (e) { e.preventDefault(); self.go(1); });

    this.update();
  }

  index() {
    var w = this.track.clientWidth || 1;
    return Math.round(this.track.scrollLeft / w);
  }

  go(dir) {
    var max = this.slides.length - 1;
    var i = this.index() + dir;
    if (i < 0) i = 0;
    if (i > max) i = max;
    this.track.scrollTo({ left: i * this.track.clientWidth, behavior: "smooth" });
  }

  update() {
    var i = this.index();
    var max = this.slides.length - 1;
    if (this.prevBtn) this.prevBtn.hidden = i <= 0;
    if (this.nextBtn) this.nextBtn.hidden = i >= max;
    for (var d = 0; d < this.dots.length; d++) {
      this.dots[d].classList.toggle("is-active", d === i);
    }
  }
}

if (!customElements.get("card-slider")) {
  customElements.define("card-slider", CardSlider);
}

/* =========================================================
   Colour-swatch image swap for the mobile swipe gallery.
   On desktop the theme's product-item element swaps the
   `.product-item__primary-image` when a colour swatch is picked, but on
   mobile those images are hidden (display:none) and the visible image lives
   in `.product-card__slider`. So here we mirror the swap onto the slider's
   first slide. Delegated on document so AJAX-injected cards keep working.
   ========================================================= */
document.addEventListener("change", function (event) {
  var radio = event.target && event.target.closest
    ? event.target.closest(".color-swatch__radio")
    : null;
  if (!radio || !radio.hasAttribute("data-variant-featured-media")) return;

  var card = radio.closest(".product-item");
  if (!card) return;

  var mediaId = radio.getAttribute("data-variant-featured-media");
  var source = card.querySelector('.product-item__primary-image[data-media-id="' + mediaId + '"]');
  var firstSlide = card.querySelector(".product-card__track .product-card__slide-img");
  if (!source || !firstSlide) return;

  if (source.getAttribute("src")) firstSlide.setAttribute("src", source.getAttribute("src"));
  if (source.getAttribute("srcset")) firstSlide.setAttribute("srcset", source.getAttribute("srcset"));
  firstSlide.setAttribute("alt", source.getAttribute("alt") || "");

  // 2nd image: the first non-featured image carrying this variant's shade alt
  // (rendered as a hidden source by the Liquid). Apply it to the gallery's 2nd
  // slide (mobile) and the secondary/hover image (desktop) so both breakpoints
  // show a variant-specific second image.
  var secondarySource = card.querySelector('.product-item__variant-secondary-source[data-secondary-for="' + mediaId + '"]');
  if (secondarySource) {
    var secondSlide = card.querySelectorAll(".product-card__track .product-card__slide-img")[1];
    var desktopSecondary = card.querySelector(".product-item__secondary-image");
    [secondSlide, desktopSecondary].forEach(function (target) {
      if (!target) return;
      if (secondarySource.getAttribute("src")) target.setAttribute("src", secondarySource.getAttribute("src"));
      if (secondarySource.getAttribute("srcset")) target.setAttribute("srcset", secondarySource.getAttribute("srcset"));
      target.setAttribute("alt", secondarySource.getAttribute("alt") || "");
    });
  }

  // Snap back to the first slide so the swapped image is in view.
  var track = card.querySelector("card-slider [data-cs-track]");
  if (track) track.scrollTo({ left: 0 });
});

/* =========================================================
   Collapsible promo banner (.cpb) — full-width grid card.
   Defined here (NOT inline in blocks/_promo-banner-card.liquid) because
   product-facet re-renders #facet-main via innerHTML on filter / sort /
   pagination, and scripts assigned via innerHTML never execute — an inline
   <script> would only run on first paint and silently die after any AJAX.
   As a bundled custom element the banner auto-upgrades every time the markup
   is re-injected. Countdown uses moment-timezone, loaded on demand (also via
   innerHTML in the block, so it can't be relied on from there either).
   ========================================================= */
var cpbMomentPromise = null;

function cpbLoadScript(src) {
  return new Promise(function (resolve, reject) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function cpbEnsureMoment() {
  if (typeof window.moment !== "undefined" && window.moment.tz) {
    return Promise.resolve();
  }
  if (!cpbMomentPromise) {
    cpbMomentPromise = cpbLoadScript("https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js")
      .then(function () {
        return cpbLoadScript("https://cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.34/moment-timezone-with-data-10-year-range.min.js");
      });
  }
  return cpbMomentPromise;
}

class CollapsiblePromoBanner extends HTMLElement {
  connectedCallback() {
    // Wire listeners once. slotCards() moves this node into the grid, which
    // re-fires connectedCallback — re-attaching would stack click handlers.
    if (!this._init) {
      this._init = true;
      this.toggleBtn = this.querySelector('[data-action="toggle"]');
      this.countdownEls = this.querySelectorAll("[data-countdown]");
      this.openText = this.dataset.openText || "Open";
      this.closeText = this.dataset.closeText || "Close";

      var self = this;
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener("click", function () { self.toggle(); });
      }

      // In the theme editor the section re-renders on every change, which would
      // collapse the banner and hide whatever the merchant is editing. Force it
      // open so the expanding content stays visible while they work.
      if (window.Shopify && window.Shopify.designMode) {
        this.dataset.open = "true";
      }

      // The open-by-default state is breakpoint-dependent (data-default-desktop /
      // data-default-mobile, resolved in CSS). Keep the toggle label in sync when
      // the viewport crosses the breakpoint before the visitor has toggled.
      this._mq = window.matchMedia("(max-width: 740px)");
      var onBreakpointChange = function () {
        if (!self.dataset.open) self.updateButton();
      };
      if (this._mq.addEventListener) {
        this._mq.addEventListener("change", onBreakpointChange);
      } else if (this._mq.addListener) {
        this._mq.addListener(onBreakpointChange); // Safari < 14
      }

      this.updateButton();
    }

    // (Re)start the countdown on every connect — disconnectedCallback clears the
    // timer when slotCards detaches the node, so it must be restarted on re-attach.
    this.startCountdown();
  }

  disconnectedCallback() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  // Effective open state: an explicit toggle (data-open) wins; otherwise fall back
  // to the breakpoint's open-by-default setting. Mirrors the CSS resolution.
  isOpen() {
    if (this.dataset.open === "true") return true;
    if (this.dataset.open === "false") return false;
    var mobile = window.matchMedia("(max-width: 740px)").matches;
    return mobile
      ? this.dataset.defaultMobile === "true"
      : this.dataset.defaultDesktop === "true";
  }

  updateButton() {
    if (!this.toggleBtn) return;
    var open = this.isOpen();
    this.toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    this.toggleBtn.textContent = open ? this.closeText : this.openText;
  }

  toggle() {
    var next = !this.isOpen();
    this.dataset.open = next ? "true" : "false";
    this.updateButton();
  }

  startCountdown() {
    if (!this.countdownEls || !this.countdownEls.length) return;

    var endRaw = this.dataset.end;
    if (!endRaw) return;

    if (this._intervalId) clearInterval(this._intervalId); // guard against doubles

    var tz = this.dataset.timezone || "Australia/Sydney";
    var hideAfter = this.dataset.hideAfter === "1";
    var self = this;

    // Kick off the moment-timezone load, but DON'T gate interval creation on it.
    // slotCards moves this node (disconnect -> reconnect) synchronously, which races
    // any async "start once moment loads" callback and can leave the card without a
    // running timer. Instead the interval starts now and each tick waits for moment.
    cpbEnsureMoment();

    var tick = function () {
      if (typeof window.moment === "undefined" || !window.moment.tz) return; // wait for moment

      var endTime = moment.tz(endRaw, tz);
      var duration = moment.duration(endTime.diff(moment.tz(tz)));

      if (duration.asSeconds() <= 0) {
        clearInterval(self._intervalId);
        self._intervalId = null;
        self.countdownEls.forEach(function (el) { el.innerHTML = ""; });
        if (hideAfter) self.style.display = "none";
        return;
      }

      var days = duration.days();
      var hours = duration.hours();
      var minutes = duration.minutes();
      var seconds = duration.seconds();

      var parts = [];
      if (days > 0) parts.push(days + (days === 1 ? " Day" : " Days"));
      parts.push(hours + (hours === 1 ? " hour" : " hours"));
      parts.push(minutes + " min");
      parts.push(seconds + " sec");

      var text = parts.join(", ");
      self.countdownEls.forEach(function (el) { el.innerHTML = text; });
    };

    tick();
    this._intervalId = setInterval(tick, 1000);
  }
}

if (!customElements.get("collapsible-promo-banner")) {
  customElements.define("collapsible-promo-banner", CollapsiblePromoBanner);
}

/* =========================================================
   Collection Content Cards — slot custom cards into the product grid.
   Cards (.cc-card) are rendered by content_for inside hidden .cc-holder
   wrappers in main-collection.liquid. This MOVES each card into
   .product-list__inner at its configured per-breakpoint position & span.
   Re-runs after AJAX filter/sort/pagination (theme:loading:end rebuilds
   #facet-main, refilling the holder), on resize (the breakpoint changes the
   slot index) and on theme-editor events. Moving (not cloning) preserves the
   block's shopify_attributes so editor selection keeps working.
   ========================================================= */
(function () {
  var DESKTOP_MIN = 741; // matches main-collection's desktop breakpoint
  // Reveal only on the first page-load slot — not on resize / filter re-slots.
  var revealed = false;

  function isDesktop() {
    return window.matchMedia("(min-width: " + DESKTOP_MIN + "px)").matches;
  }

  // Trigger the page-load reveal (mirrors the product-item stagger in theme.js).
  // The delay matches ProductList's decelerating formula so a card blends in with
  // the products around its slot. Skipped when stagger apparition is off.
  function revealCard(grid, card) {
    if (revealed) return;
    if (!document.querySelector("product-list[stagger-apparition]")) return;
    var children = Array.prototype.slice.call(grid.children);
    var index = children.indexOf(card);
    if (index < 0) index = 0;
    var delay = 100 * index - Math.min(3 * index * index, 100 * index);
    card.style.setProperty("--cc-reveal-delay", Math.max(0, delay) + "ms");
    card.classList.add("cc-card--reveal");
  }

  function slotCards() {
    // Scope to the MAIN collection grid only. Other sections (e.g. the category
    // carousel) also use .product-list__inner, and the carousel renders before
    // main-collection — so a bare ".product-list__inner" would grab the wrong grid.
    // Double-scoped: the main-collection section wrapper carries
    // .shopify-section--main-collection, and its <product-list> carries
    // .product-facet__product-list.
    var section = document.querySelector(".shopify-section--main-collection");
    if (!section) return;

    var grid = section.querySelector(".product-facet__product-list .product-list__inner");
    if (!grid) return;

    // Only cards rendered by main-collection's holder (or already slotted into the
    // main grid) — never cards that may live elsewhere on the page.
    var cards = section.querySelectorAll("[data-cc-card]");
    if (!cards.length) return;

    // Content cards belong on the first page of results only. AJAX pagination
    // updates the URL's ?page param, so hide every card on pages 2+.
    var page = new URLSearchParams(window.location.search).get("page");
    if (page && page !== "1") {
      Array.prototype.forEach.call(cards, function (card) {
        card.hidden = true;
      });
      return;
    }

    var desktop = isDesktop();

    // Real products only — exclude injected grid cards (which lack .product-card)
    // and our own content cards.
    var products = grid.querySelectorAll(":scope > .product-item.product-card");

    Array.prototype.forEach.call(cards, function (card) {
      var raw = desktop
        ? card.getAttribute("data-desktop-position")
        : card.getAttribute("data-mobile-position");
      var pos = parseInt(raw, 10);

      // Blank / non-numeric position for this breakpoint → keep the card out of view.
      if (isNaN(pos) || pos < 0) {
        card.hidden = true;
        return;
      }

      if (pos === 0) {
        // Position 0 → place the card first, before the very first product.
        var firstProduct = products[0];
        if (firstProduct) {
          if (firstProduct.previousSibling !== card) grid.insertBefore(card, firstProduct);
        } else if (card.parentElement !== grid) {
          grid.appendChild(card);
        }
        card.hidden = false;
        revealCard(grid, card);
        return;
      }

      var anchor = products[Math.min(pos, products.length) - 1];
      if (anchor) {
        // Place the card immediately AFTER the Nth product (grid-image convention).
        if (anchor.nextSibling !== card) grid.insertBefore(card, anchor.nextSibling);
      } else if (card.parentElement !== grid) {
        // Fewer products than the requested position → append to the grid.
        grid.appendChild(card);
      }

      card.hidden = false;
      revealCard(grid, card);
    });

    revealed = true;
  }

  var raf;
  function schedule() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(slotCards);
  }

  if (document.readyState !== "loading") {
    slotCards();
  } else {
    document.addEventListener("DOMContentLoaded", slotCards);
  }

  // Grid re-rendered after filter / sort / pagination.
  document.documentElement.addEventListener("theme:loading:end", schedule);
  // Breakpoint change can move the card to a different slot index.
  window.addEventListener("resize", schedule);
  // Theme editor re-renders / block selection.
  document.addEventListener("shopify:section:load", schedule);
  document.addEventListener("shopify:block:select", schedule);
})();

/* =========================================================
   Featured Collections Content Cards — same slotting as the collection page,
   but scoped to the featured-collections section. Each collection "tab" is a
   <product-list> theme block (blocks/featured-collection.liquid) with its own
   nested content cards rendered into a hidden .cc-holder; this MOVES each card
   into that tab's .product-list__inner at its configured per-breakpoint
   position & span. Per-tab so a card only ever lands in its own collection's
   grid. Re-runs on resize (breakpoint changes the slot index) and on
   theme-editor events.
   ========================================================= */
(function () {
  var DESKTOP_MIN = 741; // matches featured-collections' desktop breakpoint

  function isDesktop() {
    return window.matchMedia("(min-width: " + DESKTOP_MIN + "px)").matches;
  }

  // Page-load / tab-show reveal — mirrors the product-item stagger in theme.js,
  // which re-plays every time a tab panel (<product-list>) becomes visible. We
  // reveal a panel's cards when it's shown, restarting the CSS animation so it
  // re-plays on each tab switch like the products do. Gated on the same setting.
  function revealPanel(productList) {
    if (!productList.hasAttribute("stagger-apparition") || productList.hidden) return;
    var grid = productList.querySelector(".product-list__inner");
    if (!grid) return;
    var children = Array.prototype.slice.call(grid.children);
    Array.prototype.forEach.call(grid.querySelectorAll(":scope > [data-cc-card]"), function (card) {
      if (card.hidden) return;
      var index = children.indexOf(card);
      if (index < 0) index = 0;
      var delay = 100 * index - Math.min(3 * index * index, 100 * index);
      card.style.setProperty("--cc-reveal-delay", Math.max(0, delay) + "ms");
      // Restart the animation (remove → reflow → add) so it re-plays on tab show.
      card.classList.remove("cc-card--reveal");
      void card.offsetWidth;
      card.classList.add("cc-card--reveal");
    });
  }

  function slotList(productList) {
    var grid = productList.querySelector(".product-list__inner");
    if (!grid) return;

    // Cards rendered by this tab's holder (or already slotted into its grid).
    var cards = productList.querySelectorAll("[data-cc-card]");
    if (!cards.length) return;

    var desktop = isDesktop();

    // Real products only — exclude our own content cards.
    var products = grid.querySelectorAll(":scope > .product-item.product-card");

    Array.prototype.forEach.call(cards, function (card) {
      var raw = desktop
        ? card.getAttribute("data-desktop-position")
        : card.getAttribute("data-mobile-position");
      var pos = parseInt(raw, 10);

      // Blank / non-numeric position for this breakpoint → keep the card out of view.
      if (isNaN(pos) || pos < 0) {
        card.hidden = true;
        return;
      }

      if (pos === 0) {
        // Position 0 → place the card first, before the very first product.
        var firstProduct = products[0];
        if (firstProduct) {
          if (firstProduct.previousSibling !== card) grid.insertBefore(card, firstProduct);
        } else if (card.parentElement !== grid) {
          grid.appendChild(card);
        }
        card.hidden = false;
        return;
      }

      var anchor = products[Math.min(pos, products.length) - 1];
      if (anchor) {
        // Place the card immediately AFTER the Nth product.
        if (anchor.nextSibling !== card) grid.insertBefore(card, anchor.nextSibling);
      } else if (card.parentElement !== grid) {
        // Fewer products than the requested position → append to the grid.
        grid.appendChild(card);
      }

      card.hidden = false;
    });
  }

  // Watch each panel's `hidden` so cards re-reveal when its tab is shown — the
  // same trigger ProductList uses to re-stagger the products. Observed once.
  function observePanel(list) {
    if (list._ccRevealObserved) return;
    list._ccRevealObserved = true;
    new MutationObserver(function () {
      revealPanel(list);
    }).observe(list, { attributes: true, attributeFilter: ["hidden"] });
  }

  function slotFeaturedCards() {
    var sections = document.querySelectorAll(".shopify-section--featured-collections");
    Array.prototype.forEach.call(sections, function (section) {
      var lists = section.querySelectorAll("product-list");
      Array.prototype.forEach.call(lists, function (list) {
        slotList(list);
        observePanel(list);
      });
    });
  }

  var raf;
  function schedule() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(slotFeaturedCards);
  }

  // First-load reveal for the initially-visible panel(s). Runs after slotting so
  // cards are already in the grid. Hidden panels reveal later via observePanel.
  function revealOnLoad() {
    slotFeaturedCards();
    Array.prototype.forEach.call(
      document.querySelectorAll(".shopify-section--featured-collections product-list"),
      revealPanel
    );
  }

  if (document.readyState !== "loading") {
    revealOnLoad();
  } else {
    document.addEventListener("DOMContentLoaded", revealOnLoad);
  }

  // Breakpoint change can move the card to a different slot index.
  window.addEventListener("resize", schedule);
  // Theme editor re-renders / block selection.
  document.addEventListener("shopify:section:load", schedule);
  document.addEventListener("shopify:block:select", schedule);
})();
