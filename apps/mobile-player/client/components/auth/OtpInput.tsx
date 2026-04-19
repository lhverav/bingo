import { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Keyboard,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '@/constants/authStyles';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
}: OtpInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isSequential, setIsSequential] = useState(true);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const lastFilledIndex = useRef(-1);
  const lastCompletedValue = useRef<string | null>(null);

  // Convert value string to array of digits
  const digits = value.split('').slice(0, length);
  while (digits.length < length) {
    digits.push('');
  }

  // Focus first empty box on mount
  useEffect(() => {
    const firstEmptyIndex = digits.findIndex((d) => d === '');
    if (firstEmptyIndex !== -1 && firstEmptyIndex === 0) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, []);

  // Handle completion when all digits are filled sequentially
  useEffect(() => {
    if (value.length === length && isSequential && onComplete) {
      // Only call onComplete once per unique completed value
      if (lastCompletedValue.current !== value) {
        lastCompletedValue.current = value;
        onComplete(value);
      }
    }
  }, [value, length, isSequential, onComplete]);

  const handleDigitChange = (text: string, index: number) => {
    if (disabled) return;

    // Handle paste (multiple characters)
    if (text.length > 1) {
      const pastedDigits = text.replace(/\D/g, '').slice(0, length);
      if (pastedDigits.length > 0) {
        onChange(pastedDigits);
        setIsSequential(true);
        lastFilledIndex.current = pastedDigits.length - 1;

        // Focus last filled or next empty
        const nextIndex = Math.min(pastedDigits.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    // Handle single digit
    const digit = text.replace(/\D/g, '');

    if (digit) {
      // Check if this is sequential input
      const expectedIndex = lastFilledIndex.current + 1;
      if (index !== expectedIndex && lastFilledIndex.current >= 0) {
        setIsSequential(false);
      }
      lastFilledIndex.current = index;

      // Update the value
      const newDigits = [...digits];
      newDigits[index] = digit;
      onChange(newDigits.join(''));

      // Auto-advance to next box
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // Last digit entered, dismiss keyboard
        Keyboard.dismiss();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (disabled) return;

    if (e.nativeEvent.key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        // Current box is empty, go back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
        lastFilledIndex.current = index - 2;
      } else {
        // Clear current box
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
        lastFilledIndex.current = index - 1;
      }
      // Reset sequential tracking if we're clearing
      if (value.length <= 1) {
        setIsSequential(true);
        lastFilledIndex.current = -1;
      }
    }
  };

  const handleBoxPress = (index: number) => {
    if (disabled) return;
    inputRefs.current[index]?.focus();
    setFocusedIndex(index);
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const clearAll = () => {
    onChange('');
    setIsSequential(true);
    lastFilledIndex.current = -1;
    lastCompletedValue.current = null;
    inputRefs.current[0]?.focus();
  };

  return (
    <View style={styles.container}>
      <View style={styles.boxesContainer}>
        {digits.map((digit, index) => {
          const isFocused = focusedIndex === index;
          const isFilled = digit !== '';
          const hasError = !!error;

          return (
            <Pressable
              key={index}
              onPress={() => handleBoxPress(index)}
              style={[
                styles.box,
                isFocused && styles.boxFocused,
                isFilled && styles.boxFilled,
                hasError && styles.boxError,
              ]}
            >
              <TextInput
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.input}
                value={digit}
                onChangeText={(text) => handleDigitChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => handleFocus(index)}
                onBlur={handleBlur}
                keyboardType="number-pad"
                maxLength={length} // Allow paste
                selectTextOnFocus
                editable={!disabled}
                caretHidden
              />
            </Pressable>
          );
        })}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// Export helper to clear and refocus
export function useOtpInputRef() {
  const clearRef = useRef<(() => void) | null>(null);
  return {
    clear: () => clearRef.current?.(),
    setClearFn: (fn: () => void) => (clearRef.current = fn),
  };
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 52,
    maxHeight: 52,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxFocused: {
    borderColor: colors.primary,
  },
  boxFilled: {
    borderColor: colors.primary,
  },
  boxError: {
    borderColor: colors.error,
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  errorContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
