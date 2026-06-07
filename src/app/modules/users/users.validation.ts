import { z } from 'zod';

const updateProfileValidationSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2, 'Name must be at least 2 characters long.')
        .max(100, 'Name cannot exceed 100 characters.')
        .optional(),
      avatar: z
        .string()
        .max(500_000, 'Avatar data is too large.')
        .optional()
        .or(z.literal('')),
    })
    .refine((data) => data.name !== undefined || data.avatar !== undefined, {
      message: 'At least one of name or avatar must be provided.',
    }),
});

export const UserValidation = {
  updateProfileValidationSchema,
};
