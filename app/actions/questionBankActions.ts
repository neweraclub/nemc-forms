'use server';

import { getAdminSession } from '@/lib/auth';
import { BankQuestionRecord } from '@/types/form';
import {
  fetchCloudQuestionBank,
  saveCloudQuestionBank,
  DEFAULT_QUESTION_BANK,
} from '@/lib/supabase/cloud-registry';
import { revalidatePath } from 'next/cache';

export async function getQuestionBankAction(): Promise<{
  success: boolean;
  questions: BankQuestionRecord[];
  error?: string;
}> {
  try {
    const questions = await fetchCloudQuestionBank();
    return {
      success: true,
      questions: questions && questions.length > 0 ? questions : DEFAULT_QUESTION_BANK,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('getQuestionBankAction error:', err);
    return { success: false, questions: DEFAULT_QUESTION_BANK, error: msg };
  }
}

export async function saveQuestionBankAction(
  questionData: Omit<BankQuestionRecord, 'created_at' | 'id'> & { id?: string; created_at?: string }
): Promise<{
  success: boolean;
  question?: BankQuestionRecord;
  error?: string;
}> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
    }

    if (!questionData.label || !questionData.label.trim()) {
      return { success: false, error: 'L’intitulé de la question est obligatoire.' };
    }

    const currentQuestions = (await fetchCloudQuestionBank()) || [...DEFAULT_QUESTION_BANK];
    const qId = questionData.id || `bq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullQuestion: BankQuestionRecord = {
      ...questionData,
      id: qId,
      category: (questionData.category || 'Général').trim(),
      label: questionData.label.trim(),
      key: (questionData.key || questionData.label.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 25)).trim(),
      type: questionData.type || 'short_text',
      help_text: questionData.help_text?.trim() || null,
      placeholder: questionData.placeholder?.trim() || null,
      required: Boolean(questionData.required),
      options: questionData.options || [],
      validation: questionData.validation || {},
      created_at: questionData.created_at || new Date().toISOString(),
    };

    const existingIdx = currentQuestions.findIndex((q) => q.id === qId);
    if (existingIdx >= 0) {
      currentQuestions[existingIdx] = fullQuestion;
    } else {
      currentQuestions.push(fullQuestion);
    }

    const saved = await saveCloudQuestionBank(currentQuestions);
    if (!saved) {
      return { success: false, error: 'Échec de l’enregistrement dans le cloud Supabase.' };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/questions');
    return { success: true, question: fullQuestion };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('saveQuestionBankAction error:', err);
    return { success: false, error: msg };
  }
}

export async function deleteQuestionBankAction(questionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
    }

    const currentQuestions = (await fetchCloudQuestionBank()) || [...DEFAULT_QUESTION_BANK];
    const filtered = currentQuestions.filter((q) => q.id !== questionId);

    const saved = await saveCloudQuestionBank(filtered);
    if (!saved) {
      return { success: false, error: 'Échec de la suppression dans le cloud Supabase.' };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/questions');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('deleteQuestionBankAction error:', err);
    return { success: false, error: msg };
  }
}
