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
  /** Ideally, you may want theses values to be in your redux store */
  const [state, setState] = React.useState({
    isDriver: false,
    isPassenger: false,
    token: "",
  });

  const handleSetState = (name, value) => {
    setState((currState) => ({ ...currState, [name]: value }));
  };

  const { isDriver, isPassenger, token } = state;

  if (token === "") {
    return <Login handleSetToken={handleSetState} />;
  }

  if (isDriver) {
    return <DriverWithGenericContainer />;
  }

  if (isPassenger) {
    return <PassengerWithGenericContainer />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Button
        title="Passenger"
        onPress={() => handleSetState("isPassenger", true)}
      />
      <Button title="Driver" onPress={() => handleSetState("isDriver", true)} />
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
