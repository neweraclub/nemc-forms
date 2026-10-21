import { FormBuilder } from '../FormBuilder';

export const metadata = {
  title: 'Créer un formulaire — Administration New Era Medical Club',
};

export const dynamic = 'force-dynamic';

export default function NewFormPage() {
  return (
    <div className="py-2">
      <FormBuilder isEditing={false} />
    </div>
  );
}
