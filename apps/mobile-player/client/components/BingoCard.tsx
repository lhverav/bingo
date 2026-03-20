import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from "react-native";

// Card type configurations matching domain
type CardType = 'bingo' | 'bingote';

const CARD_CONFIG = {
  bingo: {
    letters: ['B', 'I', 'N', 'G', 'O'],
    columns: 5,
  },
  bingote: {
    letters: ['B', 'I', 'N', 'G', 'O', 'T', 'E'],
    columns: 7,
  },
};

interface BingoCardProps {
  id: string;
  cells: number[][];
  cardType?: CardType;
  selected?: boolean;
  onSelect?: (id: string) => void;
  markedNumbers?: number[];
  onMarkNumber?: (number: number) => void;
  disabled?: boolean;
  compact?: boolean; // For smaller display in selection screen
}

export default function BingoCard({
  id,
  cells,
  cardType,
  selected = false,
  onSelect,
  markedNumbers = [],
  onMarkNumber,
  disabled = false,
  compact = false,
}: BingoCardProps) {
  // Auto-detect card type from cells if not provided
  const detectedType: CardType = cardType || (cells[0]?.length === 7 ? 'bingote' : 'bingo');
  const config = CARD_CONFIG[detectedType];

  // Calculate cell size based on card type and compact mode
  const screenWidth = Dimensions.get('window').width;
  const maxCardWidth = compact ? screenWidth * 0.42 : screenWidth - 60;
  const cellSize = compact
    ? Math.floor((maxCardWidth - 20) / config.columns) - 3
    : Math.floor((maxCardWidth - 20) / config.columns) - 4;
  const fontSize = compact ? 12 : (cellSize > 35 ? 16 : 14);
  const headerFontSize = compact ? 10 : 14;

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

      {/* Column Headers */}
      <View style={[styles.row, styles.headerRow]}>
        {config.letters.map((letter, index) => (
          <View
            key={`header-${index}`}
            style={[
              styles.headerCell,
              { width: cellSize, height: cellSize * 0.6 },
            ]}
          >
            <Text style={[styles.headerText, { fontSize: headerFontSize }]}>
              {letter}
            </Text>
          </View>
        ))}
      </View>

      {/* Card Grid */}
      <View style={styles.grid}>
        {cells.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((number, colIndex) => {
              const isMarked = markedNumbers.includes(number);
              const isFreeSpace = number === 0;
              return (
                <TouchableOpacity
                  key={`${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize },
                    isMarked && styles.cellMarked,
                    isFreeSpace && styles.cellFree,
                  ]}
                  onPress={() => handleCellPress(number)}
                  disabled={!isMarkable || disabled || isFreeSpace}
                  activeOpacity={isMarkable && !isFreeSpace ? 0.7 : 1}
                >
                  <Text style={[
                    styles.cellText,
                    { fontSize },
                    isMarked && styles.cellTextMarked,
                    isFreeSpace && styles.cellTextFree,
                  ]}>
                    {isFreeSpace ? '★' : number}
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
    justifyContent: "center",
  },
  headerRow: {
    marginBottom: 4,
  },
  headerCell: {
    backgroundColor: "#3498db",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cell: {
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
  cellFree: {
    backgroundColor: "#FFD700",
    borderColor: "#FFA500",
  },
  cellText: {
    fontWeight: "600",
    color: "#333",
  },
  cellTextMarked: {
    color: "#333",
    fontWeight: "bold",
  },
  cellTextFree: {
    color: "#333",
  },
});
