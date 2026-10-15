(function () {
  var HOSTED = 'https://sielon.103.161.35.238.sslip.io';
  function origin() {
    var host = location.hostname.toLowerCase();
    if (host === 'sielon.world' || host === 'www.sielon.world' || host === '127.0.0.1' || host === 'localhost') return HOSTED;
    return '';
  }
  var api = origin();
  var csrf = '';
  var page = 1;
  var pageSize = 25;
  var total = 0;
  var selected = [];
  var revealed = {};
  var summary = null;
  var timer = 0;
  var login = document.querySelector('[data-login]');
  var board = document.querySelector('[data-board]');
  var loginNote = document.querySelector('[data-login-note]');
  var boardNote = document.querySelector('[data-board-note]');
  var stats = document.querySelector('[data-stats]');
  var trend = document.querySelector('[data-trend]');
  var referrals = document.querySelector('[data-referrals]');
  var campaigns = document.querySelector('[data-campaigns]');
  var visits = document.querySelector('[data-visits]');
  var refresh = document.querySelector('[data-refresh]');
  var filters = document.querySelector('[data-filters]');
  var fromField = document.querySelector('[data-from]');
  var toField = document.querySelector('[data-to]');
  var detail = document.querySelector('[data-detail]');
  var confirmBox = document.querySelector('[data-confirm]');
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
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    }).format(ms);
  }
  function query() {
    var data = new FormData(filters);
    var parts = ['range=' + encodeURIComponent(String(data.get('range') || 'today'))];
    if (data.get('range') === 'custom') {
      parts.push('from=' + encodeURIComponent(String(data.get('from') || '')));
      parts.push('to=' + encodeURIComponent(String(data.get('to') || '')));
    }
    if (data.get('campaign')) parts.push('campaign=' + encodeURIComponent(String(data.get('campaign'))));
    if (data.get('referrer')) parts.push('referrer=' + encodeURIComponent(String(data.get('referrer'))));
    if (data.get('bots')) parts.push('bots=1');
    if (data.get('tests')) parts.push('tests=1');
    return parts.join('&');
  }
  function showLogin(note) {
    login.hidden = false;
    board.hidden = true;
    loginNote.textContent = note || '';
    window.clearInterval(timer);
  }
  function el(tag, text, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function paint(next, rows) {
    summary = next;
    stats.replaceChildren();
    var clicks = next.clicks || {};
    var cards = [
      ['Active visitors', next.activeVisitors, 'Each IP address online now', true],
      ['Unique visitors', next.browserVisitors, 'Each IP address once in this range', false],
      ['Visits', next.visits, 'Separate sessions', false],
      ['Page views', next.pageViews, 'Loads and reloads', false]
    ];
    cards.forEach(function (card) {
      var box = el('article', undefined, card[3] ? 'is-lead is-live' : '');
      box.append(el('p', card[0]), el('strong', String(card[1] || 0)), el('span', card[2]));
      stats.append(box);
    });
    var cta = el('article', undefined, 'dash-cta');
    var head = document.createElement('div');
    head.append(el('p', 'CTA clicks'), el('strong', String(clicks.total || 0)));
    var chips = el('ul', undefined, 'cta-chips');
    [['Copy CA', clicks.copy], ['Telegram', clicks.telegram], ['X', clicks.x]].forEach(function (chip) {
      var item = document.createElement('li');
      item.append(el('span', chip[0]), el('strong', String(chip[1] || 0)));
      chips.append(item);
    });
    cta.append(head, chips);
    stats.append(cta);
    var buckets = next.trend || [];
    var max = 1;
    var peak = null;
    buckets.forEach(function (bucket) {
      if (bucket.visitors > max) max = bucket.visitors;
      if (!peak || bucket.visitors > peak.visitors) peak = bucket;
    });
    trend.replaceChildren();
    trend.append(el('h2', 'Visit trend'));
    trend.append(el('p', (next.trendUnit === 'day' ? 'Unique visitors per day' : 'Unique visitors per hour') + (peak && peak.visitors > 0 ? ' · Peak ' + peak.visitors + ' at ' + peak.label : ''), 'dash-quiet'));
    if (!buckets.length || buckets.every(function (bucket) { return bucket.visitors === 0; })) {
      trend.append(el('p', 'No visitors in this range.'));
    } else {
      var chart = el('div', undefined, 'trend-chart');
      chart.style.gridTemplateColumns = 'repeat(' + buckets.length + ', minmax(0, 1fr))';
      buckets.forEach(function (bucket, index) {
        var isPeak = peak && bucket.start === peak.start && bucket.visitors > 0;
        var step = buckets.length > 18 ? 3 : 1;
        var show = index % step === 0 || isPeak || index === buckets.length - 1;
        var col = el('div', undefined, isPeak ? 'trend-col is-peak' : bucket.visitors > 0 ? 'trend-col' : 'trend-col is-zero');
        col.title = bucket.label + ': ' + bucket.visitors + ' unique visitors';
        var bar = el('span', undefined, 'trend-bar');
        var fill = document.createElement('span');
        fill.style.height = (bucket.visitors === 0 ? 0 : Math.max(14, (bucket.visitors / max) * 100)) + '%';
        bar.append(fill);
        col.append(el('span', bucket.visitors > 0 ? String(bucket.visitors) : '', 'trend-count'), bar, el('span', bucket.label, show ? 'trend-label' : 'trend-label is-hidden'));
        chart.append(col);
      });
      trend.append(chart);
    }
    referrals.replaceChildren(el('h2', 'Referrals'));
    if (!(next.referrals || []).length) referrals.append(el('p', 'No referrals in this range.'));
    else {
      var list = document.createElement('ul');
      next.referrals.forEach(function (row) { list.append(el('li', row.host + ': ' + row.visits)); });
      referrals.append(list);
    }
    campaigns.replaceChildren(el('h2', 'Campaigns'));
    if (!(next.campaigns || []).length) campaigns.append(el('p', 'No campaigns in this range.'));
    else {
      var campaignList = document.createElement('ul');
      next.campaigns.forEach(function (row) {
        campaignList.append(el('li', [row.source, row.medium, row.campaign].filter(Boolean).join(' / ') + ': ' + row.visits));
      });
      campaigns.append(campaignList);
    }
    visits.replaceChildren();
    if (!rows.length) visits.append(el('li', 'No visits in this range.'));
    rows.forEach(function (row) {
      var item = el('li', undefined, 'visit-row');
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = selected.indexOf(row.id) !== -1;
      box.setAttribute('aria-label', 'Select visit');
      box.addEventListener('change', function () {
        selected = box.checked ? selected.concat(row.id) : selected.filter(function (id) { return id !== row.id; });
        document.querySelector('[data-delete]').disabled = selected.length === 0;
      });
      var main = el('div', undefined, 'visit-main');
      var headline = el('div', undefined, 'visit-headline');
      headline.append(el('strong', row.location || 'Unavailable', 'visit-place'), el('span', row.classification || '', 'visit-badge'));
      main.append(headline);
      main.append(el('p', 'Started ' + stamp(row.startedAt) + ' · Last seen ' + stamp(row.lastSeen), 'visit-when'));
      main.append(el('p', [row.path, row.section, [row.browser, row.os, row.device].filter(Boolean).join(' / '), row.referrer || '(direct)', row.utmCampaign].filter(Boolean).join(' · '), 'visit-meta'));
      var actions = el('div', undefined, 'visit-actions');
      actions.append(el('span', revealed[row.id] || row.ip || '', 'visit-ip'));
      var reveal = el('button', revealed[row.id] ? 'Hide IP' : 'Reveal IP');
      reveal.type = 'button';
      reveal.disabled = !row.ipAvailable && !revealed[row.id];
      reveal.addEventListener('click', function () {
        if (revealed[row.id]) { delete revealed[row.id]; load(); return; }
        request('/api/dashboard/analytics/visits/' + row.id + '?reveal=1').then(function (result) {
          if (!result.ok) { boardNote.textContent = message(result, 'The IP address could not be revealed.'); return; }
          revealed[row.id] = result.data.ip;
          load();
        });
      });
      var view = el('button', 'View');
      view.type = 'button';
      view.addEventListener('click', function () { openDetail(row.id); });
      actions.append(reveal, view);
      item.append(box, main, actions);
      visits.append(item);
    });
    var pages = Math.max(1, Math.ceil(total / pageSize));
    document.querySelector('[data-page]').textContent = 'Page ' + page + ' of ' + pages;
    document.querySelector('[data-prev]').disabled = page <= 1;
    document.querySelector('[data-next]').disabled = page >= pages;
    document.querySelector('[data-delete]').disabled = selected.length === 0;
    refresh.textContent = 'Last successful refresh: ' + stamp(next.generatedAt || Date.now());
  }
  function load() {
    var q = query();
    return Promise.all([
      request('/api/dashboard/analytics/summary?' + q),
      request('/api/dashboard/analytics/visits?' + q + '&page=' + page + '&pageSize=' + pageSize)
    ]).then(function (pair) {
      if (pair[0].status === 401 || pair[1].status === 401) { showLogin(''); return; }
      if (!pair[0].ok || !pair[1].ok) {
        boardNote.textContent = (summary ? 'Latest refresh failed. Showing the last successful numbers. ' : '') + message(pair[0].ok ? pair[1] : pair[0], 'The visitor list could not be loaded.');
        return;
      }
      boardNote.textContent = '';
      total = pair[1].data.total || 0;
      paint(pair[0].data, pair[1].data.visits || []);
    });
  }
  function openDetail(id) {
    request('/api/dashboard/analytics/visits/' + id).then(function (result) {
      if (!result.ok) { boardNote.textContent = message(result, 'Visit details could not be loaded.'); return; }
      var row = result.data;
      detail.hidden = false;
      detail.replaceChildren(el('h3', 'Visit details'));
      detail.append(el('p', [row.path, row.section || 'no section', row.classification].filter(Boolean).join(' · ')));
      detail.append(el('p', 'Location: ' + (row.location || 'Unavailable')));
      detail.append(el('p', 'Started ' + stamp(row.startedAt) + '. Last seen ' + stamp(row.lastSeen) + '.'));
      detail.append(el('h4', 'Page views'));
      var views = row.pageViews || [];
      if (!views.length) detail.append(el('p', 'No page views stored.'));
      else {
        var viewList = document.createElement('ul');
        views.forEach(function (view) { viewList.append(el('li', stamp(view.createdAt) + ' · ' + view.path)); });
        detail.append(viewList);
      }
      detail.append(el('h4', 'CTA clicks'));
      var clicks = row.clicks || [];
      if (!clicks.length) detail.append(el('p', 'No CTA clicks stored.'));
      else {
        var clickList = document.createElement('ul');
        clicks.forEach(function (click) { clickList.append(el('li', stamp(click.createdAt) + ' · ' + click.kind)); });
        detail.append(clickList);
      }
      var close = el('button', 'Close details');
      close.type = 'button';
      close.addEventListener('click', function () { detail.hidden = true; });
      detail.append(close);
    });
  }
  function openBoard() {
    login.hidden = true;
    board.hidden = false;
    load();
    window.clearInterval(timer);
    timer = window.setInterval(function () {
      if (!board.hidden && document.visibilityState === 'visible') load();
    }, 10000);
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
  document.querySelector('[data-logout]').addEventListener('click', function () {
    request('/api/dashboard/logout', { method: 'POST', csrf: csrf, body: {} }).then(function () {
      request('/api/dashboard/session').then(function (result) {
        if (result.data && result.data.csrfToken) csrf = result.data.csrfToken;
        showLogin('');
      });
    });
  });
  filters.range.addEventListener('change', function () {
    var custom = filters.range.value === 'custom';
    fromField.hidden = !custom;
    toField.hidden = !custom;
  });
  filters.addEventListener('submit', function (event) {
    event.preventDefault();
    page = 1;
    confirmBox.hidden = true;
    load();
  });
  filters.bots.addEventListener('change', function () { page = 1; load(); });
  filters.tests.addEventListener('change', function () { page = 1; load(); });
  document.querySelector('[data-prev]').addEventListener('click', function () { if (page > 1) { page -= 1; load(); } });
  document.querySelector('[data-next]').addEventListener('click', function () {
    if (page < Math.ceil(total / pageSize)) { page += 1; load(); }
  });
  document.querySelector('[data-delete]').addEventListener('click', function () {
    document.querySelector('[data-confirm-count]').textContent = String(selected.length);
    confirmBox.hidden = selected.length === 0;
  });
  document.querySelector('[data-confirm-cancel]').addEventListener('click', function () { confirmBox.hidden = true; });
  document.querySelector('[data-confirm-delete]').addEventListener('click', function () {
    request('/api/dashboard/analytics/delete', { method: 'POST', csrf: csrf, body: { ids: selected } }).then(function (result) {
      if (!result.ok) { boardNote.textContent = message(result, 'Those visits could not be deleted.'); return; }
      boardNote.textContent = 'Deleted ' + (result.data.deleted || selected.length) + ' visits.';
      selected = [];
      confirmBox.hidden = true;
      detail.hidden = true;
      load();
    });
  });
  document.querySelector('[data-export]').addEventListener('click', function () {
    var reveal = document.querySelector('[data-reveal-export]').checked ? '&reveal=1' : '';
    fetch((api || '') + '/api/dashboard/analytics/export?' + query() + reveal, {
      headers: { 'x-csrf-token': csrf, accept: 'text/csv' },
      credentials: api ? 'include' : 'same-origin',
      cache: 'no-store'
    }).then(function (response) {
      if (!response.ok) { boardNote.textContent = 'The CSV export could not be downloaded.'; return null; }
      return response.blob();
    }).then(function (blob) {
      if (!blob) return;
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'sielon-visits.csv';
      link.click();
      URL.revokeObjectURL(url);
      boardNote.textContent = 'Export downloaded.';
    }).catch(function () { boardNote.textContent = 'The CSV export could not be downloaded.'; });
  });
  document.addEventListener('visibilitychange', function () {
    if (!board.hidden && document.visibilityState === 'visible') load();
  });
})();
