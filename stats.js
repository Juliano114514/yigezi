/*! Visit statistics / 访问统计
 * Shows the current referral category and sends total/source counter requests
 * to Abacus. Busuanzi separately fills the page/visitor count elements.
 * The external services receive network requests; their data handling is
 * governed by their own policies.
 */
(function () {
  'use strict';

  // ⚠️ Abacus 的命名空间和 key 都不能含 . 或 /（会返回 308 重定向，计数静默丢失）
  //    所以这里用连字符拼接，不要改成域名形式。
  var NS = 'juliano114514-yigezi';
  var ABACUS = 'https://abacus.jasoncameron.dev/hit/';

  var NAMES = {
    'direct':       ['stats.source.direct', 'Direct visit'],
    'indep-list':   ['stats.source.indepList', 'Chinese Independent Developers'],
    'weekly':       ['stats.source.weekly', 'Ruanyifeng’s Weekly'],
    'hellogithub':  ['stats.source.helloGithub', 'HelloGitHub'],
    'xiaohongshu':  ['stats.source.xiaohongshu', 'Xiaohongshu'],
    'im':           ['stats.source.im', 'WeChat / QQ'],
    'search':       ['stats.source.search', 'Search engine'],
    'github':       ['stats.source.github', 'GitHub'],
    'github-other': ['stats.source.githubOther', 'Other GitHub page'],
    'internal':     ['stats.source.internal', 'Internal link'],
    'other':        ['stats.source.other', 'Other site']
  };

  function detectSource() {
    var q = null;
    try { q = new URLSearchParams(location.search); } catch (e) {}
    if (q && q.get('from')) {                       // 链接上手动标了 ?from=xxx
      return String(q.get('from')).slice(0, 32).replace(/[^a-zA-Z0-9_-]/g, '');
    }
    var r = document.referrer || '';
    if (!r) return 'direct';
    if (/1c7\/chinese-independent-developer/i.test(r))  return 'indep-list';
    if (/ruanyf\/weekly/i.test(r))                      return 'weekly';
    if (/hellogithub/i.test(r))                         return 'hellogithub';
    if (/xiaohongshu|xhslink/i.test(r))                 return 'xiaohongshu';
    if (/weixin|wechat|qq\.com|qzone|douyin/i.test(r))  return 'im';
    if (/baidu\.|bing\.|google\.|sogou\.|so\.com/i.test(r)) return 'search';
    if (/github\.com/i.test(r))                         return 'github-other';
    try {
      return new URL(r).hostname === location.hostname ? 'internal' : 'other';
    } catch (e) { return 'other'; }
  }

  var src = detectSource();

  // 显示来源
  function showSource() {
    var el = document.getElementById('stat-source');
    var name = Object.prototype.hasOwnProperty.call(NAMES, src) ? NAMES[src] : null;
    if (!el) return;
    if (!name) { el.textContent = src; return; }
    var i18n = window.YigeziI18n;
    el.textContent = i18n && typeof i18n.t === 'function' ? i18n.t(name[0]) : name[1];
  }

  // 计数（失败不影响任何功能）
  function ping(key) {
    try {
      var p = fetch(ABACUS + NS + '/' + encodeURIComponent(key),
                    { mode: 'cors', cache: 'no-store' });
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }

  function run() {
    showSource();
    // Keep file:// lookup and export entirely local. Hosted pages retain counts.
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    if (!document.getElementById('busuanzi-script')) {
      var script = document.createElement('script');
      script.id = 'busuanzi-script';
      script.async = true;
      script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
      document.head.appendChild(script);
    }
    ping('total');
    ping('src-' + src);
  }

  window.addEventListener('languagechange', showSource);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
