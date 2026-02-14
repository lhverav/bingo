import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, Modal } from 'react-native';
import { InputElement as InputElementType } from '../../types/authflow.types';
import { useAuthFlow } from '../../contexts/AuthFlowContext';
import { resolveValue } from '../../utils/screenResolver';
import { authStyles, colors, spacing, borderRadius } from '../../styles/theme';

// Try to import DateTimePicker, fallback to text input if not available
let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
  // DateTimePicker not available, will use text input fallback
}

interface Props extends InputElementType {
  params?: Record<string, any>;
  error?: string;
  onChangeValue?: (value: any) => void;
}

export function InputElementComponent({
  label,
  inputType = 'text',
  value: defaultValue,
  params = {},
  error,
  onChangeValue,
}: Props) {
  const { formData, setFormValue, context } = useAuthFlow();
  const [isFocused, setIsFocused] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Resolve default value from params or context
  const resolvedDefault = resolveValue(defaultValue, params, context);

  // Get current value from form data or use resolved default
  const currentValue = formData[label] ?? resolvedDefault ?? '';

  const handleChange = (newValue: any) => {
    setFormValue(label, newValue);
    onChangeValue?.(newValue);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      handleChange(selectedDate.toISOString().split('T')[0]);
    }
  };

  const getKeyboardType = () => {
    switch (inputType) {
      case 'email':
        return 'email-address';
      case 'tel':
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  const formatDateDisplay = (value: string) => {
    if (!value) return '';
    try {
      const date = new Date(value);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  };

  // Date input with native picker or text fallback
  if (inputType === 'date') {
    const currentDate = currentValue ? new Date(currentValue) : new Date();

    // If DateTimePicker is available, use it
    if (DateTimePicker) {
      return (
        <View style={authStyles.inputContainer}>
          <Text style={authStyles.inputLabel}>{label}</Text>
          <TouchableOpacity
            style={[
              authStyles.input,
              isFocused && authStyles.inputFocused,
              error && authStyles.inputError,
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: currentValue ? colors.text : colors.textMuted }}>
              {currentValue ? formatDateDisplay(currentValue) : 'Seleccionar fecha'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <>
              {Platform.OS === 'ios' ? (
                <Modal
                  transparent
                  animationType="slide"
                  visible={showDatePicker}
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                  }}>
                    <View style={{
                      backgroundColor: 'white',
                      padding: spacing.md,
                      borderTopLeftRadius: borderRadius.lg,
                      borderTopRightRadius: borderRadius.lg,
                    }}>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={{ alignSelf: 'flex-end', padding: spacing.sm }}
                      >
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Listo</Text>
                      </TouchableOpacity>
                      <DateTimePicker
                        value={currentDate}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                      />
                    </View>
                  </View>
                </Modal>
              ) : (
                <DateTimePicker
                  value={currentDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </>
          )}
          {error && <Text style={authStyles.errorText}>{error}</Text>}
        </View>
      );
    }

    // Fallback: text input for date (format: DD/MM/YYYY)
    return (
      <View style={authStyles.inputContainer}>
        <Text style={authStyles.inputLabel}>{label}</Text>
        <TextInput
          style={[
            authStyles.input,
            isFocused && authStyles.inputFocused,
            error && authStyles.inputError,
          ]}
          value={currentValue ? formatDateDisplay(currentValue) : ''}
          onChangeText={(text) => {
            // Try to parse DD/MM/YYYY format
            const parts = text.split('/');
            if (parts.length === 3) {
              const [day, month, year] = parts;
              const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              handleChange(dateStr);
            } else {
              handleChange(text);
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="DD/MM/YYYY"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
        />
        {error && <Text style={authStyles.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={authStyles.inputContainer}>
      <Text style={authStyles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          authStyles.input,
          isFocused && authStyles.inputFocused,
          error && authStyles.inputError,
        ]}
        value={currentValue}
        onChangeText={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={`Ingresa tu ${label.toLowerCase()}`}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={inputType === 'password'}
        keyboardType={getKeyboardType()}
        autoCapitalize={inputType === 'email' ? 'none' : 'sentences'}
        autoCorrect={false}
      />
      {error && <Text style={authStyles.errorText}>{error}</Text>}
    </View>
  );
}
