import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { RadioElement as RadioElementType } from '../../types/authflow.types';
import { useAuthFlow } from '../../contexts/AuthFlowContext';
import { authStyles } from '../../styles/theme';

interface Props extends RadioElementType {
  groupName?: string;
}

export function RadioElementComponent({ label, groupName = 'default' }: Props) {
  const { radioSelections, setRadioSelection } = useAuthFlow();

  const isSelected = radioSelections[groupName] === label;

  const handlePress = () => {
    setRadioSelection(groupName, label);
  };

  return (
    <TouchableOpacity
      style={authStyles.radioContainer}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[authStyles.radioOuter, isSelected && authStyles.radioOuterSelected]}>
        {isSelected && <View style={authStyles.radioInner} />}
      </View>
      <Text style={authStyles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );
}
