import type { AnswerOption, Item } from '../../../../types';

export interface AnswerOptionForm {
  text: string;
  image_url: string;
}

export interface ItemForm {
  topic_id: string;
  image_url: string;
  text: string;
  description: string;
  answer_type: 'choice' | 'text_input';
  options: AnswerOptionForm[];  // used when answer_type === 'choice'
  correct_option: number;       // index; ignored when answer_type === 'text_input'
  correct_text: string;         // used when answer_type === 'text_input'
  b: string;
  se: string;
  grade_min: string;
  grade_max: string;
}

export const EMPTY_OPTION: AnswerOptionForm = { text: '', image_url: '' };

export const EMPTY_FORM: ItemForm = {
  topic_id: '',
  image_url: '',
  text: '',
  description: '',
  answer_type: 'choice',
  options: [{ ...EMPTY_OPTION }, { ...EMPTY_OPTION }, { ...EMPTY_OPTION }, { ...EMPTY_OPTION }],
  correct_option: 0,
  correct_text: '',
  b: '0',
  se: '0.5',
  grade_min: '1',
  grade_max: '11',
};

export function normalizeToOptionForm(opt: AnswerOption | string | null | undefined): AnswerOptionForm {
  if (!opt) return { text: '', image_url: '' };
  if (typeof opt === 'string') return { text: opt, image_url: '' };
  return { text: opt.text ?? '', image_url: opt.image_url ?? '' };
}

export function ensureMinOptions(opts: AnswerOptionForm[]): AnswerOptionForm[] {
  if (opts.length >= 2) return opts;
  return [...opts, ...Array.from({ length: 2 - opts.length }, () => ({ ...EMPTY_OPTION }))];
}

export function itemToForm(item: Item): ItemForm {
  return {
    topic_id: item.topic_id,
    image_url: item.image_url ?? '',
    text: item.text ?? '',
    description: item.description ?? '',
    answer_type: item.answer_type ?? 'choice',
    options: ensureMinOptions((item.options ?? []).map(normalizeToOptionForm)),
    correct_option: item.correct_option ?? 0,
    correct_text: item.correct_text ?? '',
    b: String(item.b),
    se: String(item.se),
    grade_min: String(item.grade_min ?? 1),
    grade_max: String(item.grade_max ?? 4),
  };
}

/**
 * Convert form state into the payload sent to Supabase.
 * Throws when an option is missing both text and image (the only
 * synchronous validation in the form).
 */
export function formToPayload(f: ItemForm) {
  if (f.answer_type === 'text_input') {
    return {
      topic_id: f.topic_id,
      image_url: f.image_url || null,
      text: f.text || null,
      description: f.description || null,
      answer_type: 'text_input' as const,
      options: [],
      correct_option: null,
      correct_text: f.correct_text || null,
      b: parseFloat(f.b),
      se: parseFloat(f.se),
      grade_min: parseInt(f.grade_min, 10) || 1,
      grade_max: parseInt(f.grade_max, 10) || 4,
    };
  }
  return {
    topic_id: f.topic_id,
    image_url: f.image_url || null,
    text: f.text || null,
    description: f.description || null,
    answer_type: 'choice' as const,
    options: f.options.map((o, i): AnswerOption => {
      if (!o.text.trim() && !o.image_url) {
        throw new Error(
          `Вариант ${String.fromCharCode(65 + i)}: нужен текст или картинка`,
        );
      }
      return {
        ...(o.text.trim() ? { text: o.text.trim() } : {}),
        ...(o.image_url ? { image_url: o.image_url } : {}),
      };
    }),
    correct_option: f.correct_option,
    correct_text: null,
    b: parseFloat(f.b),
    se: parseFloat(f.se),
    grade_min: parseInt(f.grade_min, 10) || 1,
    grade_max: parseInt(f.grade_max, 10) || 4,
  };
}
