let body = $response.body;
if (!body) { $done({}); return; }
try {
  let json = JSON.parse(body);
  let modified = false;
  const statusKeys = ['status', 'subscription', 'plan', 'isPro', 'pro', 'premium', 'expires', 'expiry'];
  for (let key of statusKeys) {
    if (json.hasOwnProperty(key)) {
      if (typeof json[key] === 'string' && /free|trial|inactive|expired|none/i.test(json[key])) {
        json[key] = 'active';
        modified = true;
      }
      if (typeof json[key] === 'boolean' && !json[key]) {
        json[key] = true;
        modified = true;
      }
      if (typeof json[key] === 'number') {
        json[key] = Date.now() + 100 * 365 * 24 * 60 * 60 * 1000;
        modified = true;
      }
    }
  }
  if (json.expires) { json.expires = '2099-12-31T23:59:59Z'; modified = true; }
  if (json.expiry) { json.expiry = '2099-12-31T23:59:59Z'; modified = true; }
  if (!modified) {
    json.status = 'active';
    json.plan = 'pro';
    json.isPro = true;
    json.expires = '2099-12-31T23:59:59Z';
  }
  $done({ status: 200, headers: $response.headers, body: JSON.stringify(json) });
} catch (e) {
  $done({});
}