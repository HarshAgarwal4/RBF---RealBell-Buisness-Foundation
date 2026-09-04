/**
 * Defensive HTTP Security Headers Middleware
 */
export function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent framing to protect against clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Enable XSS filter in supported browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information sent in requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy to restrict sensitive device APIs unless needed
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
}
