import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import router from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';

const app: Application = express();

// 1. Security Headers via Helmet
app.use(helmet());

// 2. Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*', // In actual staging/production, configure specific domains
    credentials: true,
  })
);

// 3. DDoS & Brute-Force Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Draft-6 standard; Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    errors: [
      {
        path: 'rate-limit',
        message: 'Rate limit exceeded. Max 100 requests per 15 minutes.',
      },
    ],
  },
});
app.use(limiter);

// 4. Request Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Root route for API health-checks
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the WriteFlow AI API Core Service.',
  });
});

// 6. Primary Routing Version Prefix
app.use('/api/v1', router);

// 7. Global 404 Route Fallthrough
app.use(notFound);

// 8. Global Centralized Error Catch-all
app.use(globalErrorHandler);

export default app;
