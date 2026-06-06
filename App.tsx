import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import {
  Accelerometer,
  Gyroscope,
  DeviceMotion,
} from "expo-sensors";

export default function App() {
  const [driving, setDriving] = useState(false);
  const [score, setScore] = useState(100);

  const [duration, setDuration] = useState(0);

  const [harshBrakes, setHarshBrakes] = useState(0);
  const [harshAccel, setHarshAccel] = useState(0);
  const [sharpTurns, setSharpTurns] = useState(0);
  const [phoneHandling, setPhoneHandling] = useState(0);
const [timeline, setTimeline] = useState<string[]>([]);

  const [accelData, setAccelData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });

  const [gyroData, setGyroData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });

  const [motionData, setMotionData] = useState<any>(null);

  const timerRef = useRef<any>(null);

  const accelSub = useRef<any>(null);
  const gyroSub = useRef<any>(null);
  const motionSub = useRef<any>(null);

  const brakeCooldown = useRef(false);
  const accelCooldown = useRef(false);
  const turnCooldown = useRef(false);
  const phoneCooldown = useRef(false);

  useEffect(() => {
    return () => stopSensors();
  }, []);

  const deductScore = (points: number) => {
    setScore((prev) => Math.max(prev - points, 0));
  };
  const addEvent = (eventName: string) => {
  const time = new Date().toLocaleTimeString();

  setTimeline((prev) => [`${time} - ${eventName}`,
    ...prev,
  ]);
};

const getScoreColor = () => {
  if (score >= 90) return "#00E676";
  if (score >= 75) return "#7CFC00";
  if (score >= 60) return "#FFD600";
  if (score >= 40) return "#FF9100";
  return "#FF1744";
};

  const startDrive = () => {
    setDriving(true);

    setScore(100);
    setDuration(0);

    setHarshBrakes(0);
    setHarshAccel(0);
    setSharpTurns(0);
    setPhoneHandling(0);
    setTimeline([]);

    Accelerometer.setUpdateInterval(300);
    Gyroscope.setUpdateInterval(300);
    DeviceMotion.setUpdateInterval(300);

    accelSub.current = Accelerometer.addListener((data) => {
      setAccelData(data);

      const force = Math.sqrt(
        data.x * data.x +
          data.y * data.y +
          data.z * data.z
      );

      // HARSH ACCELERATION
      if (force > 1.8 && !accelCooldown.current) {
        accelCooldown.current = true;

        setHarshAccel((v) => v + 1);
        deductScore(5);
addEvent("Harsh Acceleration");

        setTimeout(() => {
          accelCooldown.current = false;
        }, 2000);
      }

      // HARSH BRAKING
      if (force < 0.4 && !brakeCooldown.current) {
        brakeCooldown.current = true;

        setHarshBrakes((v) => v + 1);
        deductScore(5);
addEvent("Harsh Brake");

        setTimeout(() => {
          brakeCooldown.current = false;
        }, 2000);
      }
    });

    gyroSub.current = Gyroscope.addListener((data) => {
      setGyroData(data);

      const rotation =
        Math.abs(data.x) +
        Math.abs(data.y) +
        Math.abs(data.z);

      // SHARP TURN
      if (rotation > 4 && !turnCooldown.current) {
        turnCooldown.current = true;

        setSharpTurns((v) => v + 1);
        deductScore(3);
addEvent("Sharp Turn");

        setTimeout(() => {
          turnCooldown.current = false;
        }, 2000);
      }

      // PHONE HANDLING
      if (rotation > 7 && !phoneCooldown.current) {
        phoneCooldown.current = true;

        setPhoneHandling((v) => v + 1);
        deductScore(10);
addEvent("Phone Handling");

        setTimeout(() => {
          phoneCooldown.current = false;
        }, 3000);
      }
    });
   
    motionSub.current = DeviceMotion.addListener((data) => {
      setMotionData(data);
    });

    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopSensors = () => {
    accelSub.current?.remove();
    gyroSub.current?.remove();
    motionSub.current?.remove();

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const endDrive = () => {
  stopSensors();
  setDriving(false);

  Alert.alert(
    "Drive Completed",
    `Duration: ${duration} sec

Events: ${totalEvents}

Score: ${score}

Rating: ${getRating()}`
  );
};

  const getRating = () => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Average";
    if (score >= 40) return "Risky";
    return "Dangerous";
  };

  const totalEvents =
    harshBrakes +
    harshAccel +
    sharpTurns +
    phoneHandling;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        SafeDrive Dashboard
      </Text>

      <View style={styles.card}>
        <Text
  style={[
    styles.score,
    { color: getScoreColor() }
  ]}
>
          Driving Score: {score}
        </Text>

        <Text style={styles.rating}>
          Rating: {getRating()}
        </Text>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={startDrive}
          disabled={driving}
        >
          <Text style={styles.btnText}>
            Start Drive
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.endBtn}
          onPress={endDrive}
          disabled={!driving}
        >
          <Text style={styles.btnText}>
            End Drive
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>
          Drive Summary
        </Text>

        <Text style={{color:"white"}}>
          Duration: {duration} sec</Text>
        <Text style={{color:"white"}}>Total Events: {totalEvents}</Text>

        <Text style={{color:"white"}}>
          Harsh Brakes: {harshBrakes}
        </Text>

       <Text style={{color:"white"}}>
          Harsh Acceleration: {harshAccel}
        </Text>

<Text style={{color:"white"}}>
            Sharp Turns: {sharpTurns}
        </Text>

        <Text style={{color:"white"}}>
          Phone Handling: {phoneHandling}
        </Text>
      </View>
      <View style={styles.card}>
  <Text style={styles.section}>
    Event Timeline
  </Text>

  {timeline.length === 0 ? (
    <Text style={{ color: "white" }}>
      No Events Yet
    </Text>
  ) : (
    timeline.map((item, index) => (
      <Text
        key={index}
        style={{
          color: "white",
          marginBottom: 4,
        }}
      >
        {item}
      </Text>
    ))
  )}
</View>

      <View style={styles.card}>
        <Text style={styles.section}>
          Accelerometer
        </Text>

        <Text style={{color:"white"}}>
          X: {accelData.x.toFixed(2)}
        </Text>

        <Text style={{color:"white"}}>
          Y: {accelData.y.toFixed(2)}
        </Text>

        <Text style={{color:"white"}}>
          Z: {accelData.z.toFixed(2)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>
          Gyroscope
        </Text>

        <Text style={{color:"white"}}>
          X: {gyroData.x.toFixed(2)}
        </Text>

        <Text style={{color:"white"}}>
          Y: {gyroData.y.toFixed(2)}
        </Text>

        <Text style={{color:"white"}}>
          Z: {gyroData.z.toFixed(2)}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>
          Device Motion
        </Text>

        <Text style={{color:"white"}}>
          Pitch:
          {" "}
          {motionData?.rotation?.beta?.toFixed?.(2) ??
            "0"}
        </Text>

        <Text style={{color:"white"}}>
          Roll:
          {" "}
          {motionData?.rotation?.gamma?.toFixed?.(2) ??
            "0"}
        </Text>

        <Text style={{color:"white"}}>
          Yaw:
          {" "}
          {motionData?.rotation?.alpha?.toFixed?.(2) ??
            "0"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E1A",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginTop: 40,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#161D2F",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },

  score: {
    fontSize: 24,
    color: "#00E676",
    fontWeight: "bold",
  },

  rating: {
    color: "white",
    marginTop: 10,
    fontSize: 18,
  },

  section: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  startBtn: {
    backgroundColor: "#00C853",
    padding: 15,
    borderRadius: 10,
    width: "48%",
  },

  endBtn: {
    backgroundColor: "#D50000",
    padding: 15,
    borderRadius: 10,
    width: "48%",
  },

  btnText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
});