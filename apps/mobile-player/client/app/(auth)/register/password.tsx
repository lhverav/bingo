import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthFlow } from '@/contexts/AuthFlowContext';
import AuthInput from '@/components/auth/AuthInput';
import AuthScreenTemplate from '@/components/auth/AuthScreenTemplate';
import { checkPasswordRequirements, getPasswordErrorMessage } from '@/utils/validation';
import { colors, spacing, fontSize } from '@/constants/authStyles';

export default function CreatePasswordScreen() {
  const { updateData, nextStep } = useAuthFlow();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const requirements = checkPasswordRequirements(password);

  const handleSubmit = () => {
    setAttemptedSubmit(true);

    if (!requirements.allMet) {
      setError(getPasswordErrorMessage(requirements));
      return;
    }

    updateData({ password });
    nextStep();
  };

  return (
    <AuthScreenTemplate
      title="Crea una contraseña"
      subtitle="Tu contraseña debe cumplir los siguientes requisitos:"
      onSubmit={handleSubmit}
      buttonDisabled={!requirements.allMet}
      showProgress={false}
    >
      <AuthInput
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError('');
          setAttemptedSubmit(false);
        }}
        error={attemptedSubmit ? error : undefined}
        inputType="password"
        placeholder="Contraseña"
      />

      {/* Password requirements hint */}
      <View style={styles.requirementsContainer}>
        <RequirementItem
          text="Mínimo 10 caracteres"
          met={requirements.minLength}
          showStatus={password.length > 0}
        />
        <RequirementItem
          text="Al menos un número"
          met={requirements.hasNumber}
          showStatus={password.length > 0}
        />
        <RequirementItem
          text="Al menos un carácter especial (!@#$%...)"
          met={requirements.hasSpecialChar}
          showStatus={password.length > 0}
        />
      </View>
    </AuthScreenTemplate>
  );
}

interface RequirementItemProps {
  text: string;
  met: boolean;
  showStatus: boolean;
}

function RequirementItem({ text, met, showStatus }: RequirementItemProps) {
  return (
    <View style={styles.requirementRow}>
      <Text style={[
        styles.requirementBullet,
        showStatus && (met ? styles.requirementMet : styles.requirementUnmet)
      ]}>
        {showStatus ? (met ? '✓' : '•') : '•'}
      </Text>
      <Text style={[
        styles.requirementText,
        showStatus && (met ? styles.requirementMet : styles.requirementUnmet)
      ]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  requirementsContainer: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  requirementBullet: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    width: 16,
  },
  requirementText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  requirementMet: {
    color: '#27ae60',
  },
  requirementUnmet: {
    color: colors.textSecondary,
  },
});
