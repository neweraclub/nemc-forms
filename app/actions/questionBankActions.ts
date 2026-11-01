'use server';

import { getAdminSession } from '@/lib/auth';
import { BankQuestionRecord } from '@/types/form';
import {
  fetchCloudQuestionBank,
  saveCloudQuestionBank,
  deleteCloudQuestion,
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
      questions: questions || [],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('getQuestionBankAction error:', err);
    return { success: false, questions: [], error: msg };
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

    const currentQuestions = (await fetchCloudQuestionBank()) || [];
    const qId = questionData.id || `bq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullQuestion: BankQuestionRecord = {
      ...questionData,
      id: qId,
      label: questionData.label.trim(),
      key: (questionData.key || '').trim() || `q_${Date.now().toString(36)}`,
      category: (questionData.category || 'Général').trim(),
      help_text: questionData.help_text ? questionData.help_text.trim() : null,
      placeholder: questionData.placeholder ? questionData.placeholder.trim() : null,
      required: questionData.required ?? false,
      options: questionData.options || [],
      validation: questionData.validation || {},
      created_at: questionData.created_at || new Date().toISOString(),
    };

    const existingIdx = currentQuestions.findIndex((q) => q.id === qId);
    if (existingIdx >= 0) {
      currentQuestions[existingIdx] = fullQuestion;
    } else {
      currentQuestions.unshift(fullQuestion);
    }

    const saved = await saveCloudQuestionBank(currentQuestions);
    if (!saved) {
      return { success: false, error: 'Échec de la sauvegarde dans la base de données.' };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/questions');
    revalidatePath('/admin/forms/new');
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

    await deleteCloudQuestion(questionId);

    revalidatePath('/admin');
    revalidatePath('/admin/questions');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('deleteQuestionBankAction error:', err);
    return { success: false, error: msg };
  }
}
