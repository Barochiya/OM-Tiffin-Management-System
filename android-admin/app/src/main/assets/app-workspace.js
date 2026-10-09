(function () {
  'use strict';
  if (window.__omWorkspaceInstalled) return;
  window.__omWorkspaceInstalled = true;
  const send = data => window.OMAdminNative && window.OMAdminNative.postMessage(JSON.stringify(data));
  const icons = {
    scan: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 8v8m4-8v8m3-8v8m3-8v8"/>',
    meals: '<path d="M5 3v7m3-7v7M3 7h7m-4 3v11M17 3v18m0-18c-5 3-5 9 0 9"/>',
    people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2"/>',
    payment: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18m-13 5h3"/>',
    bill: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6"/>',
    plus: '<path d="M12 5v14m-7-7h14"/>',
    arrow: '<path d="m9 5 7 7-7 7"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5m-4-4a8 8 0 0 1 14-2m0 10a8 8 0 0 1-14 2"/>',
    message: '<path d="M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z"/><path d="M8 10h8m-8 4h5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0v7l2 3H4l2-3V8Zm4 13h4"/>',
    chart: '<path d="M4 3v18h17M8 16v-4m5 4V8m5 8V5"/>',
    request: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2h6v4H9zM9 11h6m-6 5h3"/>',
    more: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'
  };
  const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[name] || icons.more) + '</svg>';
  const go = (path, mode) => send({ type: 'workspaceNavigate', path, mode: mode || 'home' });
  const home = document.createElement('div');
  home.id = 'om-app-home';
  home.setAttribute('aria-label', 'OM Tiffin daily workspace');
  home.innerHTML = `
    <header class="app-home-header">
      <div class="app-brand-row"><span class="app-wordmark">OM <b>TIFFIN</b><small>ADMIN WORKSPACE</small></span><div class="app-header-actions"><button class="app-header-icon" data-action="notifications" aria-label="Notifications">${icon('bell')}</button><button class="app-header-icon" data-action="more" aria-label="Open all tools">${icon('more')}</button></div></div>
      <p class="app-date"></p><h1>Let's make today<br>run smoothly.</h1>
      <div class="app-header-footer"><span>Meals. Customers. Collections.</span><button class="app-header-icon" data-action="refresh" aria-label="Refresh home">${icon('refresh')}</button></div>
    </header>
    <main class="app-home-content">
      <div class="app-section-heading"><h2>Today at a glance</h2><span class="app-live-note" role="status">Loading…</span></div>
      <div class="app-today-grid">
        <button class="app-metric app-meals" data-path="/daily-entry"><span class="app-metric-icon">${icon('meals')}</span><span class="app-metric-label">Meals recorded</span><strong data-stat="Today's Meals">—</strong><span class="app-metric-footer">Today's entries ${icon('arrow')}</span></button>
        <button class="app-metric" data-path="/payments"><span class="app-metric-icon">${icon('payment')}</span><span class="app-metric-label">Collected today</span><strong data-stat="Today's Collection">—</strong><span class="app-metric-footer">View payments ${icon('arrow')}</span></button>
      </div>
      <p class="app-data-status" role="status"></p>
      <button class="app-scan-button" data-path="/barcode-entry"><span class="app-scan-icon">${icon('scan')}</span><span><strong>Scan a tiffin</strong><small>Open camera & record a meal</small></span>${icon('arrow')}</button>
      <div class="app-section-heading"><h2>Your daily tools</h2><button class="app-text-button" data-action="more">See all ${icon('arrow')}</button></div>
      <div class="app-tool-grid">
        ${[
          ['people', 'Customers', 'Find & manage', '/customers'],
          ['meals', 'Daily entry', 'Record meals', '/daily-entry'],
          ['payment', 'Payments', 'Record & review', '/payments'],
          ['bill', 'Billing', 'Create & view bills', '/billing'],
          ['plus', 'Add customer', 'Start a new plan', '/add-customer'],
          ['message', 'Deliveries', 'Dispatch & confirm', '/meal-deliveries']
        ].map(([glyph, title, detail, path]) => `<button class="app-tool" data-path="${path}"><span class="app-tool-icon app-tool-${glyph}">${icon(glyph)}</span><strong>${title}</strong><small>${detail}</small></button>`).join('')}
      </div>
      <div class="app-section-heading"><h2>Follow up</h2><span>Keep things moving</span></div>
      <div class="app-follow-ups">
        <button class="app-follow-up" data-path="/whatsapp-payment-approval"><span class="app-follow-icon">${icon('payment')}</span><span><strong>Payment approvals</strong><small>Review customer payment screenshots</small></span>${icon('arrow')}</button>
        <button class="app-follow-up" data-path="/customer-modification-requests"><span class="app-follow-icon">${icon('request')}</span><span><strong>Tiffin requests</strong><small>Review plan changes & pauses</small></span>${icon('arrow')}</button>
        <button class="app-follow-up" data-path="/whatsapp-inbox"><span class="app-follow-icon">${icon('message')}</span><span><strong>WhatsApp inbox</strong><small>Read & reply to customers</small></span>${icon('arrow')}</button>
      </div>
      <div class="app-section-heading"><h2>Business overview</h2><button class="app-text-button" data-action="reports">Reports ${icon('arrow')}</button></div>
      <div class="app-overview"><div><span>Active customers</span><strong data-stat="Active Customers">—</strong></div><div><span>Outstanding amount</span><strong data-stat="Pending Amount">—</strong></div></div>
      <p class="app-bottom-note">One workspace for your everyday service.</p>
    </main>`;
  document.body.appendChild(home);
  home.querySelector('.app-date').textContent = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'short' });
  let mode = 'home';
  window.__omWorkspaceHome = function (nextMode) { mode = nextMode || 'home'; sync(); };
  home.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.path) go(button.dataset.path);
    else if (button.dataset.action === 'reports') { mode = 'reports'; sync(); }
    else if (button.dataset.action === 'notifications') { mode = 'reports'; sync(); document.querySelector('.om-admin-shell button[aria-label="Notifications"]')?.click(); }
    else if (button.dataset.action === 'more') send({ type: 'workspaceMore' });
    else if (button.dataset.action === 'refresh') send({ type: 'workspaceRefresh' });
  });
  // Read the same rendered analytics as the website; no new financial calculation or API writes.
  function sync() {
    const path = location.pathname;
    document.body.dataset.omAppPath = path;
    const signedIn = Boolean(sessionStorage.getItem('token'));
    const onHome = signedIn && path === '/dashboard' && mode === 'home';
    home.hidden = !onHome;
    document.body.classList.toggle('om-app-home-visible', onHome);
    const main = document.querySelector('.om-admin-shell main');
    if (path !== '/dashboard') mode = 'home';
    if (onHome) {
      let found = 0;
      home.querySelectorAll('[data-stat]').forEach(output => {
        const cardHeading = main && Array.from(main.querySelectorAll('p')).find(p => p.textContent.trim() === output.dataset.stat);
        const number = cardHeading && cardHeading.parentElement.querySelector('h2');
        const value = number ? number.textContent.trim() : '—';
        if (output.textContent !== value) output.textContent = value;
        if (number) found++;
      });
      const state = main && main.textContent;
      const failed = state && /Unable to load dashboard|Dashboard Error/.test(state);
      const updating = state && /Updating report/.test(state);
      const note = home.querySelector('.app-live-note');
      const message = failed ? 'Could not refresh' : found === 4 ? (updating ? 'Refreshing…' : 'Latest loaded data') : 'Loading…';
      if (note.textContent !== message) note.textContent = message;
      const status = home.querySelector('.app-data-status');
      const statusText = failed ? 'Home data is unavailable or may be outdated. Tap refresh to retry. Your tools are still available.' : '';
      if (status.textContent !== statusText) status.textContent = statusText;
    }
    // Label table cells without moving React elements or replacing their event handlers.
    if (main) main.querySelectorAll('table').forEach(table => {
      const labels = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
      table.querySelectorAll('tbody tr').forEach(row => Array.from(row.children).forEach((cell, index) => {
        if (cell.colSpan === 1 && labels[index] && cell.dataset.appLabel !== labels[index]) cell.dataset.appLabel = labels[index];
      }));
    });
  }
  let scheduled = false;
  const observer = new MutationObserver(records => {
    if (!records.some(record => !home.contains(record.target))) return;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; sync(); });
  });
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true, characterData: true });
  window.addEventListener('popstate', sync);
  window.addEventListener('focus', sync);
  setInterval(sync, 1000);
  sync();
})();
