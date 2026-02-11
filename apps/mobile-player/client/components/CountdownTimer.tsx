import { StyleSheet, Text, View } from "react-native";
import { useState, useEffect } from "react";

interface CountdownTimerProps {
  deadline: Date;
  onTimeout: () => void;
}

export default function CountdownTimer({ deadline, onTimeout }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const difference = Math.max(0, Math.floor((target - now) / 1000));
      return difference;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline, onTimeout]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isUrgent = timeLeft <= 10;
  const isWarning = timeLeft <= 30 && timeLeft > 10;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tiempo restante</Text>
      <Text
        style={[
          styles.timer,
          isUrgent && styles.timerUrgent,
          isWarning && styles.timerWarning,
        ]}
      >
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  timer: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#333",
  },
  timerWarning: {
    color: "#f39c12",
  },
  timerUrgent: {
    color: "#e74c3c",
  },
});
