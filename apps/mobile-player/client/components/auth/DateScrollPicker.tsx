import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '@/constants/authStyles';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface DateScrollPickerProps {
  value?: { day: number; month: number; year: number };
  onChange: (date: { day: number; month: number; year: number }) => void;
  minAge?: number;
}

export default function DateScrollPicker({
  value,
  onChange,
  minAge = 18,
}: DateScrollPickerProps) {
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - minAge;
  const minYear = currentYear - 100;

  // Generate arrays
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = MONTHS;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  // State for selected values
  const [selectedDay, setSelectedDay] = useState(value?.day || 15);
  const [selectedMonth, setSelectedMonth] = useState(value?.month || 6);
  const [selectedYear, setSelectedYear] = useState(value?.year || 1995);

  // Refs for scroll views
  const dayScrollRef = useRef<ScrollView>(null);
  const monthScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  // Initial scroll to selected values
  useEffect(() => {
    setTimeout(() => {
      scrollToIndex(dayScrollRef, days.indexOf(selectedDay));
      scrollToIndex(monthScrollRef, selectedMonth - 1);
      scrollToIndex(yearScrollRef, years.indexOf(selectedYear));
    }, 100);
  }, []);

  // Notify parent of changes
  useEffect(() => {
    onChange({ day: selectedDay, month: selectedMonth, year: selectedYear });
  }, [selectedDay, selectedMonth, selectedYear]);

  const scrollToIndex = (ref: React.RefObject<ScrollView>, index: number) => {
    ref.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: false,
    });
  };

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    items: any[],
    setter: (value: any) => void,
    isMonth?: boolean
  ) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));

    if (isMonth) {
      setter(clampedIndex + 1); // Months are 1-indexed
    } else {
      setter(items[clampedIndex]);
    }
  };

  const renderColumn = (
    items: any[],
    selectedValue: any,
    scrollRef: React.RefObject<ScrollView>,
    setter: (value: any) => void,
    isMonth?: boolean,
    formatItem?: (item: any) => string
  ) => {
    const getItemValue = (item: any) => isMonth ? items.indexOf(item) + 1 : item;

    return (
      <View style={styles.column}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => handleScrollEnd(e, items, setter, isMonth)}
        >
          {/* Padding items at top */}
          <View style={styles.paddingItem} />
          <View style={styles.paddingItem} />

          {items.map((item, index) => {
            const itemValue = getItemValue(item);
            const isSelected = isMonth
              ? (index + 1) === selectedValue
              : item === selectedValue;

            return (
              <View key={index} style={styles.item}>
                <Text style={[
                  styles.itemText,
                  isSelected && styles.itemTextSelected
                ]}>
                  {formatItem ? formatItem(item) : item}
                </Text>
              </View>
            );
          })}

          {/* Padding items at bottom */}
          <View style={styles.paddingItem} />
          <View style={styles.paddingItem} />
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Selection highlight */}
      <View style={styles.selectionHighlight} pointerEvents="none" />

      {/* Columns */}
      <View style={styles.columnsContainer}>
        {renderColumn(days, selectedDay, dayScrollRef, setSelectedDay)}
        {renderColumn(months, selectedMonth, monthScrollRef, setSelectedMonth, true, (m) => m)}
        {renderColumn(years, selectedYear, yearScrollRef, setSelectedYear)}
      </View>

      {/* Labels */}
      <View style={styles.labelsContainer}>
        <Text style={styles.label}>Día</Text>
        <Text style={styles.label}>Mes</Text>
        <Text style={styles.label}>Año</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: PICKER_HEIGHT + 30, // Extra for labels
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  columnsContainer: {
    flexDirection: 'row',
    height: PICKER_HEIGHT,
  },
  column: {
    flex: 1,
  },
  scrollView: {
    height: PICKER_HEIGHT,
  },
  scrollContent: {
    paddingVertical: 0,
  },
  paddingItem: {
    height: ITEM_HEIGHT,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  itemTextSelected: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: 'bold',
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: spacing.sm,
    right: spacing.sm,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  labelsContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
