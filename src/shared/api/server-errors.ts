import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { type ApiError, parseApiError } from './errors.ts';

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
