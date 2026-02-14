import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { CheckboxElement as CheckboxElementType } from '../../types/authflow.types';
import { useAuthFlow } from '../../contexts/AuthFlowContext';
import { resolveTemplate } from '../../utils/screenResolver';
import { authStyles } from '../../styles/theme';

interface Props extends CheckboxElementType {
  params?: Record<string, string>;
}

export function CheckboxElementComponent({ label, params }: Props) {
  const { checkboxSelections, setCheckboxSelection } = useAuthFlow();

  // Resolve template variables in label
  const resolvedLabel = resolveTemplate(label, params);

  const isChecked = checkboxSelections[label] ?? false;

  const handlePress = () => {
    setCheckboxSelection(label, !isChecked);
  };

  return (
    <TouchableOpacity
      style={authStyles.checkboxContainer}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[authStyles.checkbox, isChecked && authStyles.checkboxSelected]}>
        {isChecked && <Text style={authStyles.checkboxCheck}>✓</Text>}
      </View>
      <Text style={authStyles.checkboxLabel}>{resolvedLabel}</Text>
    </TouchableOpacity>
  );
}
