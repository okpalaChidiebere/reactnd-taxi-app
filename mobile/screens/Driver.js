import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import * as Location from "expo-location";
import Constants from "expo-constants";
import PolyLine from "@mapbox/polyline";
import io from "socket.io-client";
import apiKey from "../google_api_key";
import BottomButton from "../components/BottomButton";

const latitudeDelta = 0.015;
const longitudeDelta = 0.0121;
const SocketEndpoint = "http://127.0.0.1:3000";
export default function Driver() {
  const [state, setState] = React.useState({
    latitude: 37.78825,
    longitude: -122.4324,
    errorMsg: null, //use to know if we successfully get the user current location
    destination: "", //the store the input from the textBox
    pointCoords: [],
    lookingForPassengers: false, //used to keep track of where to show activityIndicator as the driver is looking for passengers or not
  });
  const mapRef = React.useRef();
  const passengerSearchText = React.useRef("FIND PASSENGERS 👥");

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

  /** We used this to show the routes to the passenger */
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

  const handleFindPassenger = () => {
    setState((currState) => ({
      ...currState,
      lookingForPassengers: true,
    }));

    //request a websocket connection
    const socket = io(SocketEndpoint, {
      transports: ["websocket"],
    });

    //check for when we have connected
    socket.on("connect", () => {
      //send a looking for passenger event
      socket.emit("looking_for_passenger"); //FYI: we are not sending any additional message
    });
  };

  const {
    latitude,
    longitude,
    destination,
    pointCoords,
    lookingForPassengers,
  } = state;
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
      <BottomButton
        onPressFunction={handleFindPassenger}
        buttonText={passengerSearchText.current}
      >
        {lookingForPassengers && (
          <ActivityIndicator animating={lookingForPassengers} size="large" />
        )}
      </BottomButton>
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
