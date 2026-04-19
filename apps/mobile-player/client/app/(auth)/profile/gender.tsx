import { useState } from 'react';
import { useAuthFlow } from '@/contexts/AuthFlowContext';
import AuthScreenTemplate from '@/components/auth/AuthScreenTemplate';
import RadioGroup from '@/components/auth/RadioGroup';

const GENDER_OPTIONS = [
  { value: 'femenino', label: 'Femenino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'no_binario', label: 'No binario' },
  { value: 'otro', label: 'Otro' },
  { value: 'no_decir', label: 'Prefiero no compartirlo' },
];

export default function GenderScreen() {
  const { updateData, nextStep } = useAuthFlow();
  const [gender, setGender] = useState('');

  const handleSubmit = () => {
    if (!gender) return;

    updateData({ gender });
    nextStep();
  };

  return (
    <AuthScreenTemplate
      title="¿Cuál es tu género?"
      subtitle="Esta información nos ayuda a personalizar tu experiencia."
      onSubmit={handleSubmit}
      buttonDisabled={!gender}
    >
      <RadioGroup
        options={GENDER_OPTIONS}
        value={gender}
        onChange={setGender}
      />
    </AuthScreenTemplate>
  );
}
