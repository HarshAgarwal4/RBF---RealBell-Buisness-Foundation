import { rateLimit } from 'express-rate-limit';

const commonConfig = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { trustProxy: false },
};

/**
 * 1. Global API Rate Limiter
 * Baseline defense applied across all endpoints (300 requests per 15-minute window)
 */
export const globalLimiter = rateLimit({
  ...commonConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  skip: (req) => {
    const rawPath = req.originalUrl || req.url || req.path || '';
    const path = rawPath.split('?')[0];
    // Exempt Razorpay server-to-server webhook to guarantee payment updates
    return path === '/payment/webhook';
  },
  handler: (req, res) => {
    return res.status(429).json({
      status: 429,
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP address, please try again after 15 minutes.',
    });
  },
});

/**
 * 2. Authentication & OTP Limiter (Strict Brute-Force Defense)
 * 15 requests per 15-minute window for login, signup, OTPs, and password reset
 */
export const authLimiter = rateLimit({
  ...commonConfig,
  windowMs: 15 * 60 * 1000,
  max: 15,
  handler: (req, res) => {
    return res.status(429).json({
      status: 429,
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    });
  },
});

/**
 * 3. AI & LLM Generation Limiter
 * 30 requests per 1-minute window for AI chatbots, matchmaking, and recommendations
 */
export const aiLimiter = rateLimit({
  ...commonConfig,
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  handler: (req, res) => {
    return res.status(429).json({
      status: 429,
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'AI request limit reached. Please wait a moment before sending more queries.',
    });
  },
});

/**
 * 4. File Upload Limiter
 * 30 uploads per 15-minute window to prevent storage abuse and bandwidth exhaustion
 */
export const uploadLimiter = rateLimit({
  ...commonConfig,
  windowMs: 15 * 60 * 1000,
  max: 30,
  handler: (req, res) => {
    return res.status(429).json({
      status: 429,
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Upload rate limit exceeded. Please wait before uploading more files.',
    });
  },
});
