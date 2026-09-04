import { doubleCsrf } from 'csrf-csrf';

const isProduction = process.env.PRODUCTION === 'true' || process.env.NODE_ENV === 'production';
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'rbf_csrf_secret_key_production_fallback';

/**
 * Configure csrf-csrf package (Signed Double-Submit Cookie Pattern)
 */
const {
  invalidCsrfTokenError,
  generateCsrfToken: doubleCsrfGenerateToken,
  validateRequest,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  getSessionIdentifier: (req) => req.cookies?.UID || '',
  cookieName: '_csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
  size: 32,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] || req.headers['csrf-token'],
  skipCsrfProtection: (req) => {
    const rawPath = req.originalUrl || req.url || req.path || '';
    const path = rawPath.split('?')[0];
    // Exempt Razorpay server-to-server webhook (secured via HMAC signature)
    return path === '/payment/webhook';
  },
});

/**
 * Helper to generate CSRF token, sync cookies, and set headers
 */
export function generateCsrfToken(req, res, options = {}) {
  const token = doubleCsrfGenerateToken(req, res, options);

  // Also set non-httpOnly XSRF-TOKEN cookie and X-CSRF-Token response header
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.setHeader('X-CSRF-Token', token);
  return token;
}

/**
 * Helper to set cookies on a response
 */
export function setCsrfCookies(res, token) {
  const commonOptions = {
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res.cookie('_csrf', token, {
    ...commonOptions,
    httpOnly: true,
  });

  res.cookie('XSRF-TOKEN', token, {
    ...commonOptions,
    httpOnly: false,
  });

  res.setHeader('X-CSRF-Token', token);
}

/**
 * Express Route Handler: GET /csrf-token
 */
export function getCsrfTokenHandler(req, res) {
  const token = generateCsrfToken(req, res, { overwrite: false });
  return res.status(200).json({
    status: 1,
    csrfToken: token,
  });
}

/**
 * Express Middleware: Validate CSRF token using csrf-csrf
 */
export function verifyCsrfToken(req, res, next) {
  doubleCsrfProtection(req, res, (err) => {
    if (err) {
      if (err.code === 'EBADCSRFTOKEN' || err === invalidCsrfTokenError) {
        return res.status(403).json({
          status: 403,
          code: 'EBADCSRFTOKEN',
          msg: 'Invalid or missing CSRF token',
        });
      }
      return next(err);
    }
    next();
  });
}

export { invalidCsrfTokenError, validateRequest, doubleCsrfProtection };
