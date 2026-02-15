import { View, Text } from 'react-native';
import { progressStyles } from '@/constants/authStyles';

interface ProgressBarProps {
  step: number;
  total: number;
}

export default function ProgressBar({ step, total }: ProgressBarProps) {
  const percentage = (step / total) * 100;

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.bar}>
        <View style={[progressStyles.fill, { width: `${percentage}%` }]} />
      </View>
      <Text style={progressStyles.text}>
        Paso {step} de {total}
      </Text>
    </View>
  );
}
