/* =============================================================
   site.js — language toggle, scroll-spy, smooth nav
   Bilingual model: any element carrying data-en / data-zh has its
   text swapped on toggle. Default language is English.
   ============================================================= */
(function () {
  // Language is NOT persisted: every page load starts in English (the HTML
  // default), so there is no flash and every visitor enters in English.
  function applyLang(lang) {
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh" : "en");

    // Swap every translatable node
    var nodes = document.querySelectorAll("[data-en],[data-zh]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var val = el.getAttribute(lang === "zh" ? "data-zh" : "data-en");
      if (val === null) continue;
      if (el.hasAttribute("data-html")) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    }

    // Document title
    var titleEn = document.body.getAttribute("data-title-en");
    var titleZh = document.body.getAttribute("data-title-zh");
    if (titleEn && titleZh) {
      document.title = lang === "zh" ? titleZh : titleEn;
    }

    // Toggle segment states
    var segs = document.querySelectorAll(".lang-toggle .lang-seg");
    for (var j = 0; j < segs.length; j++) {
      segs[j].classList.toggle("is-active", segs[j].getAttribute("data-lang") === lang);
    }
  }

  function initToggle() {
    var toggle = document.querySelector(".lang-toggle");
    if (!toggle) return;
    // Clicking anywhere on the toggle flips between EN and 中
    toggle.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("lang") === "zh" ? "zh" : "en";
      applyLang(cur === "zh" ? "en" : "zh");
    });
  }

  // Scroll-spy for in-page nav links
  function initScrollSpy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.nav__link[data-spy]')
    );
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (l) {
      var id = l.getAttribute("href");
      if (id && id.charAt(0) === "#") map[id.slice(1)] = l;
    });
    var sections = Object.keys(map).map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("is-active"); });
          var active = map[en.target.id];
          if (active) active.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (s) { obs.observe(s); });
  }

  // Color-theme swatches: click a palette to switch the site theme
  function initPalette() {
    var THEME_KEY = "plz-theme";
    var swatches = document.querySelectorAll("[data-theme-pick]");
    if (!swatches.length) return;

    function markActive() {
      var cur = document.documentElement.getAttribute("data-theme") || "green";
      for (var i = 0; i < swatches.length; i++) {
        swatches[i].classList.toggle(
          "is-active",
          swatches[i].getAttribute("data-theme-pick") === cur
        );
      }
    }

    for (var i = 0; i < swatches.length; i++) {
      swatches[i].addEventListener("click", function () {
        var t = this.getAttribute("data-theme-pick");
        document.documentElement.setAttribute("data-theme", t);
        try { sessionStorage.setItem(THEME_KEY, t); } catch (e) {}
        markActive();
      });
    }

    markActive();
  }

  // Pick one of two portraits at random per visit (kept for the session),
  // and let clicking the photo swap between them.
  function initPortrait() {
    var wrap = document.querySelector(".portrait-wrap");
    if (!wrap) return;
    var img = wrap.querySelector(".portrait");
    var primary = img.getAttribute("src");
    var alt = img.getAttribute("data-alt-src");
    if (!alt) return;
    var KEY = "plz-portrait";
    var pa = new Image(); pa.src = primary;          // preload both for instant swaps
    var pb = new Image(); pb.src = alt;

    function apply(which) {
      var isAlt = which === "alt";
      img.setAttribute("src", isAlt ? alt : primary);
      wrap.classList.toggle("show-alt", isAlt);      // switches the date colour
    }

    var stored = null;
    try { stored = sessionStorage.getItem(KEY); } catch (e) {}
    if (stored !== "primary" && stored !== "alt") {
      stored = Math.random() < 0.5 ? "primary" : "alt";
      try { sessionStorage.setItem(KEY, stored); } catch (e) {}
    }
    apply(stored);

    img.addEventListener("click", function () {
      var next = img.getAttribute("src") === alt ? "primary" : "alt";
      apply(next);
      try { sessionStorage.setItem(KEY, next); } catch (e) {}
    });
  }

  // Easter egg: in English, click the name to toggle the given-name spelling.
  function initNameEgg() {
    var name = document.querySelector(".side__name");
    if (!name) return;
    var given = name.querySelector(".nm-given");
    if (!given) return;
    var alt = given.getAttribute("data-en-alt");
    if (!alt) return;
    name.addEventListener("click", function () {
      if (document.documentElement.getAttribute("lang") === "zh") return;
      var primary = given.getAttribute("data-en");
      given.textContent = given.textContent.trim() === alt ? primary : alt;
    });
  }

  // Easter egg: footer "Hide" button blurs identifying details on the page.
  function initPrivacy() {
    var btn = document.querySelector(".hide-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      document.body.classList.toggle("privacy");
    });
  }

  // Gallery: highlight the year chip matching the posts currently in view.
  function initYearNav() {
    var chips = Array.prototype.slice.call(document.querySelectorAll(".year-chip"));
    if (!chips.length || !("IntersectionObserver" in window)) return;
    var map = {};
    chips.forEach(function (c) { map[c.getAttribute("data-year")] = c; });
    var posts = document.querySelectorAll(".post[data-year]");
    if (!posts.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var y = en.target.getAttribute("data-year");
          chips.forEach(function (c) { c.classList.remove("is-active"); });
          if (map[y]) map[y].classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    posts.forEach(function (p) { obs.observe(p); });
  }

  // Score modals: a [data-modal] trigger opens the matching .modal.
  function initModals() {
    var triggers = document.querySelectorAll("[data-modal]");
    if (!triggers.length) return;
    var openEl = null;

    function close() {
      if (!openEl) return;
      openEl.classList.remove("is-open");
      document.body.classList.remove("modal-open");
      openEl = null;
    }
    function open(m) {
      m.classList.add("is-open");
      document.body.classList.add("modal-open");
      openEl = m;
    }

    Array.prototype.forEach.call(triggers, function (t) {
      t.addEventListener("click", function () {
        var m = document.getElementById(t.getAttribute("data-modal"));
        if (m) open(m);
      });
    });
    Array.prototype.forEach.call(
      document.querySelectorAll(".modal [data-close]"),
      function (b) { b.addEventListener("click", close); }
    );
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key === "Esc") close();
    });
  }

  // Easter egg: click any heading to make math symbols rain down.
  function initFormulaRain() {
    var heads = document.querySelectorAll(".section__title, .cv-group__head, .gallery-head h1");
    if (!heads.length) return;
    var syms = ["∫","∂","∇","π","Σ","λ","∞","√","≈","∮","Δ","θ","∑","∏","ℝ","∅","≤","≥","×","α","β","γ","φ","ψ","ω","∈","∀","∃","dx","dt"];
    function rain() {
      var layer = document.createElement("div");
      layer.className = "formula-rain";
      for (var i = 0; i < 20; i++) {
        var s = document.createElement("span");
        s.textContent = syms[Math.floor(Math.random() * syms.length)];
        s.style.left = (Math.random() * 100).toFixed(1) + "vw";
        s.style.fontSize = (1 + Math.random() * 1.7).toFixed(2) + "rem";
        s.style.animationDuration = (4.5 + Math.random() * 4).toFixed(2) + "s";
        s.style.animationDelay = (Math.random() * 1.4).toFixed(2) + "s";
        s.style.setProperty("--rot", Math.round(Math.random() * 720 - 360) + "deg");
        layer.appendChild(s);
      }
      document.body.appendChild(layer);
      setTimeout(function () { layer.remove(); }, 11000);
    }
    Array.prototype.forEach.call(heads, function (h) {
      h.addEventListener("click", rain);
    });
  }

  // Gallery: click a photo to view it large; navigate with arrows.
  function initLightbox() {
    var lb = document.getElementById("lightbox");
    if (!lb) return;
    var imgs = Array.prototype.slice.call(document.querySelectorAll(".post__media img"));
    if (!imgs.length) return;
    var lbImg = lb.querySelector(".lightbox__img");
    var lbMeta = lb.querySelector(".lightbox__meta");
    var lbCount = lb.querySelector(".lightbox__count");
    var idx = 0;

    function show(i) {
      idx = (i + imgs.length) % imgs.length;
      var img = imgs[idx];
      var post = img.closest(".post");
      lbImg.setAttribute("src", img.getAttribute("src"));
      lbImg.setAttribute("alt", img.getAttribute("alt") || "");
      var parts = [];
      var date = post.querySelector(".post__date");
      var loc = post.querySelector(".loc span");
      if (date) parts.push(date.textContent.trim());
      if (loc) parts.push(loc.textContent.trim());
      lbMeta.textContent = parts.join("  ·  ");
      lbCount.textContent = (idx + 1) + " / " + imgs.length;
    }
    function open(i) { show(i); lb.classList.add("is-open"); document.body.classList.add("modal-open"); }
    function close() { lb.classList.remove("is-open"); document.body.classList.remove("modal-open"); }

    imgs.forEach(function (img, i) {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", function () { open(i); });
    });
    Array.prototype.forEach.call(lb.querySelectorAll("[data-lb-close]"), function (b) {
      b.addEventListener("click", close);
    });
    lb.querySelector("[data-lb-prev]").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector("[data-lb-next]").addEventListener("click", function () { show(idx + 1); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape" || e.key === "Esc") close();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  // Gallery: gentle 3D tilt of photo cards toward the cursor.
  function initTilt() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var cards = document.querySelectorAll(".post__card");
    if (!cards.length) return;
    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(800px) rotateX(" + (-py * 5).toFixed(2) +
          "deg) rotateY(" + (px * 5).toFixed(2) + "deg)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  // Gallery: reveal the end-of-feed note when it scrolls into view.
  function initFeedEnd() {
    var el = document.querySelector(".feed-end");
    if (!el) return;
    if (!("IntersectionObserver" in window)) { el.classList.add("is-visible"); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { el.classList.add("is-visible"); obs.disconnect(); }
      });
    }, { threshold: 0.4 });
    obs.observe(el);
  }

  // Nav "Personal" dropdown — click to toggle, close on outside click.
  function initDropdown() {
    var dds = document.querySelectorAll(".nav__dropdown");
    if (!dds.length) return;
    Array.prototype.forEach.call(dds, function (dd) {
      var btn = dd.querySelector(".nav__dropbtn");
      if (!btn) return;
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = dd.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
    document.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".nav__dropdown.is-open"), function (dd) {
        dd.classList.remove("is-open");
        var b = dd.querySelector(".nav__dropbtn");
        if (b) b.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Travels modal — tab between maps; lazy-load each SVG on first view.
  function initTravels() {
    var modal = document.getElementById("modal-travels");
    if (!modal) return;
    var tabs = modal.querySelectorAll(".map-tab");
    var panels = modal.querySelectorAll(".map-panel");

    function ensureSvg(panel) {
      var stage = panel.querySelector(".map-stage");
      if (!stage || stage.getAttribute("data-loaded")) return;
      var url = stage.getAttribute("data-svg");
      stage.setAttribute("data-loaded", "1");
      fetch(url).then(function (r) { return r.text(); })
        .then(function (t) { stage.innerHTML = t; })
        .catch(function () { stage.setAttribute("data-loaded", ""); });
    }
    function show(map) {
      Array.prototype.forEach.call(tabs, function (t) {
        t.classList.toggle("is-active", t.getAttribute("data-map") === map);
      });
      Array.prototype.forEach.call(panels, function (p) {
        var on = p.getAttribute("data-panel") === map;
        p.hidden = !on;
        if (on) ensureSvg(p);
      });
    }
    Array.prototype.forEach.call(tabs, function (t) {
      t.addEventListener("click", function () { show(t.getAttribute("data-map")); });
    });
    // Load the default (world) map when the modal is opened.
    var trigger = document.querySelector('[data-modal="modal-travels"]');
    if (trigger) trigger.addEventListener("click", function () { show("world"); });
  }

  // Cities page: province buttons swap prefecture/district maps (lazy-loaded).
  function initCities() {
    var nav = document.querySelector(".prov-nav");
    if (!nav) return;
    var btns = document.querySelectorAll(".prov-btn");
    var panels = document.querySelectorAll(".prov-panel");

    function ensure(p) {
      var st = p.querySelector(".map-stage");
      if (!st || st.getAttribute("data-loaded")) return;
      var u = st.getAttribute("data-svg");
      st.setAttribute("data-loaded", "1");
      fetch(u).then(function (r) { return r.text(); })
        .then(function (t) { st.innerHTML = t; })
        .catch(function () { st.setAttribute("data-loaded", ""); });
    }
    function show(code) {
      Array.prototype.forEach.call(btns, function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-prov") === code);
      });
      Array.prototype.forEach.call(panels, function (p) {
        var on = p.getAttribute("data-panel") === code;
        p.hidden = !on;
        if (on) ensure(p);
      });
    }
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () { show(b.getAttribute("data-prov")); });
    });
    var def = document.querySelector(".prov-btn.is-active");
    if (def) {
      var p = document.querySelector('.prov-panel[data-panel="' + def.getAttribute("data-prov") + '"]');
      if (p) ensure(p);
    }
  }

  // Nav "CV" dropdown: download the CV PDF, or show a modal if it isn't up yet.
  function initCvDownload() {
    var trigs = document.querySelectorAll("[data-cv-download]");
    if (!trigs.length) return;
    var PDF = "assets/cv.pdf";          // upload this file to enable the download
    var modal = document.getElementById("modal-cv");
    function openM() { if (modal) { modal.classList.add("is-open"); document.body.classList.add("modal-open"); } }
    function closeM() { if (modal) { modal.classList.remove("is-open"); document.body.classList.remove("modal-open"); } }
    if (modal) {
      Array.prototype.forEach.call(modal.querySelectorAll("[data-close]"), function (b) {
        b.addEventListener("click", closeM);
      });
      document.addEventListener("keydown", function (e) {
        if ((e.key === "Escape" || e.key === "Esc") && modal.classList.contains("is-open")) closeM();
      });
    }
    Array.prototype.forEach.call(trigs, function (b) {
      b.addEventListener("click", function () {
        fetch(PDF, { method: "HEAD" }).then(function (r) {
          if (r.ok) {
            var a = document.createElement("a");
            a.href = PDF;
            a.setAttribute("download", "Peiwen_Zhou_CV.pdf");
            document.body.appendChild(a); a.click(); a.remove();
          } else { openM(); }
        }).catch(openM);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyLang("en");
    initToggle();
    initScrollSpy();
    initPalette();
    initPortrait();
    initNameEgg();
    initYearNav();
    initModals();
    initPrivacy();
    initFormulaRain();
    initLightbox();
    initTilt();
    initDropdown();
    initFeedEnd();
    initTravels();
    initCities();
    initCvDownload();
  });
})();
