import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthFlow } from '@/contexts/AuthFlowContext';
import AuthInput from '@/components/auth/AuthInput';
import AuthScreenTemplate from '@/components/auth/AuthScreenTemplate';
import EmailExistsModal from '@/components/auth/EmailExistsModal';
import { validate, isValidEmailFormat } from '@/utils/validation';
import { checkEmailExists, AuthMethod } from '@/api/auth';
import { initiateGoogleLogin } from '@/utils/googleOAuth';

export default function EmailInputScreen() {
  const { updateData, nextStep } = useAuthFlow();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExistsModal, setShowExistsModal] = useState(false);
  const [existingAuthMethod, setExistingAuthMethod] = useState<AuthMethod>('email');

  const isEmailValid = isValidEmailFormat(email);

  const handleSubmit = async () => {
    const validation = validate('email', email);
    if (!validation.valid) {
      setError(validation.message || 'Email invalido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await checkEmailExists(email);
      if (result.exists && result.authMethod) {
        setExistingAuthMethod(result.authMethod);
        setShowExistsModal(true);
        setLoading(false);
        return;
      }

      updateData({ email });
      setLoading(false);
      nextStep();
    } catch (err) {
      setError('Error al verificar el email. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const handleGoToLogin = async () => {
    setShowExistsModal(false);

    switch (existingAuthMethod) {
      case 'google':
        // Redirect to Google OAuth
        try {
          await initiateGoogleLogin();
        } catch (err) {
          console.error('Google login error:', err);
        }
        break;

      case 'facebook':
      case 'apple':
        // TODO: Implement other OAuth providers
        router.replace('/(auth)/login/hub');
        break;

      case 'phone':
        // Redirect to phone login flow
        router.replace('/(auth)/register/phone');
        break;

      case 'email':
      default:
        // Redirect to email login with pre-filled email
        router.replace(`/(auth)/login/email?prefillEmail=${encodeURIComponent(email)}`);
        break;
    }
  };

  return (
    <>
      <AuthScreenTemplate
        title="Cual es tu email?"
        subtitle="Lo necesitaras para iniciar sesion."
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
        authMethod={existingAuthMethod}
        onLogin={handleGoToLogin}
        onClose={() => setShowExistsModal(false)}
      />
    </>
  );
}
