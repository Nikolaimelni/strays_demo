import { z } from 'zod';

// one shape from every endpoint; validation errors carry the extra `details`.
// see HttpErrorFilter on the backend.
const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export const parseApiError = (body: unknown): ApiError => {
  const parsed = apiErrorSchema.safeParse(body);
  if (parsed.success) return parsed.data;
  return { code: 'UNKNOWN', message: 'unexpected error' };
};

export const errorTranslationKey = (error: ApiError): string => `errors.${error.code}`;
