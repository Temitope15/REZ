/* REZ widget loader. Usage:
   <script src="https://YOUR-REZ-HOST/widget.js" data-rez-key="rez_xxx" async></script> */
(function () {
  if (window.__rezLoaded) return;
  window.__rezLoaded = true;

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    for (var i = s.length - 1; i >= 0; i--) if (s[i].getAttribute('data-rez-key')) return s[i];
    return null;
  })();
  if (!script) return;

  var key = script.getAttribute('data-rez-key');
  var host = script.getAttribute('data-rez-host') || new URL(script.src).origin;
  var color = script.getAttribute('data-rez-color') || '#2563eb';
  if (!key) return;

  var frameUrl = host + '/widget/' + encodeURIComponent(key) + '?host=' + encodeURIComponent(location.hostname);

  var style = document.createElement('style');
  style.textContent =
    '.rez-btn{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:2147483000;display:flex;align-items:center;justify-content:center;transition:transform .15s}' +
    '.rez-btn:hover{transform:scale(1.05)}' +
    '.rez-frame{position:fixed;right:20px;bottom:88px;width:380px;height:min(600px,calc(100vh - 110px));border:0;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.25);z-index:2147483000;background:#fff;display:none}' +
    '.rez-frame.open{display:block}' +
    '@media (max-width:480px){.rez-frame{right:0;bottom:0;width:100vw;height:100vh;border-radius:0}}';
  document.head.appendChild(style);

  var frame = document.createElement('iframe');
  frame.className = 'rez-frame';
  frame.src = frameUrl;
  frame.title = 'Chat with support';
  frame.setAttribute('allow', 'clipboard-write');

  var btn = document.createElement('button');
  btn.className = 'rez-btn';
  btn.style.background = color;
  btn.setAttribute('aria-label', 'Open support chat');
  var chatIcon = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var closeIcon = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  btn.innerHTML = chatIcon;

  var open = false;
  function toggle(force) {
    open = typeof force === 'boolean' ? force : !open;
    frame.classList.toggle('open', open);
    btn.innerHTML = open ? closeIcon : chatIcon;
  }
  btn.addEventListener('click', function () { toggle(); });
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'rez:close') toggle(false);
  });

  document.body.appendChild(frame);
  document.body.appendChild(btn);
  window.Rez = {open: function () { toggle(true); }, close: function () { toggle(false); }, toggle: toggle};
})();
