import express from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AdminController } from "./admin.controller";
import { adminValidation } from "./admin.validation";

const router = express.Router();

// All admin routes require authentication + ADMIN role
router.use(requireAuth, requireRole(Role.ADMIN));

// Analytics overview
router.get("/analytics", AdminController.getAnalytics);

// User management
router.get("/users", AdminController.getUsers);
router.patch(
  "/users/:id/role",
  validateRequest(adminValidation.updateRole),
  AdminController.updateUserRole,
);
router.patch(
  "/users/:id/status",
  validateRequest(adminValidation.updateStatus),
  AdminController.updateUserStatus,
);

// Review moderation
router.get("/reviews", AdminController.getReviews);
router.patch(
  "/reviews/:id",
  validateRequest(adminValidation.updateReview),
  AdminController.updateReview,
);

export const AdminRoutes = router;
