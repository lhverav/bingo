import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { optionStyles } from '@/constants/authStyles';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function RadioGroup({ options, value, onChange }: RadioGroupProps) {
  return (
    <View style={optionStyles.container}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              optionStyles.button,
              isSelected && optionStyles.buttonSelected,
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              style={[
                optionStyles.text,
                isSelected && optionStyles.textSelected,
              ]}
            >
              {option.label}
            </Text>
            {isSelected && <Text style={optionStyles.checkmark}>✓</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
