/* =============================================================
   site.js — language toggle, scroll-spy, smooth nav
   Bilingual model: any element carrying data-en / data-zh has its
   text swapped on toggle. Default language is English.
   ============================================================= */
(function () {
  var STORE_KEY = "plz-lang";

  function getLang() {
    var saved = null;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) {}
    return saved === "zh" ? "zh" : "en";
  }

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
    var t = document.querySelector('meta[name="title-en"]');
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

    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
  }

  function initToggle() {
    var toggle = document.querySelector(".lang-toggle");
    if (!toggle) return;
    // Clicking anywhere on the toggle flips between EN and 中
    toggle.addEventListener("click", function () {
      applyLang(getLang() === "zh" ? "en" : "zh");
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

  // Easter egg: in English, click the name to toggle an alternate spelling.
  function initNameEgg() {
    var name = document.querySelector(".side__name");
    if (!name) return;
    var alt = name.getAttribute("data-en-alt");
    if (!alt) return;
    name.addEventListener("click", function () {
      if (document.documentElement.getAttribute("lang") === "zh") return;
      var primary = name.getAttribute("data-en");
      name.textContent = name.textContent.trim() === alt ? primary : alt;
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

  document.addEventListener("DOMContentLoaded", function () {
    applyLang(getLang());
    initToggle();
    initScrollSpy();
    initPalette();
    initPortrait();
    initNameEgg();
    initYearNav();
  });
})();
