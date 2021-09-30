import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import * as Location from "expo-location";
import Constants from "expo-constants";
import _ from "lodash";
import PolyLine from "@mapbox/polyline";
import apiKey from "../google_api_key";

const latitudeDelta = 0.015;
const longitudeDelta = 0.0121;
export default function Driver() {
  const [state, setState] = React.useState({
    latitude: 37.78825,
    longitude: -122.4324,
    errorMsg: null, //use to know if we successfully get the user current location
    destination: "", //the store the input from the textBox
    predictions: [],
    pointCoords: [],
  });
  const mapRef = React.useRef();
  const searchPlaceInputRef = React.useRef();

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
          latitudeDelta, //must specify to work properly on Android
          longitudeDelta, //must specify to work properly on Android
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
    [state.latitude, state.longitude] //we only want to re-render this callback when the user current location changes like after useEffect, etc
  );

  const getRouteDirections = async (destinationPlaceId, destinationName) => {
    try {
      /**
       * FYI: we are ble to use thesame key for PlacePicker and directions API from Google because we
       * restricted the key to these two APIs
       *
       * Learn more about the Directions API and params that you can pass in the request here
       * https://developers.google.com/maps/documentation/directions/get-directions#DirectionsRequests
       * Be sure to test the api in postMan if you want :)
       */
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${state.latitude},${state.longitude}&destination=place_id:${destinationPlaceId}&key=${apiKey}`
      );
      const json = await response.json();

      //convert the string of points from the an array of points or directions
      const points = PolyLine.decode(json.routes[0].overview_polyline.points);

      /**
       * Map over each of the points and convert each point into an object containing the latitude and longitude
       * which the Polyline in react-native-maps understand.
       * */
      const pointCoords = points.map((point) => {
        return { latitude: point[0], longitude: point[1] };
      });

      setState((currState) => ({
        ...currState,
        destination: destinationName,
        predictions: [], //we can now resets the predictions to empty because the user has pressed their suggestion
        pointCoords,
      }));
      searchPlaceInputRef.current.blur(); //dismiss the keyBoard

      /*
      This will set the correct zoom with a little animation show the direction in full
      
      You can disable the animation and set edgePadding. The second params is optional
      */
      mapRef.current.fitToCoordinates(pointCoords, {
        edgePadding: { top: 20, bottom: 20, left: 50, right: 50 },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const { latitude, longitude, destination, predictions, pointCoords } = state;
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta,
          longitudeDelta,
        }}
        showsUserLocation={true}
      >
        <Polyline
          coordinates={pointCoords}
          strokeWidth={4}
          strokeColor="red"
          /**
           * for some reason, i had this logic to allow Polyline to work in expo client android
           *  https://stackoverflow.com/questions/68368208/mapview-polyline-in-react-native-with-expo-throws-an-error-im-testing-with-an
           *  */
          lineDashPattern={pointCoords.length > 0 ? null : [1]}
        />
        {pointCoords.length > 0 && ( //we only set the marker when the user has selected a place
          /** we set the marker at the very last point */
          <Marker coordinate={pointCoords[pointCoords.length - 1]} />
        )}
      </MapView>
      <View style={styles.placePickerWrapper}>
        <TextInput
          ref={searchPlaceInputRef}
          placeholder="Enter destination..."
          style={styles.destinationInput}
          value={destination}
          onChangeText={(destination) => onChangeDestination(destination)}
        />
        {predictions.map((prediction) => (
          <TouchableOpacity
            key={prediction.place_id}
            onPress={() =>
              /**
               * SIDE NOTE: we did not use prediction.description because the description text is too long
               * and can be too tedious when a user wants to clear the search input.
               * so we use a shorter text formate which is prediction.structured_formatting.main_text
               *
               * Feel free to test the placePicker endpoint in postman to see all these values
               * https://developers.google.com/maps/documentation/places/web-service/search-text
               */
              getRouteDirections(
                prediction.place_id,
                prediction.structured_formatting.main_text
              )
            }
          >
            <View style={styles.suggestions}>
              <Text>{prediction.structured_formatting.main_text}</Text>
            </View>
          </TouchableOpacity>
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
