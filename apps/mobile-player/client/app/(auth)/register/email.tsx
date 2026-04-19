import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthFlow } from '@/contexts/AuthFlowContext';
import AuthInput from '@/components/auth/AuthInput';
import AuthScreenTemplate from '@/components/auth/AuthScreenTemplate';
import EmailExistsModal from '@/components/auth/EmailExistsModal';
import { validate, isValidEmailFormat } from '@/utils/validation';
import { checkEmailExists } from '@/api/auth';

export default function EmailInputScreen() {
  const { updateData, nextStep } = useAuthFlow();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExistsModal, setShowExistsModal] = useState(false);

  const isEmailValid = isValidEmailFormat(email);

  const handleSubmit = async () => {
    const validation = validate('email', email);
    if (!validation.valid) {
      setError(validation.message || 'Email inválido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const exists = await checkEmailExists(email);
      if (exists) {
        setShowExistsModal(true);
        setLoading(false);
        return;
      }

      updateData({ email });
      nextStep();
    } catch (err) {
      setError('Error al verificar el email. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    setShowExistsModal(false);
    // Navigate to login with email pre-filled
    updateData({ email });
    router.replace('/(auth)/login/email');
  };

  return (
    <>
      <AuthScreenTemplate
        title="¿Cuál es tu email?"
        subtitle="Lo necesitarás para iniciar sesión."
        onSubmit={handleSubmit}
        buttonDisabled={!isEmailValid || loading}
        showProgress={false}
        loading={loading}
      >
        <AuthInput
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          error={error}
          inputType="email"
          placeholder="correo@ejemplo.com"
        />
      </AuthScreenTemplate>

      <EmailExistsModal
        visible={showExistsModal}
        email={email}
        onLogin={handleGoToLogin}
        onClose={() => setShowExistsModal(false)}
      />
    </>
  );
}
