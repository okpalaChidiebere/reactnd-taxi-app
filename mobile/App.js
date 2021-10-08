import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View, Button } from "react-native";
import Driver from "./screens/Driver";
import Passenger from "./screens/Passenger";
import GenericContainer from "./components/GenericContainer";
import Login from "./screens/Login";

const DriverWithGenericContainer = GenericContainer(Driver);
const PassengerWithGenericContainer = GenericContainer(Passenger);

export default function App() {
  const [state, setState] = React.useState({
    isDriver: false,
    isPassenger: false,
  });

  const { isDriver, isPassenger } = state;

  if (isDriver) {
    return <DriverWithGenericContainer />;
  }

  if (isPassenger) {
    return <PassengerWithGenericContainer />;
  }

  return <Login />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 50,
  },
});
/**
 * <View style={styles.container}>
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
 */
