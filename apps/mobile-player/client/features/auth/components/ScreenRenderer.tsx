import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Screen, Element } from '../types/authflow.types';
import { useAuthFlow } from '../contexts/AuthFlowContext';
import { resolveTemplate } from '../utils/screenResolver';
import { useValidation } from '../hooks/useValidation';
import { ElementRenderer } from './ElementRenderer';
import { authStyles } from '../styles/theme';

interface Props {
  screen: Screen;
}

export function ScreenRenderer({ screen }: Props) {
  const { params, formData, radioSelections } = useAuthFlow();
  const { errors, validateFields } = useValidation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolve screen title with params
  const title = useMemo(() => {
    const mergedParams = { ...screen.params, ...params };
    return resolveTemplate(screen.name, mergedParams);
  }, [screen.name, screen.params, params]);

  // Determine radio group name based on screen
  const radioGroupName = useMemo(() => {
    // Check if screen has radio elements
    const hasRadios = screen.elements.some((el) => el.type === 'radio');
    return hasRadios ? `radio_${screen.name}` : undefined;
  }, [screen.name, screen.elements]);

  // Validate before navigation (for buttons that need validation)
  const handleBeforeNavigate = async (): Promise<boolean> => {
    // Get all input fields from current screen
    const inputElements = screen.elements.filter((el) => el.type === 'input');

    if (inputElements.length === 0) {
      return true; // No inputs to validate
    }

    // Validate form data
    const isValid = validateFields(formData);

    if (!isValid) {
      // Show first error
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Alert.alert('Error', firstError);
      }
      return false;
    }

    // Check if radio selection is required and made
    if (radioGroupName && !radioSelections[radioGroupName]) {
      const radioLabels = screen.elements
        .filter((el) => el.type === 'radio')
        .map((el) => el.label);

      if (radioLabels.length > 0) {
        Alert.alert('Error', 'Por favor selecciona una opcion');
        return false;
      }
    }

    return true;
  };

  // Merge params for elements
  const mergedParams = useMemo(() => {
    return { ...screen.params, ...params };
  }, [screen.params, params]);

  return (
    <ScrollView
      style={authStyles.screenContainer}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={authStyles.screenTitle}>{title}</Text>

      <View style={authStyles.elementsContainer}>
        {screen.elements.map((element, index) => (
          <ElementRenderer
            key={`${element.type}-${element.label}-${index}`}
            element={element}
            params={mergedParams}
            radioGroupName={radioGroupName}
            validationErrors={errors}
            onBeforeNavigate={
              element.type === 'button' && (element as any).screen
                ? handleBeforeNavigate
                : undefined
            }
          />
        ))}
      </View>
    </ScrollView>
  );
}
