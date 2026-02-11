import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

interface BingoCardProps {
  id: string;
  cells: number[][];
  selected?: boolean;
  onSelect?: (id: string) => void;
  markedNumbers?: number[];
  onMarkNumber?: (number: number) => void;
  disabled?: boolean;
}

export default function BingoCard({
  id,
  cells,
  selected = false,
  onSelect,
  markedNumbers = [],
  onMarkNumber,
  disabled = false,
}: BingoCardProps) {
  const handlePress = () => {
    if (onSelect && !disabled) {
      onSelect(id);
    }
  };

  const handleCellPress = (number: number) => {
    if (onMarkNumber && !disabled) {
      onMarkNumber(number);
    }
  };

  const isSelectable = !!onSelect;
  const isMarkable = !!onMarkNumber;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
      ]}
      onPress={handlePress}
      disabled={!isSelectable || disabled}
      activeOpacity={isSelectable ? 0.7 : 1}
    >
      {selected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
      <View style={styles.grid}>
        {cells.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((number, colIndex) => {
              const isMarked = markedNumbers.includes(number);
              return (
                <TouchableOpacity
                  key={`${rowIndex}-${colIndex}`}
                  style={[styles.cell, isMarked && styles.cellMarked]}
                  onPress={() => handleCellPress(number)}
                  disabled={!isMarkable || disabled}
                  activeOpacity={isMarkable ? 0.7 : 1}
                >
                  <Text style={[styles.cellText, isMarked && styles.cellTextMarked]}>
                    {number}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#ddd",
    position: "relative",
  },
  cardSelected: {
    borderColor: "#FFD700",
    borderWidth: 3,
    backgroundColor: "#fffef0",
  },
  cardDisabled: {
    opacity: 0.6,
  },
  checkmark: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#FFD700",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  checkmarkText: {
    color: "#333",
    fontSize: 18,
    fontWeight: "bold",
  },
  grid: {
    gap: 3,
  },
  row: {
    flexDirection: "row",
    gap: 3,
  },
  cell: {
    width: 40,
    height: 40,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cellMarked: {
    backgroundColor: "#FFD700",
    borderColor: "#FFA500",
  },
  cellText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  cellTextMarked: {
    color: "#333",
    fontWeight: "bold",
  },
});
