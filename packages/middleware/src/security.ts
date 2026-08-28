import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { DEFAULT_CONFIG } from '@nm/constants';

export const securityMiddleware = [
  helmet(),
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }),
  compression(),
];

export const globalRateLimiter = rateLimit({
  windowMs: DEFAULT_CONFIG.RATE_LIMIT_WINDOW_MS,
  max: DEFAULT_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
