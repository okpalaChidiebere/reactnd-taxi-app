import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View, TextInput } from "react-native";
import MapView from "react-native-maps";
import * as Location from "expo-location";
import Constants from "expo-constants";
import _ from "lodash";

const apiKey = "";
export default function App() {
  const [state, setState] = React.useState({
    latitude: 37.78825,
    longitude: -122.4324,
    errorMsg: null, //use to know if we successfully get the user current location
    destination: "", //the store the input from the textBox
    predictions: [],
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

  /** This method searches and set the location that the user wants to go to */
  const onChangeDestination = (destination) => {
    setState((currState) => ({
      ...currState,
      destination,
    }));
    delayedQuery(destination);
  };

  const queryPlace = async (destination) => {
    const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${apiKey}
    &input=${destination}&location=${state.latitude},${state.longitude}&radius=2000`;
    try {
      const result = await fetch(apiUrl);
      const json = await result.json();

      setState((currState) => ({
        ...currState,
        predictions: json.predictions,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const delayedQuery = React.useCallback(
    /**
     * debounce enables us to wait a set period of time before we call the function if the function is not called
     * with that  set period of time
     *
     * Eg we wait for 800ms and if there is not anymore function call since the last call then we run the function
     * else we wait afresh and wait another 800ms. This helps us not call the place API each time the user is typing
     *  but instead run the function after 800ms where the user has stop typing which saves us more money :)
     */
    _.debounce((q) => queryPlace(q), 800),
    []
  );

  const { latitude, longitude, destination, predictions } = state;
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
        showsUserLocation={true}
      />
      <View style={styles.placePickerWrapper}>
        <TextInput
          placeholder="Enter destination..."
          style={styles.destinationInput}
          value={destination}
          onChangeText={(destination) => onChangeDestination(destination)}
        />
        {predictions.map((prediction) => (
          <Text style={styles.suggestions} key={prediction.place_id}>
            {prediction.description}
          </Text>
        ))}
        {/** Dont forget to add a "Powered by Google" logo here. This is a must when using google APIs */}
      </View>
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
  placePickerWrapper: {
    top: Constants.statusBarHeight,
    position: "absolute",
    width: "97%",
  },
  destinationInput: {
    height: 40,
    borderWidth: 0.5,
    marginTop: 50,
    marginLeft: 5,
    marginRight: 5,
    padding: 5,
    backgroundColor: "white",
  },
  suggestions: {
    backgroundColor: "white",
    padding: 5,
    fontSize: 18,
    borderWidth: 0.5,
    marginLeft: 5,
    marginRight: 5,
  },
});
