import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
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

// the backend answers a failed validation with details: [{ path, message }].
// without this the user gets one generic "validation failed" and no idea which
// input is wrong.
export const applyServerErrors = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): ApiError => {
  const parsed = parseApiError(error);
  for (const detail of parsed.details ?? []) {
    if (!detail.path) continue;
    setError(detail.path as Path<T>, { type: 'server', message: detail.message });
  }
  return parsed;
};
