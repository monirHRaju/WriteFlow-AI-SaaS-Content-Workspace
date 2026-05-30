import { z } from 'zod';

const draftAgentValidationSchema = z.object({
  body: z.object({
    templateId: z.string({
      required_error: 'templateId is required.',
    }).uuid('Invalid templateId format.'),
    topic: z.string({
      required_error: 'topic is required.',
    }).min(3, 'Topic must be at least 3 characters long.'),
    tone: z.string({
      required_error: 'tone is required.',
    }),
    audience: z.string({
      required_error: 'audience is required.',
    }),
    documentId: z.string().uuid('Invalid documentId format.').optional(),
  }),
});

const rewriteAgentValidationSchema = z.object({
  body: z.object({
    text: z.string({
      required_error: 'text is required.',
    }).min(1, 'Text cannot be empty.'),
    mode: z.enum(['shorten', 'expand', 'formal', 'casual', 'persuasive', 'fix_grammar'], {
      required_error: 'mode is required.',
      invalid_type_error: 'Invalid rewrite mode.',
    }),
  }),
});

export const AiValidation = {
  draftAgentValidationSchema,
  rewriteAgentValidationSchema,
};
export default AiValidation;
