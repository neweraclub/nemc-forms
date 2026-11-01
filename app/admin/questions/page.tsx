import { getQuestionBankAction } from '@/app/actions/questionBankActions';
import { QuestionBankClient } from './QuestionBankClient';

export const metadata = {
  title: 'Banque de Questions Réutilisables — Administration New Era Medical Club',
  description: 'Gérez votre catalogue de questions pré-configurées pour tous vos formulaires.',
};

export const dynamic = 'force-dynamic';

export default async function AdminQuestionsPage() {
  const res = await getQuestionBankAction();

  return (
    <QuestionBankClient initialQuestions={res.questions || []} />
  );
}
