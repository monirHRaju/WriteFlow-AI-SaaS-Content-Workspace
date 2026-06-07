import { z } from 'zod';

const createDocumentValidationSchema = z.object({
  body: z.object({
    title: z
      .string({
        required_error: 'Title is required.',
      })
      .min(1, 'Title is required.')
      .max(200, 'Title cannot exceed 200 characters.'),
    content: z.string().optional().default(''),
    templateId: z.string().uuid('Invalid templateId format.').optional(),
  }),
});

const updateDocumentValidationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document id format.'),
  }),
  body: z
    .object({
      title: z
        .string()
        .min(1, 'Title is required.')
        .max(200, 'Title cannot exceed 200 characters.')
        .optional(),
      content: z.string().optional(),
    })
    .refine((data) => data.title !== undefined || data.content !== undefined, {
      message: 'At least one of title or content must be provided.',
    }),
});

const documentIdParamValidationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document id format.'),
  }),
});

export const DocumentValidation = {
  createDocumentValidationSchema,
  updateDocumentValidationSchema,
  documentIdParamValidationSchema,
};
