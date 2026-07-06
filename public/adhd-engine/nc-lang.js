/**
 * ============================================================================
 * nc-lang.js — Global language sync across NeuroCatchers pages
 * ============================================================================
 *
 * Single source of truth for body[data-lang] across all pages. Replaces the
 * fragmented per-page setLang implementations that drifted out of sync.
 *
 * Storage model (Option B per BCN spec):
 *   localStorage  'nc_lang'       = global default — survives across pages/tabs
 *   sessionStorage 'nc_lang_page'  = per-tab override — current page only,
 *                                    cleared the moment the user picks a
 *                                    global ("set as default") toggle
 *   localStorage  'bnm_lang'       = legacy mirror — kept in sync for the
 *                                    bnm-lang-sync.js cross-domain link writer
 *
 * Resolution order on every page load:
 *   1. sessionStorage 'nc_lang_page' (page-scoped override)
 *   2. localStorage   'nc_lang'      (global default — set on any page)
 *   3. localStorage   'bnm_lang'     (legacy — mirrored back to nc_lang on read)
 *   4. 'ko'                          (BCN default — Korean-first product)
 *
 * Public API (auto-attached to window):
 *   ncSetLang(lang)               — set globally (default scope)
 *   ncSetLang(lang, 'page')       — set for current tab only
 *   ncGetLang()                   — read currently-applied lang
 *   event 'nc-lang-change'        — { detail: { lang, scope } } on every change
 *
 * Behaviors handled automatically:
 *   - body[data-lang] + html[lang] applied on init + every change
 *   - Toggle buttons [data-lang-btn="ko|en"] OR legacy [data-lang-set="ko|en"]
 *     OR id="btn-lang-ko" / id="btn-lang-en" — all get .active swapped
 *   - <select option[data-ko]> textContent updated (CSS can't reach into option)
 *   - <input data-ph-ko data-ph-en> placeholders updated
 *   - storage event listener — cross-TAB sync (other open tabs auto-update)
 *
 * Pages opt in via:
 *   <script src=".../symptom_catcher/shared/nc-lang.js"></script>
 *
 * Existing per-page setLang functions can keep doing their own re-render work
 * via the nc-lang-change event listener — this script does NOT replace render
 * logic, only owns the canonical "what language is active" state.
 * ============================================================================
 */
(function(){
  'use strict';
  if (window.__ncLangLoaded) return;
  window.__ncLangLoaded = true;

  var NC_LANG_KEY   = 'nc_lang';
  var PAGE_LANG_KEY = 'nc_lang_page';
  var BNM_KEY       = 'bnm_lang';
  var DEFAULT_LANG  = 'en';

  function normalizeLang(v){
    if (v === 'ko' || v === 'kr' || v === 'KR' || v === 'KO') return 'ko';
    if (v === 'en' || v === 'EN') return 'en';
    return null;
  }

  function readGlobalLang(){
    try {
      // bnm_lang is the canonical cross-domain store — bnm-lang-sync.js owns the
      // URL ?lang= signal and cross-domain hops and writes it here, so it must win
      // over a stale nc_lang from an earlier visit. They're kept mirrored on every
      // ncSetLang(), so this only changes who wins when they diverge (cross-domain).
      var bnm = normalizeLang(localStorage.getItem(BNM_KEY));
      if (bnm) {
        try { localStorage.setItem(NC_LANG_KEY, bnm); } catch(e){}
        return bnm;
      }
      var nc = normalizeLang(localStorage.getItem(NC_LANG_KEY));
      if (nc) {
        try { localStorage.setItem(BNM_KEY, nc); } catch(e){}
        return nc;
      }
    } catch(e){}
    return DEFAULT_LANG;
  }

  function readPageLang(){
    try { return normalizeLang(sessionStorage.getItem(PAGE_LANG_KEY)); } catch(e){ return null; }
  }

  function getCurrentLang(){
    return readPageLang() || readGlobalLang();
  }

  function updateButtons(lang){
    // Convention 1: data-lang-btn="ko|en"
    document.querySelectorAll('[data-lang-btn]').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-lang-btn') === lang);
    });
    // Convention 2 (symptom-admin legacy): data-lang-set="ko|en"
    document.querySelectorAll('[data-lang-set]').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-lang-set') === lang);
    });
    // Convention 3 (triage / clinician-dashboard): id-based
    var koBtn = document.getElementById('btn-lang-ko');
    var enBtn = document.getElementById('btn-lang-en');
    if (koBtn) koBtn.classList.toggle('active', lang === 'ko');
    if (enBtn) enBtn.classList.toggle('active', lang === 'en');
  }

  function updateStaticI18n(lang){
    // <select option[data-ko]> — CSS span toggle doesn't work inside <option>
    document.querySelectorAll('select option[data-ko]').forEach(function(o){
      var t = lang === 'en' ? o.dataset.en : o.dataset.ko;
      if (t) o.textContent = t;
    });
    // <input data-ph-ko data-ph-en> placeholders
    document.querySelectorAll('input[data-ph-ko],textarea[data-ph-ko]').forEach(function(i){
      var p = lang === 'en' ? i.dataset.phEn : i.dataset.phKo;
      if (p) i.placeholder = p;
    });
    // [data-ko-title] tooltips (legacy convention from triage)
    document.querySelectorAll('[data-ko-title]').forEach(function(el){
      var t = lang === 'en' ? (el.getAttribute('data-en-title') || el.getAttribute('data-ko-title'))
                            : el.getAttribute('data-ko-title');
      if (t) el.title = t;
    });
    // [data-tooltip-ko][data-tooltip-en] icon-button tooltips — mirrored to
    // both `title` (native browser tooltip, works everywhere incl. mobile
    // tap-and-hold) and `data-tooltip` (consumed by the CSS hover tooltip
    // injected by ensureTooltipStyles below).
    document.querySelectorAll('[data-tooltip-ko]').forEach(function(el){
      var tip = lang === 'en'
        ? (el.getAttribute('data-tooltip-en') || el.getAttribute('data-tooltip-ko'))
        : (el.getAttribute('data-tooltip-ko') || el.getAttribute('data-tooltip-en'));
      if (tip) {
        el.setAttribute('title', tip);
        el.setAttribute('data-tooltip', tip);
      }
    });
  }

  // Inject hover-tooltip CSS once. Used by any element with data-tooltip set
  // (which updateStaticI18n keeps in sync with the active language).
  function ensureTooltipStyles(){
    if (document.getElementById('nc-tooltip-styles')) return;
    var style = document.createElement('style');
    style.id = 'nc-tooltip-styles';
    style.textContent =
      '[data-tooltip]{position:relative}' +
      '[data-tooltip]::after{' +
        'content:attr(data-tooltip);' +
        'position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);' +
        'background:#2A1108;color:#fff;padding:5px 10px;border-radius:6px;' +
        'font-size:0.82em;font-weight:500;line-height:1.3;white-space:nowrap;' +
        'box-shadow:0 4px 12px rgba(42,17,8,0.25);' +
        'opacity:0;pointer-events:none;' +
        'transition:opacity 0.15s ease-in-out;transition-delay:0s;' +
        'z-index:9999;' +
      '}' +
      '[data-tooltip]:hover::after,[data-tooltip]:focus-visible::after{' +
        'opacity:1;transition-delay:0.3s;' +
      '}' +
      // Don't double-render: if title and data-tooltip both exist the native
      // browser tooltip also appears. CSS pseudo wins visually (z:9999) but
      // the native one is fine as a fallback.
      '@media (hover:none){[data-tooltip]::after{display:none}}';
    document.head.appendChild(style);
  }

  function applyLang(lang, scope){
    if (document.body) document.body.setAttribute('data-lang', lang);
    if (document.documentElement) document.documentElement.setAttribute('lang', lang);
    if (document.head) ensureTooltipStyles();
    updateButtons(lang);
    updateStaticI18n(lang);
    try {
      window.dispatchEvent(new CustomEvent('nc-lang-change', {
        detail: { lang: lang, scope: scope || 'init' }
      }));
    } catch(e){}
  }

  // Public API
  window.ncSetLang = function(lang, scope){
    var n = normalizeLang(lang);
    if (!n) return;
    if (scope === 'page') {
      // Per-tab override — does NOT touch localStorage
      try { sessionStorage.setItem(PAGE_LANG_KEY, n); } catch(e){}
      applyLang(n, 'page');
    } else {
      // Global default — clear page override + write localStorage (+ mirror to bnm_lang)
      try {
        sessionStorage.removeItem(PAGE_LANG_KEY);
        localStorage.setItem(NC_LANG_KEY, n);
        localStorage.setItem(BNM_KEY, n);
      } catch(e){}
      applyLang(n, 'global');
    }
  };

  window.ncGetLang = function(){ return getCurrentLang(); };
  window.ncGetScope = function(){
    return readPageLang() ? 'page' : 'global';
  };
  // Call after rendering new DOM with [data-tooltip-ko], [data-ko], etc.
  // so newly-added elements get their title / data-tooltip / option text set.
  window.ncRefresh = function(){
    var lang = getCurrentLang();
    if (document.head) ensureTooltipStyles();
    updateButtons(lang);
    updateStaticI18n(lang);
  };

  // Cross-tab sync — when another tab writes localStorage 'nc_lang', mirror here
  // (but only if THIS tab has no page-scoped override active)
  window.addEventListener('storage', function(e){
    if (e.key !== NC_LANG_KEY || !e.newValue) return;
    if (readPageLang()) return;  // page override wins; ignore cross-tab change
    var n = normalizeLang(e.newValue);
    if (!n) return;
    applyLang(n, 'global-storage');
  });

  // Init — run as early as possible. Document may be in 'loading' state and
  // document.body may be null; applyLang handles that gracefully by checking.
  function init(){ applyLang(getCurrentLang(), 'init'); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    // Also try right now — body may already exist if this <script> is in <body>
    if (document.body) applyLang(getCurrentLang(), 'init');
  } else {
    init();
  }
})();
