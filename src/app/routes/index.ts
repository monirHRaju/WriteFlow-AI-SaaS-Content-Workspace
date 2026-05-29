import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { UserRoutes } from '../modules/users/users.route';
import { TemplateRoutes } from '../modules/templates/templates.route';
import { AiRoutes } from '../modules/ai/ai.route';
import { DocumentRoutes } from '../modules/documents/documents.route';
import { ReviewRoutes } from '../modules/reviews/reviews.route';
import { AnalyticsRoutes } from '../modules/analytics/analytics.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/templates',
    route: TemplateRoutes,
  },
  {
    path: '/ai',
    route: AiRoutes,
  },
  {
    path: '/documents',
    route: DocumentRoutes,
  },
  {
    path: '/reviews',
    route: ReviewRoutes,
  },
  {
    path: '/analytics',
    route: AnalyticsRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
