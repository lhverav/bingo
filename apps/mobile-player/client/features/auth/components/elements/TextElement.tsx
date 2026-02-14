import React from 'react';
import { Text } from 'react-native';
import { TextElement as TextElementType } from '../../types/authflow.types';
import { resolveTemplate } from '../../utils/screenResolver';
import { authStyles } from '../../styles/theme';

interface Props extends TextElementType {
  params?: Record<string, string>;
}

export function TextElementComponent({ label, params }: Props) {
  // Resolve template variables in label
  const resolvedLabel = resolveTemplate(label, params);

  return <Text style={authStyles.text}>{resolvedLabel}</Text>;
}
