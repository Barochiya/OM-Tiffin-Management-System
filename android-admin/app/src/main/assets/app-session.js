(function () {
  if (window.__omSessionInstalled) return;
  window.__omSessionInstalled = true;
  let previous = null;
  function report() {
    const token = sessionStorage.getItem('token') || '';
    if (previous === token) return;
    previous = token;
    window.OMAdminNative?.postMessage(JSON.stringify({type:'session', token}));
  }
  const set = Storage.prototype.setItem, remove = Storage.prototype.removeItem, clear = Storage.prototype.clear;
  let allowLogout = false;
  window.__omLogoutAfterForget = function () {
    allowLogout = true;
    try { document.querySelector('button[aria-label="Sign out"]')?.click(); }
    finally { allowLogout = false; }
  };
  // Wait for native encrypted storage to be durably cleared before the UI signs out.
  document.addEventListener('click', function (event) {
    if (allowLogout || !event.target.closest?.('button[aria-label="Sign out"]') || !window.OMAdminNative) return;
    event.preventDefault(); event.stopImmediatePropagation();
    window.OMAdminNative.postMessage(JSON.stringify({type:'forgetSession'}));
  }, true);
  Storage.prototype.setItem = function (key, value) { const result=set.apply(this,arguments); if(this===sessionStorage && key==='token') report(); return result; };
  Storage.prototype.removeItem = function (key) { const result=remove.apply(this,arguments); if(this===sessionStorage && key==='token') report(); return result; };
  Storage.prototype.clear = function () { const result=clear.apply(this,arguments); if(this===sessionStorage) report(); return result; };
  // 401 handlers can replace the entire document immediately; the storage hooks report first.
  window.addEventListener('pagehide',report);
  setInterval(report,1000);
  report();
})();
