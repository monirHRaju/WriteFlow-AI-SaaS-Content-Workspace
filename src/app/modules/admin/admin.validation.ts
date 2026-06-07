import { z } from "zod";

export const adminValidation = {
  updateRole: z.object({
    body: z.object({
      role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
    }),
  }),

  updateStatus: z.object({
    body: z.object({
      isActive: z.boolean(),
    }),
  }),

  updateReview: z.object({
    body: z.object({
      status: z.enum(["APPROVED", "REJECTED"]),
    }),
  }),
};
