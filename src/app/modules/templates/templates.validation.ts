import { z } from 'zod';

const createTemplateValidationSchema = z.object({
  body: z.object({
    title: z
      .string({
        required_error: 'Title is required.',
      })
      .min(3, 'Title must be at least 3 characters long.')
      .max(100, 'Title cannot exceed 100 characters.'),
    category: z.string({
      required_error: 'Category is required.',
    }),
    description: z
      .string({
        required_error: 'Description is required.',
      })
      .min(10, 'Description must be at least 10 characters long.'),
    prompt: z.string({
      required_error: 'Prompt is required.',
    }),
    sampleOutput: z.string().optional().nullable(),
    thumbnail: z.string().optional().nullable(),
    isPublished: z.boolean().optional(),
  }),
});

const updateTemplateValidationSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters long.')
      .max(100, 'Title cannot exceed 100 characters.')
      .optional(),
    category: z.string().optional(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters long.')
      .optional(),
    prompt: z.string().optional(),
    sampleOutput: z.string().optional().nullable(),
    thumbnail: z.string().optional().nullable(),
    isPublished: z.boolean().optional(),
  }),
});

export const TemplateValidation = {
  createTemplateValidationSchema,
  updateTemplateValidationSchema,
};
