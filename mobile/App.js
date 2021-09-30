import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View, Button } from "react-native";
import Driver from "./screens/Driver";
import Passenger from "./screens/Passenger";

export default function App() {
  const [state, setState] = React.useState({
    isDriver: false,
    isPassenger: false,
  });

  const { isDriver, isPassenger } = state;

  if (isDriver) {
    return <Driver />;
  }

  if (isPassenger) {
    return <Passenger />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Button
        title="Passenger"
        onPress={() =>
          setState((currState) => ({ ...currState, isPassenger: true }))
        }
      />
      <Button
        title="Driver"
        onPress={() =>
          setState((currState) => ({ ...currState, isDriver: true }))
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 50,
  },
});
