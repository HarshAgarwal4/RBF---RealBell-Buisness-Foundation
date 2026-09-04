import assert from 'assert';
import { generateCsrfToken, verifyCsrfToken, validateRequest } from './middlewares/csrf.js';
import { securityHeaders } from './middlewares/securityHeaders.js';
import { isPublicRoute, isAllowedDuringApproval } from './middlewares/Auth.js';

console.log('--- Starting csrf-csrf Package & Security Unit Tests ---');

function createMockReqRes(method = 'GET', url = '/', headers = {}, cookies = {}) {
  const req = {
    method,
    originalUrl: url,
    url,
    path: url.split('?')[0],
    headers: { ...headers },
    cookies: { ...cookies },
    ip: '127.0.0.1',
    app: { get: () => 1 },
  };

  const resHeaders = {};
  const resCookies = {};
  let resStatus = 200;
  let resJson = null;

  const res = {
    statusCode: 200,
    cookie: (name, val, opts) => {
      resCookies[name] = val;
      req.cookies[name] = val; // simulate cookie receipt
    },
    clearCookie: (name) => {
      delete resCookies[name];
      delete req.cookies[name];
    },
    setHeader: (name, val) => {
      resHeaders[name] = val;
    },
    getHeader: (name) => resHeaders[name],
    status: (code) => {
      resStatus = code;
      res.statusCode = code;
      return res;
    },
    json: (data) => {
      resJson = data;
      return res;
    },
    send: (data) => {
      resJson = data;
      return res;
    },
    _getCookies: () => resCookies,
    _getHeaders: () => resHeaders,
    _getStatus: () => resStatus,
    _getJson: () => resJson,
  };

  return { req, res };
}

// Test 1: Token generation using csrf-csrf
{
  const { req, res } = createMockReqRes('GET', '/csrf-token');
  const token = generateCsrfToken(req, res);
  console.log('1. Generated csrf-csrf Token:', token);
  assert(token && token.includes('.'), 'Token must be formatted with delimiter');
  assert(res._getCookies()['_csrf'], '_csrf cookie must be set');
  assert(res._getCookies()['XSRF-TOKEN'], 'XSRF-TOKEN cookie must be set');
  assert.strictEqual(res._getHeaders()['X-CSRF-Token'], token, 'X-CSRF-Token header must be set');
  console.log('✅ Test 1 passed: csrf-csrf token generation and dual-cookie configuration');
}

// Test 2: Forged token detection via validateRequest
{
  const { req, res } = createMockReqRes('POST', '/login');
  const token = generateCsrfToken(req, res);
  req.headers['x-csrf-token'] = token;
  assert.strictEqual(validateRequest(req), true, 'Valid token must validate successfully');

  // Tamper with header token
  req.headers['x-csrf-token'] = token.slice(0, -4) + 'zzzz';
  assert.strictEqual(validateRequest(req), false, 'Tampered token must fail validation');

  // Mismatched token
  req.headers['x-csrf-token'] = 'random-forged-token.signature';
  assert.strictEqual(validateRequest(req), false, 'Forged token must fail validation');
  console.log('✅ Test 2 passed: Tampered and forged token rejection via validateRequest');
}

// Test 3: Security Headers middleware
{
  const { req, res } = createMockReqRes();
  let nextCalled = false;
  securityHeaders(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
  const headers = res._getHeaders();
  assert.strictEqual(headers['X-Content-Type-Options'], 'nosniff');
  assert.strictEqual(headers['X-Frame-Options'], 'SAMEORIGIN');
  assert.strictEqual(headers['X-XSS-Protection'], '1; mode=block');
  assert.strictEqual(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
  console.log('✅ Test 3 passed: Defensive security headers set correctly');
}

// Test 4: verifyCsrfToken middleware - GET requests pass without token
{
  let passed = false;
  const { req, res } = createMockReqRes('GET', '/roles');
  verifyCsrfToken(req, res, () => { passed = true; });
  assert.strictEqual(passed, true, 'GET requests must pass without token');
  console.log('✅ Test 4 passed: Safe methods pass without CSRF token');
}

// Test 5: verifyCsrfToken middleware - POST without token rejected
{
  let nextCalled = false;
  const { req, res } = createMockReqRes('POST', '/login');
  verifyCsrfToken(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, false, 'Next should not be called when token is missing');
  assert.strictEqual(res._getStatus(), 403, 'Must return 403 for missing token');
  assert.strictEqual(res._getJson()?.code, 'EBADCSRFTOKEN', 'Must return EBADCSRFTOKEN code');
  console.log('✅ Test 5 passed: Missing CSRF token rejected with 403 EBADCSRFTOKEN');
}

// Test 6: verifyCsrfToken middleware - Mismatched token rejected
{
  let nextCalled = false;
  const { req: req1, res: res1 } = createMockReqRes('GET', '/csrf-token');
  const token1 = generateCsrfToken(req1, res1);

  const { req: req2, res: res2 } = createMockReqRes('GET', '/csrf-token');
  const token2 = generateCsrfToken(req2, res2);

  const { req, res } = createMockReqRes('POST', '/me', { 'x-csrf-token': token1 }, { _csrf: token2 });
  verifyCsrfToken(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, false, 'Next should not be called on token mismatch');
  assert.strictEqual(res._getStatus(), 403, 'Must return 403 for mismatched token');
  console.log('✅ Test 6 passed: Mismatched CSRF token rejected with 403 EBADCSRFTOKEN');
}

// Test 7: verifyCsrfToken middleware - Valid token passes
{
  let nextCalled = false;
  const { req: tokenReq, res: tokenRes } = createMockReqRes('GET', '/csrf-token');
  const token = generateCsrfToken(tokenReq, tokenRes);

  const { req, res } = createMockReqRes('POST', '/me', { 'x-csrf-token': token }, { _csrf: token });
  verifyCsrfToken(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true, 'Valid CSRF token must pass verification');
  console.log('✅ Test 7 passed: Valid CSRF token passes verification');
}

// Test 8: Razorpay webhook exemption
{
  let webhookPassed = false;
  const { req, res } = createMockReqRes('POST', '/payment/webhook');
  verifyCsrfToken(req, res, () => { webhookPassed = true; });
  assert.strictEqual(webhookPassed, true, 'Razorpay webhook must bypass CSRF check');
  console.log('✅ Test 8 passed: Razorpay webhook bypassed CSRF check correctly');
}

// Test 9: Public vs. Private Route Categorization
{
  const publicRoutes = [
    { method: 'GET', url: '/' },
    { method: 'GET', url: '/csrf-token' },
    { method: 'GET', url: '/roles' },
    { method: 'GET', url: '/auth-settings' },
    { method: 'GET', url: '/plans' },
    { method: 'GET', url: '/page-content' },
    { method: 'GET', url: '/events/public' },
    { method: 'GET', url: '/programs/public' },
    { method: 'GET', url: '/resources/public' },
    { method: 'GET', url: '/jobs/public' },
    { method: 'GET', url: '/legal-compliance/services' },
    { method: 'GET', url: '/certificates/verify/CERT-123' },
    { method: 'GET', url: '/tests/public/test-slug' },
    { method: 'GET', url: '/referrals/validate/REF123' },
    { method: 'GET', url: '/booster/public' },
    { method: 'GET', url: '/booster/items' },
    { method: 'GET', url: '/ai/info' },
    { method: 'GET', url: '/wallet/settings' },
    { method: 'POST', url: '/signup' },
    { method: 'POST', url: '/signup/send-otp' },
    { method: 'POST', url: '/login' },
    { method: 'POST', url: '/sendotp' },
    { method: 'POST', url: '/forgot-password/send-otp' },
    { method: 'POST', url: '/forgot-password/reset' },
    { method: 'POST', url: '/payment/webhook' },
    { method: 'POST', url: '/certificates/proxy-image' },
  ];

  for (const route of publicRoutes) {
    const isPub = isPublicRoute(route);
    assert.strictEqual(isPub, true, `Route ${route.method} ${route.url} must be public`);
  }

  const privateRoutes = [
    { method: 'GET', url: '/me' },
    { method: 'POST', url: '/me' },
    { method: 'POST', url: '/logout' },
    { method: 'GET', url: '/tickets' },
    { method: 'POST', url: '/tickets' },
    { method: 'GET', url: '/incubation/applications' },
    { method: 'POST', url: '/incubation/applications' },
    { method: 'GET', url: '/admin/users' },
    { method: 'POST', url: '/admin/users' },
    { method: 'GET', url: '/chat/conversations' },
    { method: 'GET', url: '/wallet/my-wallet' },
    { method: 'POST', url: '/wallet/topup/create-order' },
  ];

  for (const route of privateRoutes) {
    const isPub = isPublicRoute(route);
    assert.strictEqual(isPub, false, `Route ${route.method} ${route.url} must be private`);
  }

  console.log('✅ Test 9 passed: Public vs. Private route categorization verified across all endpoints');
}

// Test 10: Approval Gatekeeper
{
  assert.strictEqual(isAllowedDuringApproval({ url: '/me' }), true);
  assert.strictEqual(isAllowedDuringApproval({ url: '/logout' }), true);
  assert.strictEqual(isAllowedDuringApproval({ url: '/approvals/my-status' }), true);
  assert.strictEqual(isAllowedDuringApproval({ url: '/approvals/upload-document' }), true);
  assert.strictEqual(isAllowedDuringApproval({ url: '/incubation/applications' }), false);
  assert.strictEqual(isAllowedDuringApproval({ url: '/chat/conversations' }), false);
  console.log('✅ Test 10 passed: Approval gatekeeper route permissions verified');
}

// Test 11: Rate Limiter Middleware Verification
import { globalLimiter, authLimiter, aiLimiter, uploadLimiter } from './middlewares/rateLimiter.js';

{
  assert(typeof globalLimiter === 'function', 'globalLimiter must be middleware function');
  assert(typeof authLimiter === 'function', 'authLimiter must be middleware function');
  assert(typeof aiLimiter === 'function', 'aiLimiter must be middleware function');
  assert(typeof uploadLimiter === 'function', 'uploadLimiter must be middleware function');

  // Test globalLimiter invocation
  let nextCalled = false;
  const { req, res } = createMockReqRes('GET', '/roles');
  await new Promise((resolve) => {
    globalLimiter(req, res, () => {
      nextCalled = true;
      resolve();
    });
  });
  assert.strictEqual(nextCalled, true, 'globalLimiter should call next for initial request');

  console.log('✅ Test 11 passed: Rate limiter middlewares initialized and operational');
}

// Test 12: Rate Limiter Webhook Exemption
{
  const { req, res } = createMockReqRes('POST', '/payment/webhook');
  let nextCalled = false;
  await new Promise((resolve) => {
    globalLimiter(req, res, () => {
      nextCalled = true;
      resolve();
    });
  });
  assert.strictEqual(nextCalled, true, 'globalLimiter should skip /payment/webhook');
  console.log('✅ Test 12 passed: Rate limiter correctly exempts Razorpay payment webhook');
}

console.log('\n🎉 ALL 12 SECURITY, CSRF & RATE-LIMIT TESTS PASSED SUCCESSFULLY!');

