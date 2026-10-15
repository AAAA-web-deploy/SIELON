(function () {
  var HOSTED = 'https://sielon.103.161.35.238.sslip.io';
  function origin() {
    var host = location.hostname.toLowerCase();
    if (host === 'sielon.world' || host === 'www.sielon.world' || host === '127.0.0.1' || host === 'localhost') return HOSTED;
    return '';
  }
  var api = origin();
  var csrf = '';
  var range = 'today';
  var login = document.querySelector('[data-login]');
  var board = document.querySelector('[data-board]');
  var loginNote = document.querySelector('[data-login-note]');
  var boardNote = document.querySelector('[data-board-note]');
  var stats = document.querySelector('[data-stats]');
  var visits = document.querySelector('[data-visits]');
  var logout = document.querySelector('[data-logout]');
  function request(path, init) {
    var headers = { accept: 'application/json' };
    if (init && init.body !== undefined) headers['content-type'] = 'application/json';
    if (init && init.csrf) headers['x-csrf-token'] = init.csrf;
    return fetch((api || '') + path, {
      method: init && init.method ? init.method : 'GET',
      headers: headers,
      body: init && init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: api ? 'include' : 'same-origin',
      cache: 'no-store'
    }).then(function (response) {
      return response.text().then(function (text) {
        var data = {};
        if (text) { try { data = JSON.parse(text); } catch (error) { data = {}; } }
        return { ok: response.ok, status: response.status, data: data };
      });
    }).catch(function () { return { ok: false, status: 0, data: {} }; });
  }
  function message(result, fallback) {
    if (result.data && typeof result.data.error === 'string' && result.data.error) return result.data.error;
    if (result.status === 0 || result.status === 404) return 'The visitor service is unavailable on this host.';
    return fallback;
  }
  function stamp(ms) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(ms);
  }
  function showLogin(note) {
    login.hidden = false;
    board.hidden = true;
    logout.hidden = true;
    loginNote.textContent = note || '';
  }
  function cell(text) {
    var item = document.createElement('td');
    item.textContent = text;
    return item;
  }
  function paint(summary, rows) {
    stats.replaceChildren();
    var cards = [
      ['Active now', summary.activeVisitors],
      ['Visitors', summary.browserVisitors],
      ['Visits', summary.visits],
      ['Page views', summary.pageViews],
      ['Copy CA', summary.clicks && summary.clicks.copy || 0],
      ['Telegram', summary.clicks && summary.clicks.telegram || 0],
      ['X', summary.clicks && summary.clicks.x || 0]
    ];
    cards.forEach(function (card) {
      var box = document.createElement('article');
      box.className = 'dash-stat';
      var value = document.createElement('b');
      value.textContent = String(card[1] || 0);
      var label = document.createElement('span');
      label.textContent = card[0];
      box.append(value, label);
      stats.append(box);
    });
    visits.replaceChildren();
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.append(
        cell(stamp(row.lastSeen)),
        cell(row.path || ''),
        cell(row.location || ''),
        cell([row.device, row.browser].filter(Boolean).join(' · ')),
        cell(row.referrer || 'direct')
      );
      visits.append(tr);
    });
    if (!rows.length) {
      var empty = document.createElement('tr');
      var none = document.createElement('td');
      none.colSpan = 5;
      none.textContent = 'No visits in this range.';
      empty.append(none);
      visits.append(empty);
    }
  }
  function load() {
    var query = 'range=' + encodeURIComponent(range);
    return Promise.all([
      request('/api/dashboard/analytics/summary?' + query),
      request('/api/dashboard/analytics/visits?' + query + '&page=1&pageSize=25')
    ]).then(function (pair) {
      if (pair[0].status === 401 || pair[1].status === 401) { showLogin(''); return; }
      if (!pair[0].ok || !pair[1].ok) {
        boardNote.textContent = message(pair[0].ok ? pair[1] : pair[0], 'The visitor list could not be loaded.');
        return;
      }
      boardNote.textContent = '';
      paint(pair[0].data, pair[1].data.visits || []);
    });
  }
  function openBoard() {
    login.hidden = true;
    board.hidden = false;
    logout.hidden = false;
    load();
  }
  request('/api/dashboard/session').then(function (result) {
    if (result.data && result.data.csrfToken) csrf = result.data.csrfToken;
    if (!result.ok) { showLogin(message(result, 'The visitor service is unavailable on this host.')); return; }
    if (result.data.authenticated) openBoard();
    else showLogin('');
  });
  login.addEventListener('submit', function (event) {
    event.preventDefault();
    var password = new FormData(login).get('password');
    loginNote.textContent = '';
    request('/api/dashboard/login', { method: 'POST', csrf: csrf, body: { password: password } }).then(function (result) {
      if (result.data && result.data.csrfToken) csrf = result.data.csrfToken;
      if (!result.ok) { loginNote.textContent = message(result, 'Incorrect password. Please try again.'); return; }
      login.reset();
      openBoard();
    });
  });
  logout.addEventListener('click', function () {
    request('/api/dashboard/logout', { method: 'POST', csrf: csrf, body: {} }).then(function () { showLogin(''); });
  });
  document.querySelectorAll('[data-range]').forEach(function (button) {
    button.addEventListener('click', function () {
      range = button.getAttribute('data-range') || 'today';
      document.querySelectorAll('[data-range]').forEach(function (item) { item.classList.toggle('is-on', item === button); });
      load();
    });
  });
  window.setInterval(function () { if (!board.hidden) load(); }, 10000);
})();
