(function () {
  var HOSTED = 'https://sielon.103.161.35.238.sslip.io';
  function origin() {
    var host = location.hostname.toLowerCase();
    if (host === 'sielon.world' || host === 'www.sielon.world' || host === '127.0.0.1' || host === 'localhost') return HOSTED;
    return '';
  }
  function refused() {
    if (navigator.globalPrivacyControl) return true;
    var dnt = navigator.doNotTrack;
    return dnt === '1' || dnt === 'yes';
  }
  if (refused() || /\/dashboard\/?$/.test(location.pathname)) return;
  var api = origin();
  if (!api && location.protocol === 'file:') return;
  var section = 'home';
  var file = location.pathname.split('/').pop() || 'index.html';
  if (file === 'story.html') section = 'story';
  else if (file === 'token.html') section = 'token';
  else if (file === 'community.html') section = 'community';
  function fields() {
    var params = new URLSearchParams(location.search);
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined
    };
  }
  function payload(type, eventId, click) {
    var body = {
      type: type,
      eventId: eventId,
      path: location.pathname + location.search,
      section: section,
      referrer: document.referrer
    };
    var extra = fields();
    if (extra.utmSource) body.utmSource = extra.utmSource;
    if (extra.utmMedium) body.utmMedium = extra.utmMedium;
    if (extra.utmCampaign) body.utmCampaign = extra.utmCampaign;
    if (click) body.click = click;
    return body;
  }
  function post(route, body) {
    return fetch((api || '') + route, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      credentials: api ? 'include' : 'same-origin',
      cache: 'no-store',
      keepalive: true
    }).then(function (response) { return response.ok; }).catch(function () { return false; });
  }
  var pageId = crypto.randomUUID();
  post('/api/analytics/collect', payload('pageview', pageId)).then(function (ok) {
    if (!ok) post('/api/analytics/collect', payload('pageview', pageId));
  });
  var beatId = crypto.randomUUID();
  var timer = 0;
  function beat() {
    if (document.visibilityState !== 'visible') return;
    var id = beatId;
    post('/api/analytics/heartbeat', payload('heartbeat', id)).then(function (ok) {
      if (ok) beatId = crypto.randomUUID();
    });
  }
  function arm() {
    window.clearInterval(timer);
    if (document.visibilityState !== 'visible') return;
    timer = window.setInterval(beat, 30000);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { beat(); arm(); }
    else window.clearInterval(timer);
  });
  if (document.visibilityState === 'visible') arm();
  document.addEventListener('click', function (event) {
    var node = event.target instanceof Element ? event.target : null;
    if (!node) return;
    var copy = node.closest('[data-copy-contract]');
    var social = node.closest('[data-social]');
    var click = copy ? 'copy' : social ? social.getAttribute('data-social') : '';
    if (click !== 'copy' && click !== 'telegram' && click !== 'x') return;
    post('/api/analytics/collect', payload('click', crypto.randomUUID(), click));
  });
})();
