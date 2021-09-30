import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

export default function App() {
  const [state, setState] = React.useState({
    latitude: 37.78825,
    longitude: -122.4324,
    errorMsg: null, //use to know if we successfully get the user current location
  });
  const mapRef = React.useRef();

  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setState((currState) => ({
          ...currState,
          errorMsg: "Permission to access location was denied",
        }));
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setState((currState) => ({
        ...currState,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        1000
      );
    })();
  }, []);

  const { latitude, longitude } = state;
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        }}
      >
        <Marker coordinate={{ latitude, longitude }} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
