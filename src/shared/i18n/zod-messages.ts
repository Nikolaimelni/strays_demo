import i18next from 'i18next';
import { z } from 'zod';

// zod writes its own messages in English and react-hook-form hands them
// straight to the field, so without this the Portuguese forms answer half in
// English. anything unrecognised falls through to zod.
//
// resolved when the value is checked, not when it is rendered, so switching
// language with an error on screen leaves that one message behind until the
// next keystroke. worth it to keep the schemas plain.
export const installValidationMessages = () => {
  z.config({
    customError: (issue) => {
      switch (issue.code) {
        case 'invalid_type':
          return i18next.t('validation.required');

        case 'too_small': {
          const min = Number(issue.minimum);
          if (issue.origin === 'array') return i18next.t('validation.tooFew', { min });
          return min <= 1
            ? i18next.t('validation.required')
            : i18next.t('validation.tooShort', { min });
        }

        case 'too_big': {
          const max = Number(issue.maximum);
          return issue.origin === 'array'
            ? i18next.t('validation.tooMany', { max })
            : i18next.t('validation.tooLong', { max });
        }

        case 'invalid_format':
          return issue.format === 'email'
            ? i18next.t('validation.email')
            : i18next.t('validation.invalid');

        case 'invalid_value':
          return i18next.t('validation.invalid');

        default:
          return undefined;
      }
    },
  });
};
