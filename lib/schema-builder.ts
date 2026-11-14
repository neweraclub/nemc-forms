import { z, ZodTypeAny } from 'zod';
import { FormFieldRecord } from '@/types/form';

/**
 * Evaluates whether a conditional field is active given the current answers.
 */
export function isFieldVisible(field: FormFieldRecord, answers: Record<string, unknown>): boolean {
  // 1. Role-based targeting check
  if (field.target_roles && field.target_roles.length > 0 && !field.target_roles.includes('all')) {
    const selectedRole = answers['_target_role'] || answers['role'];
    if (!selectedRole || !field.target_roles.includes(String(selectedRole))) {
      return false;
    }
  }

  // 2. Conditional visibility check (show_if)
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
 * Builds a flexible, type-safe Zod schema at runtime based strictly on form fields and current values.
 * Uses .passthrough() so extraneous localStorage draft keys do not cause validation failure.
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
          fieldValidator = str.optional().nullable().or(z.literal(''));
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
          fieldValidator = str.optional().nullable().or(z.literal(''));
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
          fieldValidator = emailRule.optional().nullable().or(z.literal(''));
        }
        break;
      }

      case 'phone': {
        const phoneRegex = /^[\d\s+\-().]{6,25}$/;
        const phoneRule = z
          .string()
          .trim()
          .regex(phoneRegex, 'Veuillez saisir un numéro de téléphone valide.');

        if (field.required && isVisible) {
          fieldValidator = phoneRule.min(1, 'Le numéro de téléphone est obligatoire.');
        } else {
          fieldValidator = phoneRule.optional().nullable().or(z.literal(''));
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
          fieldValidator = z.union([numRule, z.literal('')]).optional().nullable();
        }
        break;
      }

      case 'select':
      case 'radio': {
        const validValues = Array.from(
          new Set(
            (field.options || [])
              .flatMap((o) => (typeof o === 'string' ? [o] : [o.value, o.label]))
              .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
          )
        );

        if (field.required && isVisible) {
          if (validValues.length > 0) {
            fieldValidator = z
              .string()
              .trim()
              .min(1, `Veuillez sélectionner une option pour ${field.label}.`)
              .refine((val) => validValues.includes(val), {
                message: `Veuillez sélectionner une option valide pour ${field.label}.`,
              });
          } else {
            fieldValidator = z.string().trim().min(1, `Veuillez sélectionner une option pour ${field.label}.`);
          }
        } else {
          fieldValidator = z.string().optional().nullable().or(z.literal(''));
        }
        break;
      }

      case 'checkboxes': {
        const validValues = Array.from(
          new Set(
            (field.options || [])
              .flatMap((o) => (typeof o === 'string' ? [o] : [o.value, o.label]))
              .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
          )
        );
        const arrayRule = z.array(z.string()).refine(
          (arr) => {
            if (!arr || arr.length === 0) return !field.required || !isVisible;
            if (validValues.length === 0) return true;
            return arr.every((item) => validValues.includes(item));
          },
          { message: `Une ou plusieurs sélections pour ${field.label} ne sont pas valides.` }
        );

        if (field.required && isVisible) {
          fieldValidator = arrayRule.min(1, `Veuillez sélectionner au moins une option pour ${field.label}.`);
        } else {
          fieldValidator = arrayRule.optional().nullable().default([]);
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
          fieldValidator = dateRule.optional().nullable().or(z.literal(''));
        }
        break;
      }

      case 'file': {
        const fileRule = z.union([z.string(), z.array(z.string())]);
        if (field.required && isVisible) {
          fieldValidator = fileRule.refine(
            (val) => {
              if (typeof val === 'string') return val.trim().length > 0;
              if (Array.isArray(val)) return val.length > 0 && val.some((s) => s.trim().length > 0);
              return false;
            },
            { message: `Le fichier pour ${field.label} est obligatoire.` }
          );
        } else {
          fieldValidator = fileRule.optional().nullable().or(z.literal(''));
        }
        break;
      }

      case 'consent': {
        if (field.required && isVisible) {
          fieldValidator = z.literal(true, {
            message: 'Vous devez accepter cette condition pour continuer.',
          });
        } else {
          fieldValidator = z.boolean().optional().nullable();
        }
        break;
      }

      default:
        fieldValidator = z.any().optional().nullable();
    }

    shape[field.key] = fieldValidator;
  }

  // Allow system & role fields
  shape['_target_role'] = z.string().optional().nullable();
  shape['_target_role_label'] = z.string().optional().nullable();

  // Add honeypot key: must be absent or empty string
  shape['_hp'] = z.string().max(0, 'Spam detection triggered').optional().nullable().or(z.literal(''));

  // Passthrough unknown keys (e.g. from localStorage drafts or custom keys)
  return z.object(shape).passthrough();
}
