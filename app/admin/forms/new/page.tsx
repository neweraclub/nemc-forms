import { FormBuilder } from '../FormBuilder';
import { getTargetRolesAction } from '@/app/actions/roleActions';
import { getQuestionBankAction } from '@/app/actions/questionBankActions';

export const metadata = {
  title: 'Créer un formulaire — Administration New Era Medical Club',
};

export const dynamic = 'force-dynamic';

export default async function NewFormPage() {
  const [rolesRes, bankRes] = await Promise.all([
    getTargetRolesAction(),
    getQuestionBankAction(),
  ]);

  return (
    <div className="py-2">
      <FormBuilder
        isEditing={false}
        availableRoles={rolesRes.roles || []}
        questionBank={bankRes.questions || []}
      />
    </div>
  );
}
