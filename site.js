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

  document.addEventListener("DOMContentLoaded", function () {
    applyLang(getLang());
    initToggle();
    initScrollSpy();
    initPalette();
  });
})();
