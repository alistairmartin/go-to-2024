/**
 * <byo-quiz> — three-question routine builder for the BYO bundle page.
 *
 * Rules live in the section blocks (sections/byo-quiz.liquid) and are read
 * from the inline JSON config. This element only:
 *   1. walks the customer through the questions,
 *   2. runs recommend(answers) against the product rules,
 *   3. renders the routine and publishes it:
 *        window.byo_quiz_products  – [variantId, …] (first available variant)
 *        window.byo_quiz_answers   – { age, skin_type, concern } display labels | null
 *        window.byo_quiz_progress  – "0/3" … "3/3"
 *        document → "byo-quiz:answer" | "byo-quiz:complete" | "byo-quiz:reset"
 */
(function () {
  if (window.customElements.get("byo-quiz")) return;

  window.byo_quiz_products = window.byo_quiz_products || [];
  window.byo_quiz_answers = window.byo_quiz_answers || null;
  window.byo_quiz_progress = window.byo_quiz_progress || "0/3";

  var esc = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  var parseList = function (raw) {
    return String(raw || "")
      .split(",")
      .map(function (s) { return s.trim().toLowerCase(); })
      .filter(Boolean);
  };

  /** rule: "all" | "a, b" (allow-list) | "!a, !b" (deny-list) — mixes allowed. */
  var ruleMatches = function (raw, value) {
    var list = parseList(raw);
    if (!list.length || list.indexOf("all") > -1) return true;
    var deny = list.filter(function (s) { return s.charAt(0) === "!"; }).map(function (s) { return s.slice(1); });
    var allow = list.filter(function (s) { return s.charAt(0) !== "!"; });
    if (deny.indexOf(value) > -1) return false;
    if (allow.length) return allow.indexOf(value) > -1;
    return true;
  };

  var ruleIsSpecific = function (raw) {
    var list = parseList(raw);
    return list.length && list.indexOf("all") === -1 ? 1 : 0;
  };

  var STORAGE_TTL = 1000 * 60 * 60 * 24; // a day

  class BYOQuiz extends HTMLElement {
    connectedCallback() {
      var cfgEl = this.querySelector("[data-quiz-config]");
      try {
        this.config = JSON.parse(cfgEl ? cfgEl.textContent : "{}");
      } catch (err) {
        console.error("byo-quiz: bad config JSON", err);
        this.config = {};
      }
      this.config.questions = this.config.questions || [];
      this.config.products = (this.config.products || []).map(function (p, i) { p.index = i; return p; });
      this.config.categories = this.config.categories || [];
      this.config.copy = this.config.copy || {};

      this.cap = parseInt(this.dataset.cap, 10) || 8;
      this.storageKey = this.dataset.storageKey || "byo_quiz";
      this.questionsEl = this.querySelector("[data-quiz-questions]");
      this.resultsEl = this.querySelector("[data-quiz-results]");
      this.bodyEl = this.querySelector(".byo-quiz__body");
      this.toggleEl = this.querySelector("[data-quiz-toggle]");

      this.state = { step: 0, answers: {} };
      this.restore();

      if (this.toggleEl) this.toggleEl.addEventListener("click", this.toggle.bind(this));
      this.questionsEl.addEventListener("click", this.onQuestionClick.bind(this));
      this.resultsEl.addEventListener("click", this.onResultsClick.bind(this));

      window.byoQuiz = this;
      this.render();
    }

    /* ---------- state ---------- */

    get total() { return this.config.questions.length; }

    get complete() {
      var answers = this.state.answers;
      return this.config.questions.every(function (q) { return !!answers[q.id]; });
    }

    restore() {
      try {
        var raw = sessionStorage.getItem(this.storageKey);
        if (!raw) return;
        var saved = JSON.parse(raw);
        if (!saved || Date.now() - (saved.t || 0) > STORAGE_TTL) return;
        this.state.answers = saved.answers || {};
        this.state.step = Math.min(saved.step || 0, this.total);
      } catch (err) { /* private mode etc. */ }
    }

    persist() {
      try {
        sessionStorage.setItem(this.storageKey, JSON.stringify({ answers: this.state.answers, step: this.state.step, t: Date.now() }));
      } catch (err) { /* ignore */ }
    }

    answerLabels() {
      var answers = this.state.answers, out = {};
      this.config.questions.forEach(function (q) {
        var opt = (q.options || []).filter(function (o) { return o.value === answers[q.id]; })[0];
        if (opt) out[q.id] = opt.label;
      });
      return out;
    }

    answeredCount() {
      var answers = this.state.answers;
      return this.config.questions.filter(function (q) { return !!answers[q.id]; }).length;
    }

    publish(items) {
      var labels = this.answerLabels();
      window.byo_quiz_products = (items || []).map(function (p) { return p.variant_id; });
      window.byo_quiz_answers = this.complete ? labels : null;
      window.byo_quiz_progress = this.answeredCount() + "/" + this.total;
      var detail = { products: window.byo_quiz_products, answers: window.byo_quiz_answers, raw: this.state.answers, items: items || [], progress: window.byo_quiz_progress };
      document.dispatchEvent(new CustomEvent(items ? "byo-quiz:complete" : "byo-quiz:reset", { detail: detail }));
      return detail;
    }

    /* ---------- recommendation ---------- */

    /**
     * Greedy, most-specific-first. Every available product that matches all
     * three answers is a candidate; candidates are ranked by how targeted their
     * rules are (concern > skin type > age) then by block order. One main pick
     * per step, plus any "extra" products (e.g. Fancy Face PM cleanse), never
     * pairing products that exclude each other. Steps left empty get their
     * "fallback" product if one exists (e.g. an SPF for everyone).
     */
    recommend(answers) {
      var self = this;
      var cats = this.config.categories.map(function (c) { return c.id; });
      var conflicts = function (p, picked) {
        var mine = parseList(p.excludes);
        return picked.some(function (s) {
          return mine.indexOf(s.handle) > -1 || parseList(s.excludes).indexOf(p.handle) > -1;
        });
      };
      var eligible = this.config.products.filter(function (p) { return p.available && p.variant_id; });
      var candidates = eligible
        .filter(function (p) {
          return !p.fallback &&
            ruleMatches(p.ages, answers.age) &&
            ruleMatches(p.skins, answers.skin_type) &&
            ruleMatches(p.concerns, answers.concern);
        })
        .map(function (p) {
          p.score = ruleIsSpecific(p.concerns) * 4 + ruleIsSpecific(p.skins) * 2 + ruleIsSpecific(p.ages);
          return p;
        })
        .sort(function (a, b) { return b.score - a.score || a.index - b.index; });

      var picked = [], slots = {};
      candidates.forEach(function (p) {
        if (picked.length >= self.cap) return;
        if (!p.extra && slots[p.category]) return;
        if (conflicts(p, picked)) return;
        picked.push(p);
        if (!p.extra) slots[p.category] = p;
      });

      cats.forEach(function (cat) {
        if (slots[cat] || picked.length >= self.cap) return;
        var fb = eligible.filter(function (p) {
          return p.fallback && p.category === cat && ruleMatches(p.ages, answers.age) && !conflicts(p, picked);
        })[0];
        if (fb) { picked.push(fb); slots[cat] = fb; }
      });

      // Routine order: by step, extras (oil cleanse) first within a step (rule 1), then block order.
      return picked.sort(function (a, b) {
        var ca = cats.indexOf(a.category), cb = cats.indexOf(b.category);
        if (ca !== cb) return ca - cb;
        if (!!a.extra !== !!b.extra) return a.extra ? -1 : 1;
        return a.index - b.index;
      });
    }

    /* ---------- events ---------- */

    toggle() {
      var open = this.classList.toggle("byo-quiz--collapsed") === false;
      this.bodyEl.hidden = !open;
      if (this.toggleEl) this.toggleEl.setAttribute("aria-expanded", open ? "true" : "false");
    }

    onQuestionClick(evt) {
      var option = evt.target.closest("[data-quiz-option]");
      if (option) {
        var q = this.config.questions[this.state.step];
        if (!q) return;
        this.state.answers[q.id] = option.dataset.value;
        // Drop later answers so "Back" then a change re-runs cleanly.
        for (var i = this.state.step + 1; i < this.total; i++) delete this.state.answers[this.config.questions[i].id];
        option.setAttribute("aria-pressed", "true");
        this.state.step = Math.min(this.state.step + 1, this.total);
        this.persist();
        window.byo_quiz_progress = this.answeredCount() + "/" + this.total;
        document.dispatchEvent(new CustomEvent("byo-quiz:answer", { detail: { question: q.id, value: option.dataset.value, progress: window.byo_quiz_progress } }));
        var self = this;
        window.setTimeout(function () { self.render(); }, 160);
        return;
      }
      if (evt.target.closest("[data-quiz-back]")) {
        this.state.step = Math.max(0, this.state.step - 1);
        this.persist();
        this.render();
      }
    }

    onResultsClick(evt) {
      if (evt.target.closest("[data-quiz-restart]")) {
        this.reset();
        return;
      }
      var addAll = evt.target.closest("[data-quiz-add-all]");
      if (addAll) this.addAllToBundle(addAll);
    }

    reset() {
      this.state = { step: 0, answers: {} };
      this.persist();
      this.publish(null);
      this.render();
      if (this.classList.contains("byo-quiz--collapsed")) this.toggle();
    }

    /**
     * Clicks the matching "+ ADD TO BUNDLE" controls that the existing BYO
     * builder renders (snippets/product-item--ATC-BYO.liquid), so the
     * recommendation flows into the bundle bar without duplicating cart logic.
     */
    addAllToBundle(button) {
      var added = 0, missing = [];
      (window.byo_quiz_products || []).forEach(function (variantId) {
        var el = document.querySelector('.product-item--BYO-ATC[data-id="' + variantId + '"], .product-item--BYO-ATC-variant[data-id="' + variantId + '"]');
        if (!el) { missing.push(variantId); return; }
        if (!el.classList.contains("active") && !el.classList.contains("disabled")) { el.click(); added++; }
      });
      document.dispatchEvent(new CustomEvent("byo-quiz:add-all", { detail: { added: added, missing: missing, products: window.byo_quiz_products } }));
      if (added || !missing.length) {
        button.textContent = this.config.copy.added || "Added to your bundle";
        button.classList.add("byo-quiz__add-all--done");
        button.disabled = true;
      }
    }

    /* ---------- render ---------- */

    render() {
      if (this.complete) {
        var items = this.recommend(this.state.answers);
        this.publish(items);
        this.renderResults(items);
      } else {
        if (window.byo_quiz_products.length) this.publish(null);
        this.renderQuestion();
      }
    }

    renderQuestion() {
      var q = this.config.questions[this.state.step];
      if (!q) return;
      var copy = this.config.copy;
      var current = this.state.answers[q.id];
      var label = String(copy.question_label || "Question {n} of {total}").replace("{n}", this.state.step + 1).replace("{total}", this.total);

      var options = (q.options || []).map(function (o) {
        return '<button type="button" class="byo-quiz__option" data-quiz-option data-value="' + esc(o.value) + '" aria-pressed="' + (current === o.value ? "true" : "false") + '">' + esc(o.label) + "</button>";
      }).join("");

      var back = this.state.step > 0
        ? '<button type="button" class="byo-quiz__back" data-quiz-back>' + esc(copy.back || "Back") + "</button>"
        : "";

      this.questionsEl.innerHTML =
        '<div class="byo-quiz__question" data-step="' + (this.state.step + 1) + '">' +
          '<div class="byo-quiz__question-copy">' +
            '<span class="byo-quiz__question-label">' + esc(label) + "</span>" +
            '<h3 class="byo-quiz__question-title">' + esc(q.title) + "</h3>" +
          "</div>" +
          '<div class="byo-quiz__options" role="group" aria-label="' + esc(q.title) + '">' + options + back + "</div>" +
        "</div>";
      this.questionsEl.hidden = false;
      this.resultsEl.hidden = true;
      this.resultsEl.innerHTML = "";
    }

    renderResults(items) {
      var copy = this.config.copy;
      var labels = this.answerLabels();
      var catLabel = {};
      this.config.categories.forEach(function (c) { catLabel[c.id] = c.label; });

      var chips = [
        labels.age,
        labels.skin_type ? labels.skin_type.toLowerCase() + " skin" : null,
        labels.concern ? labels.concern.toLowerCase() : null
      ].filter(Boolean).map(function (t) { return '<span class="byo-quiz__chip">' + esc(t) + "</span>"; }).join("");

      var cards = items.map(function (p, i) {
        var step = String(copy.step || "Step {n}").replace("{n}", i + 1);
        return (
          '<a class="byo-quiz__card" href="' + esc(p.url) + '" data-variant-id="' + esc(p.variant_id) + '">' +
            '<span class="byo-quiz__card-image">' + (p.image ? '<img src="' + esc(p.image) + '" alt="" loading="lazy" width="120" height="150">' : "") + "</span>" +
            '<span class="byo-quiz__card-info">' +
              '<span class="byo-quiz__card-cat">' + esc(catLabel[p.category] || p.category) + "</span>" +
              '<span class="byo-quiz__card-title">' + esc(p.title) + "</span>" +
              (p.subtitle ? '<span class="byo-quiz__card-sub">' + esc(p.subtitle) + "</span>" : "") +
              '<span class="byo-quiz__card-price">' + esc(p.price) + "</span>" +
            "</span>" +
            '<span class="byo-quiz__badge"><span class="byo-quiz__badge-usage">' + esc(p.usage || "") + '</span><span class="byo-quiz__badge-step">' + esc(step) + "</span></span>" +
          "</a>"
        );
      }).join("");

      var addAll = this.config.show_add_all && items.length
        ? '<button type="button" class="byo-quiz__add-all button button--primary" data-quiz-add-all>' + esc(copy.add_all || "Add all to bundle") + "</button>"
        : "";

      this.resultsEl.innerHTML =
        '<div class="byo-quiz__results-head">' +
          '<div class="byo-quiz__results-copy">' +
            '<h3 class="byo-quiz__results-title">' + esc(copy.results_title) + "</h3>" +
            (copy.results_subtitle ? '<p class="byo-quiz__results-subtitle">' + esc(copy.results_subtitle) + "</p>" : "") +
            '<div class="byo-quiz__chips">' + chips + "</div>" +
          "</div>" +
          '<button type="button" class="byo-quiz__restart" data-quiz-restart>' + esc(copy.start_again || "Start again") + "</button>" +
        "</div>" +
        (items.length
          ? '<div class="byo-quiz__cards">' + cards + "</div>"
          : '<p class="byo-quiz__empty">' + esc(copy.empty || "") + "</p>") +
        addAll +
        (copy.disclaimer ? '<p class="byo-quiz__disclaimer">' + esc(copy.disclaimer) + "</p>" : "") +
        (copy.footnote && items.length ? '<p class="byo-quiz__footnote">' + esc(copy.footnote) + "</p>" : "");

      this.questionsEl.hidden = true;
      this.questionsEl.innerHTML = "";
      this.resultsEl.hidden = false;
    }
  }

  window.customElements.define("byo-quiz", BYOQuiz);
})();
