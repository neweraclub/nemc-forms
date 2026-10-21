import { z, ZodTypeAny } from 'zod';
import { FormFieldRecord } from '@/types/form';

/**
 * Evaluates whether a conditional field is active given the current answers.
 */
export function isFieldVisible(field: FormFieldRecord, answers: Record<string, unknown>): boolean {
  if (!field.show_if) {
    return true;
  }

  const { field: targetKey, equals, notEquals, in: inList } = field.show_if;
  const targetVal = answers[targetKey];

  if (equals !== undefined && targetVal !== equals) {
    return false;
  }

  if (notEquals !== undefined && targetVal === notEquals) {
    return false;
  }

  if (inList !== undefined && Array.isArray(inList)) {
    if (!inList.includes(targetVal as string | number)) {
      return false;
    }
  }

  return true;
}

/**
 * Builds a strict Zod schema at runtime based strictly on form fields and current values.
 * Unknown keys are explicitly rejected via z.object().strict().
 */
export function buildFormZodSchema(
  fields: FormFieldRecord[],
  answers: Record<string, unknown>
): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const field of fields) {
    const isVisible = isFieldVisible(field, answers);
    let fieldValidator: ZodTypeAny;

    switch (field.type) {
      case 'short_text': {
        let str = z.string();
        if (field.validation?.minLength) {
          str = str.min(
            field.validation.minLength,
            `${field.label} doit comporter au moins ${field.validation.minLength} caractères.`
          );
        }
        if (field.validation?.maxLength) {
          str = str.max(
            field.validation.maxLength,
            `${field.label} ne doit pas dépasser ${field.validation.maxLength} caractères.`
          );
        }
        if (field.validation?.pattern) {
          try {
            const regex = new RegExp(field.validation.pattern);
            str = str.regex(regex, `Format invalide pour ${field.label}.`);
          } catch {
            // ignore invalid pattern regex
          }
        }
        if (field.required && isVisible) {
          fieldValidator = str.trim().min(1, `${field.label} est obligatoire.`);
        } else {
          fieldValidator = str.optional().or(z.literal(''));
        }
        break;
      }

      case 'long_text': {
        let str = z.string();
        if (field.validation?.minLength) {
          str = str.min(
            field.validation.minLength,
            `${field.label} doit comporter au moins ${field.validation.minLength} caractères.`
          );
        }
        if (field.validation?.maxLength) {
          str = str.max(
            field.validation.maxLength,
            `${field.label} ne doit pas dépasser ${field.validation.maxLength} caractères.`
          );
        }
        if (field.required && isVisible) {
          fieldValidator = str.trim().min(1, `${field.label} est obligatoire.`);
        } else {
          fieldValidator = str.optional().or(z.literal(''));
        }
        break;
      }

      case 'email': {
        const emailRule = z
          .string()
          .trim()
          .email('Veuillez saisir une adresse email valide.');

        if (field.required && isVisible) {
          fieldValidator = emailRule.min(1, 'L’adresse email est obligatoire.');
        } else {
          fieldValidator = emailRule.optional().or(z.literal(''));
        }
        break;
      }

      case 'phone': {
        const phoneRegex = /^[\d\s+\-().]{6,20}$/;
        const phoneRule = z
          .string()
          .trim()
          .regex(phoneRegex, 'Veuillez saisir un numéro de téléphone valide.');

        if (field.required && isVisible) {
          fieldValidator = phoneRule.min(1, 'Le numéro de téléphone est obligatoire.');
        } else {
          fieldValidator = phoneRule.optional().or(z.literal(''));
        }
        break;
      }

      case 'number': {
        let numRule = z.coerce.number();
        if (field.validation?.min !== undefined) {
          numRule = numRule.min(
            field.validation.min,
            `${field.label} doit être au minimum ${field.validation.min}.`
          );
        }
        if (field.validation?.max !== undefined) {
          numRule = numRule.max(
            field.validation.max,
            `${field.label} ne doit pas dépasser ${field.validation.max}.`
          );
        }
        if (field.required && isVisible) {
          fieldValidator = numRule;
        } else {
          fieldValidator = numRule.optional().nullable();
        }
        break;
      }

      case 'select':
      case 'radio': {
        const validValues = (field.options || []).map((o) => o.value);
        if (validValues.length > 0) {
          const enumRule = z.enum(validValues as [string, ...string[]], {
            message: `Veuillez sélectionner une option pour ${field.label}.`,
          });
          if (field.required && isVisible) {
            fieldValidator = enumRule;
          } else {
            fieldValidator = enumRule.optional().or(z.literal(''));
          }
        } else {
          fieldValidator = field.required && isVisible ? z.string().min(1) : z.string().optional();
        }
        break;
      }

      case 'checkboxes': {
        const validValues = (field.options || []).map((o) => o.value);
        const arrayRule = z.array(z.string()).refine(
          (arr) => {
            if (!arr || arr.length === 0) return !field.required || !isVisible;
            return arr.every((item) => validValues.includes(item));
          },
          { message: `Une ou plusieurs sélections pour ${field.label} ne sont pas valides.` }
        );

        if (field.required && isVisible) {
          fieldValidator = arrayRule.min(1, `Veuillez sélectionner au moins une option pour ${field.label}.`);
        } else {
          fieldValidator = arrayRule.optional().default([]);
        }
        break;
      }

      case 'date': {
        const dateRule = z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
          message: 'Veuillez saisir une date valide.',
        });
        if (field.required && isVisible) {
          fieldValidator = dateRule.min(1, `${field.label} est obligatoire.`);
        } else {
          fieldValidator = dateRule.optional().or(z.literal(''));
        }
        break;
      }

      case 'file': {
        if (field.required && isVisible) {
          fieldValidator = z.string().min(1, `Le fichier pour ${field.label} est obligatoire.`);
        } else {
          fieldValidator = z.string().optional().or(z.literal(''));
        }
        break;
      }

      case 'consent': {
        if (field.required && isVisible) {
          fieldValidator = z.literal(true, {
            message: 'Vous devez accepter cette condition pour continuer.',
          });
        } else {
          fieldValidator = z.boolean().optional();
        }
        break;
      }

      default:
        fieldValidator = z.any().optional();
    }

    shape[field.key] = fieldValidator;
  }

  // Add honeypot key: must be absent or empty string
  shape['_hp'] = z.string().max(0, 'Spam detection triggered').optional().or(z.literal(''));

  // Strict: rejects any unknown field submitted by the client
  return z.object(shape).strict();
}
