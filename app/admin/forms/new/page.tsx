import { FormBuilder } from '../FormBuilder';

export const metadata = {
  title: 'Créer un formulaire — Administration Club Médical New Era',
};

export const dynamic = 'force-dynamic';

export default function NewFormPage() {
  return (
    <div className="py-2">
      <FormBuilder isEditing={false} />
    </div>
  );
}
