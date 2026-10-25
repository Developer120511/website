/* ============================================================
   TitanDrive · Archivo Digital — lógica compartida (assets/app.js)
   Usada por index.html, repositorio.html y herramientas.html.
   Detecta automáticamente qué elementos existen en cada página.
   ============================================================ */
(function () {
  "use strict";

  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var raf = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : function (cb) { return setTimeout(function () { cb(Date.now()); }, 16); };

  /* ---------- Utilidades ---------- */
  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeUrl(url) {
    var u = String(url == null ? "" : url).trim();
    return /^https?:\/\//i.test(u) ? u : "#";
  }
  function pad2(n) { return String(n).padStart(2, "0"); }

  /* ---------- Preloader ---------- */
  function hidePreloader() {
    var pl = document.getElementById("preloader");
    if (!pl) return;
    pl.classList.add("done");
    setTimeout(function () { if (pl.parentNode) pl.parentNode.removeChild(pl); }, 700);
  }
  if (document.readyState === "complete") setTimeout(hidePreloader, 550);
  else window.addEventListener("load", function () { setTimeout(hidePreloader, 550); });
  setTimeout(hidePreloader, 4200);

  /* ---------- Partículas ---------- */
  function initDust() {
    var canvas = document.getElementById("dust-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = null;
    try { ctx = canvas.getContext("2d"); } catch (e) { ctx = null; }
    if (!ctx) return;

    var nodes = [], w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var mouse = { x: -9999, y: -9999 };
    var LINK = 132;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }
    function build() {
      var density = Math.round((w * h) / 20000);
      var total = Math.max(26, Math.min(reduce ? 26 : 92, density));
      nodes = [];
      for (var i = 0; i < total; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - .5) * (reduce ? .04 : .28),
          vy: (Math.random() - .5) * (reduce ? .04 : .28),
          r: Math.random() * 1.5 + .5
        });
      }
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;

        var dxm = n.x - mouse.x, dym = n.y - mouse.y;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 150 && dm > 0.001) {
          var force = (150 - dm) / 150;
          n.x += (dxm / dm) * force * 1.15;
          n.y += (dym / dm) * force * 1.15;
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(201,162,39,0.55)";
        ctx.fill();
      }
      if (!reduce) {
        for (var a = 0; a < nodes.length; a++) {
          for (var b = a + 1; b < nodes.length; b++) {
            var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < LINK) {
              ctx.beginPath();
              ctx.moveTo(nodes[a].x, nodes[a].y);
              ctx.lineTo(nodes[b].x, nodes[b].y);
              ctx.strokeStyle = "rgba(201,162,39," + (0.13 * (1 - d / LINK)).toFixed(3) + ")";
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }
      raf(frame);
    }
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener("mouseleave", function () { mouse.x = -9999; mouse.y = -9999; });
    resize();
    frame();
  }

  /* ---------- Spotlight de cursor ---------- */
  function initSpotlight() {
    var el = document.querySelector(".spotlight");
    if (!el || reduce) return;
    window.addEventListener("mousemove", function (e) {
      el.style.setProperty("--mx", e.clientX + "px");
      el.style.setProperty("--my", e.clientY + "px");
    }, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal:not(.in-view)");
    if (!items.length) return;
    if (reduce || !("IntersectionObserver" in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add("in-view");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in-view"); io.unobserve(en.target); }
      });
    }, { threshold: .12, rootMargin: "0px 0px -8% 0px" });
    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  /* ---------- Contadores ---------- */
  function animateCount(el, target, dur) {
    if (reduce) { el.textContent = target; return; }
    var start = (window.performance && performance.now) ? performance.now() : Date.now();
    function step(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) raf(step);
      else el.textContent = target;
    }
    raf(step);
  }
  function initCounters() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(els, function (el) { el.textContent = el.getAttribute("data-count"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        animateCount(el, parseInt(el.getAttribute("data-count"), 10) || 0, 1400);
        io.unobserve(el);
      });
    }, { threshold: .5 });
    for (var i = 0; i < els.length; i++) io.observe(els[i]);
  }

  /* ---------- Tilt + glow ---------- */
  function initCardMotion() {
    if (reduce) return;
    var cards = document.querySelectorAll(".feature-card, .repo-card");
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener("mousemove", function (e) {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width;
          var py = (e.clientY - r.top) / r.height;
          card.style.setProperty("--cx", (px * 100) + "%");
          card.style.setProperty("--cy", (py * 100) + "%");
          if (card.classList.contains("repo-card")) {
            card.style.transform = "translateY(-7px) rotateX(" + ((.5 - py) * 4).toFixed(2) + "deg) rotateY(" + ((px - .5) * 4).toFixed(2) + "deg)";
          }
        });
        card.addEventListener("mouseleave", function () { card.style.transform = ""; });
      })(cards[i]);
    }
  }

  /* ---------- Header / progreso / volver arriba ---------- */
  function initChrome() {
    var header = document.getElementById("header");
    var bar = document.getElementById("scrollProgress");
    var toTop = document.getElementById("toTop");
    function onScroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (header) header.classList.toggle("scrolled", y > 24);
      if (bar) {
        var docH = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (docH > 0 ? Math.min(100, (y / docH) * 100) : 0) + "%";
      }
      if (toTop) toTop.classList.toggle("show", y > 520);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (toTop) toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* ---------- Menú móvil ---------- */
  function initNav() {
    var toggle = document.getElementById("navToggle");
    var links = document.querySelector(".nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) { links.classList.remove("open"); toggle.classList.remove("open"); }
    });
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }
  window.tdToast = toast;

  /* ---------- Copiar al portapapeles ---------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast("Copiado: " + text); },
        function () { fallbackCopy(text); });
    } else { fallbackCopy(text); }
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast("Copiado: " + text);
    } catch (e) { toast(text); }
  }

  /* ---------- Descarga directa (sin abrir página) ---------- */
  function triggerDownload(url) {
    if (!url) return;
    try {
      var a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", "");
      a.rel = "noopener";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 1500);
      toast("Iniciando descarga…");
    } catch (e) {
      window.open(url, "_blank", "noopener");
    }
  }

  /* Resuelve el enlace más reciente de Segurmática (el nombre cambia a diario) */
  var SEGAV_PAGE = "https://www.segurmatica.cu/descargas/index.php";
  var SEGAV_RE = /\/actualizaciones\/segavzip\/(\d{14}\.zip)/;
  function resolveLatest(kind, cb) {
    if (kind !== "segav" || typeof fetch !== "function") { cb(null); return; }
    var target = encodeURIComponent(SEGAV_PAGE);
    var urls = [
      "https://api.allorigins.win/raw?url=" + target,
      "https://api.codetabs.com/v1/proxy?quest=" + target
    ];
    var i = 0;
    function attempt() {
      if (i >= urls.length) { cb(null); return; }
      var done = false;
      var timer = setTimeout(function () { if (!done) { done = true; attempt(); } }, 7000);
      fetch(urls[i++], { cache: "no-store" })
        .then(function (r) { return r.ok ? r.text() : Promise.reject(new Error("HTTP " + r.status)); })
        .then(function (txt) {
          if (done) return;
          done = true; clearTimeout(timer);
          var m = txt.match(SEGAV_RE);
          if (m) cb("https://www.segurmatica.cu/descargas/actualizaciones/segavzip/" + m[1]);
          else attempt();
        })
        .catch(function () {
          if (done) return;
          done = true; clearTimeout(timer); attempt();
        });
    }
    attempt();
  }

  /* ---------- Modal (compartido) ---------- */
  var Modal = (function () {
    var overlay, mIcon, mTitle, mDesc, mContent, lastFocus;

    function init() {
      overlay = document.getElementById("modalOverlay");
      if (!overlay) return false;
      mIcon = document.getElementById("modalIcon");
      mTitle = document.getElementById("modalTitle");
      mDesc = document.getElementById("modalDesc");
      mContent = document.getElementById("modalContent");

      var cx = document.getElementById("modalCloseX");
      var cb = document.getElementById("modalCloseBtn");
      if (cx) cx.addEventListener("click", close);
      if (cb) cb.addEventListener("click", close);
      overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && overlay.classList.contains("open")) close();
      });
      if (mContent) mContent.addEventListener("click", function (e) {
        var copy = e.target.closest(".note-copy");
        if (copy) { copyText(copy.getAttribute("data-copy") || ""); return; }
        var row = e.target.closest(".file-row-dl");
        if (row) { e.preventDefault(); startRowDownload(row); return; }
        var a = e.target.closest(".file-dl");
        if (a) toast("Abriendo enlace…");
      });
      if (mContent) mContent.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
        var row = e.target.closest(".file-row-dl");
        if (row) { e.preventDefault(); startRowDownload(row); }
      });
      return true;
    }

    function startRowDownload(row) {
      var url = row.getAttribute("data-url");
      var kind = row.getAttribute("data-resolver");
      if (kind) {
        toast("Buscando la última actualización…");
        resolveLatest(kind, function (latest) { triggerDownload(latest || url); });
      } else {
        triggerDownload(url);
      }
    }

    function open(folder, code) {
      if (!folder || !overlay) return;
      lastFocus = document.activeElement;
      var items = folder.items || [];
      if (mIcon) mIcon.textContent = folder.icon || "•";
      if (mTitle) mTitle.innerHTML = '<span class="code">' + esc(code || "") + '</span>' + esc(folder.name);
      if (mDesc) mDesc.textContent = items.length
        ? (items.length + " enlace" + (items.length === 1 ? "" : "s") + " disponible" + (items.length === 1 ? "" : "s"))
        : "Sin archivos publicados todavía";
      if (mContent) {
        var html = items.length
          ? items.map(function (it, i) {
              var dl = !!it.download;
              var attrs = ' data-url="' + esc(safeUrl(it.url)) + '"' + (it.resolver ? ' data-resolver="' + esc(it.resolver) + '"' : '');
              return '<div class="file-row' + (dl ? ' file-row-dl' : '') + '"' + (dl ? ' role="button" tabindex="0"' : '') + attrs + ' style="animation-delay:' + (i * 0.04) + 's">' +
                '<span class="file-icon">' + pad2(i + 1) + '</span>' +
                '<span class="file-info"><span class="file-name">' + esc(it.name) + (dl ? ' <span class="dl-tag">Descarga automática</span>' : '') + '</span></span>' +
                '<a class="file-dl" href="' + esc(safeUrl(it.url)) + '"' + (dl ? ' download' : ' target="_blank" rel="noopener noreferrer"') + '>' + (dl ? 'Descargar' : 'Abrir') + '</a>' +
              '</div>';
            }).join("")
          : '<p class="modal-empty">Esta carpeta aún no tiene contenido publicado. Vuelve pronto.</p>';
        if (folder.note) {
          html += '<div class="tool-note">' +
            '<span class="note-tag">Importante</span>' +
            '<span class="note-value">' + esc(folder.note) + '</span>' +
            '<button type="button" class="note-copy" data-copy="' + esc(folder.note) + '">Copiar</button>' +
          '</div>';
        }
        mContent.innerHTML = html;
      }
      overlay.classList.add("open");
      document.body.classList.add("is-locked");
      var btn = overlay.querySelector(".modal-close-x");
      if (btn) btn.focus();
    }

    function close() {
      if (!overlay) return;
      overlay.classList.remove("open");
      document.body.classList.remove("is-locked");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    return { init: init, open: open, close: close };
  })();

  /* ---------- Catálogo genérico (carpetas + modal + buscador) ---------- */
  function initCatalog(cfg) {
    var grid = document.getElementById(cfg.gridId);
    if (!grid) return;
    var DATA = cfg.data || [];
    var empty = document.getElementById(cfg.emptyId);
    var search = cfg.searchId ? document.getElementById(cfg.searchId) : null;
    var resultCount = cfg.countId ? document.getElementById(cfg.countId) : null;
    var prefix = cfg.prefix || "C-";
    var noun = cfg.noun || "archivo";
    var plural = cfg.nounPlural || (noun + "s");
    var unit = cfg.unit || "categorías";

    function codeFor(i) { return prefix + pad2(i + 1); }

    function cardHTML(folder, i) {
      var n = (folder.items || []).length;
      var badge = n
        ? '<span class="count-badge">' + n + ' ' + (n === 1 ? noun : plural) + '</span>'
        : '<span class="count-badge soon">Próximamente</span>';
      return '<article class="repo-card reveal" data-idx="' + i + '" role="button" tabindex="0" aria-label="Abrir ' + esc(folder.name) + '">' +
        '<div class="repo-card-top">' +
          '<span class="repo-icon" aria-hidden="true">' + esc(folder.icon) + '</span>' +
          badge +
        '</div>' +
        '<h3>' + esc(folder.name) + '</h3>' +
        '<div class="repo-card-foot">' +
          '<span class="open">' + codeFor(i) + '</span>' +
          '<span class="arrow">→</span>' +
        '</div>' +
      '</article>';
    }

    function render(list) {
      if (!list.length) {
        grid.innerHTML = "";
        if (empty) empty.style.display = "block";
      } else {
        if (empty) empty.style.display = "none";
        grid.innerHTML = list.map(function (p) { return cardHTML(p.folder, p.index); }).join("");
      }
      if (resultCount) {
        resultCount.textContent = list.length === DATA.length
          ? (DATA.length + " " + unit)
          : (list.length + " de " + DATA.length + " " + unit);
      }
      initReveal();
      initCardMotion();
      var cards = grid.querySelectorAll(".repo-card");
      for (var i = 0; i < cards.length; i++) {
        (function (card) {
          var idx = parseInt(card.getAttribute("data-idx"), 10);
          card.addEventListener("click", function () { Modal.open(DATA[idx], codeFor(idx)); });
          card.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
              e.preventDefault(); Modal.open(DATA[idx], codeFor(idx));
            }
          });
        })(cards[i]);
      }
    }

    function filter() {
      var q = (search && search.value ? search.value : "").trim().toLowerCase();
      if (!q) { render(DATA.map(function (f, i) { return { folder: f, index: i }; })); return; }
      var out = [];
      DATA.forEach(function (f, i) {
        var hit = f.name.toLowerCase().indexOf(q) !== -1 ||
          (f.items || []).some(function (it) { return it.name.toLowerCase().indexOf(q) !== -1; });
        if (hit) out.push({ folder: f, index: i });
      });
      render(out);
    }

    if (search) {
      var t = null;
      search.addEventListener("input", function () { clearTimeout(t); t = setTimeout(filter, 130); });
    }
    render(DATA.map(function (f, i) { return { folder: f, index: i }; }));
  }

  /* ---------- Recurso destacado (solo repositorio) ---------- */
  function initFeatured() {
    var el = document.getElementById("featuredResource");
    var F = window.TITANDRIVE_FEATURED;
    if (!el || !F) return;
    el.innerHTML =
      '<article class="featured-card reveal">' +
        '<div class="featured-main">' +
          '<span class="featured-tag">Destacado · ' + esc(F.code) + '</span>' +
          '<h3>' + esc(F.name) + '</h3>' +
          '<p>' + esc(F.description) + '</p>' +
        '</div>' +
        '<a class="btn btn-primary" href="' + esc(safeUrl(F.url)) + '" target="_blank" rel="noopener noreferrer">Descargar <span class="arw">→</span></a>' +
      '</article>';
  }

  /* ---------- Estadísticas / fecha compartida ---------- */
  function initMeta() {
    var cat = window.TITANDRIVE_CATALOG || [];
    var tools = window.TITANDRIVE_HERRAMIENTAS || [];
    var items = cat.reduce(function (a, f) { return a + ((f.items && f.items.length) || 0); }, 0);
    var total = items + (window.TITANDRIVE_FEATURED ? 1 : 0);
    var set = function (id, val) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("data-count", val);
    };
    set("statCategoriesHome", cat.length);
    set("statFilesHome", total);
    set("statCategories", cat.length);
    set("statFiles", total);
    set("statTools", tools.length);

    var updated = (window.TITANDRIVE_SITE && window.TITANDRIVE_SITE.updated) || "";
    ["metaUpdated", "metaUpdatedRepo", "metaUpdatedTools"].forEach(function (id) {
      var y = document.getElementById(id);
      if (y && updated) y.textContent = updated;
    });
  }

  /* ---------- Arranque ---------- */
  function boot() {
    [initChrome, initNav, Modal.init, initMeta, initFeatured,
     function () { initCatalog({ gridId: "folderGrid", emptyId: "emptyState", searchId: "searchInput", countId: "resultCount", data: window.TITANDRIVE_CATALOG || [], prefix: "C-", noun: "archivo", nounPlural: "archivos", unit: "categorías" }); },
     function () { initCatalog({ gridId: "toolsGrid", emptyId: "toolsEmpty", searchId: "toolSearchInput", countId: "toolResultCount", data: window.TITANDRIVE_HERRAMIENTAS || [], prefix: "H-", noun: "enlace", nounPlural: "enlaces", unit: "carpetas" }); },
     initReveal, initCounters, initCardMotion, initDust, initSpotlight
    ].forEach(function (init) {
      try { init(); }
      catch (err) { if (window.console && console.warn) console.warn("[TitanDrive] Falló " + (init.name || "init") + ":", err); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
