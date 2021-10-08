import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import * as Location from "expo-location";
import Constants from "expo-constants";
import debounce from "lodash.debounce"; //https://blog.logrocket.com/how-and-when-to-debounce-or-throttle-in-react/
import io from "socket.io-client";
import BottomButton from "../components/BottomButton";
import apiKey from "../google_api_key";

const SocketEndpoint = "http://127.0.0.1:3000";
const edgePadding = {
  top: Constants.statusBarHeight + 20, //we dont want the display directions or markers to be under the search bar
  bottom: 20,
  left: 50,
  right: 50,
};
export default React.forwardRef(
  (
    {
      longitude,
      latitude,
      longitudeDelta,
      latitudeDelta,
      setLocation,
      getRouteDirections,
      routeResponse,
      pointCoords,
    },
    ref
  ) => {
    const [state, setState] = React.useState({
      errorMsg: null, //use to know if we successfully get the user current location
      destination: "", //the store the input from the textBox
      predictions: [],
      lookingForDriver: false,
      driverIsOnTheWay: false, //we use this to know when to show the driver icon marker on our map after a driver accepts this request
      driverLocation: {}, //an object containing the latitude and longitude of the user
    });

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

        /**
         * We want the Map to follow the user as they are in motion that why we use Location.watchPositionAsync()
         * over Location.getCurrentPositionAsync()
         *
         * Anytime the lat and lng updates the initialRegion prop of the maps updates. So even though the user
         * touch gesture(like zoomIn or zoomOut) positions on the map will still be maintained
         *  */
        setLocation();
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
    &input=${destination}&location=${latitude},${longitude}&radius=2000`;
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
      debounce((q) => queryPlace(q), 800),
      [latitude, longitude] //we only want to re-render this callback when the user current location changes like after useEffect, etc
    );

    const requestDriver = () => {
      setState((currState) => ({
        ...currState,
        lookingForDriver: true,
      }));

      //request a websocket connection
      const socket = io(SocketEndpoint, {
        transports: ["websocket"],
      });

      //check for when we have connected
      socket.on("connect", () => {
        //send a driver request
        socket.emit("taxi_request", routeResponse);
      });

      //we receive the location of whatever driver accepts our taxi request
      socket.on("driver_location", (driverLocation) => {
        //hide the activity indicator on the "request driver" button
        setState((currState) => ({
          ...currState,
          lookingForDriver: false,
          driverLocation,
          driverIsOnTheWay: true,
        }));

        /** Start fitting the new driver coming to pick up the passenger on screen */
        let newPointCoordsWithDriver = [...pointCoords, driverLocation]; // As we include the driver location, the map will re-render to display all markers
        ref.current.fitToCoordinates(newPointCoordsWithDriver, {
          edgePadding: { ...edgePadding, top: 140, bottom: 140 },
        });
        /** End fitting driver location in screen. At this point the passenger can see the driver location */
      });
    };

    const {
      destination,
      predictions,
      lookingForDriver,
      driverIsOnTheWay,
      driverLocation,
    } = state;

    if (longitude === null || latitude === null) {
      //user hans't given us any permission yet
      return (
        //we just show a loading indicator
        <View style={styles.container}>
          <ActivityIndicator style={{ marginTop: 30 }} color="black" />
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <MapView
          ref={ref}
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
          {driverIsOnTheWay && (
            <Marker coordinate={driverLocation}>
              <Image
                source={require("../images/carIcon.png")}
                style={{ width: 40, height: 40 }}
              />
            </Marker>
          )}
        </MapView>
        <View style={styles.placePickerWrapper}>
          <TextInput
            placeholder="Enter destination..."
            style={styles.destinationInput}
            value={destination}
            onChangeText={(destination) => onChangeDestination(destination)}
          />
          {predictions.map((prediction) => (
            <TouchableOpacity
              key={prediction.place_id}
              onPress={async () => {
                /**
                 * SIDE NOTE: we did not use prediction.description because the description text is too long
                 * and can be too tedious when a user wants to clear the search input.
                 * so we use a shorter text formate which is prediction.structured_formatting.main_text
                 *
                 * Feel free to test the placePicker endpoint in postman to see all these values
                 * https://developers.google.com/maps/documentation/places/web-service/search-text
                 */
                const destinationName = await getRouteDirections(
                  prediction.place_id,
                  prediction.structured_formatting.main_text
                );
                setState((currState) => ({
                  ...currState,
                  destination: destinationName,
                  predictions: [], //we can now resets the predictions to empty because the user has pressed their suggestion
                }));
              }}
            >
              <View style={styles.suggestions}>
                <Text>{prediction.structured_formatting.main_text}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {/** Dont forget to add a "Powered by Google" logo here. This is a must when using google APIs */}
        </View>
        {
          /**We only show the this button after the user has selected a destination
           */
          pointCoords.length > 0 && (
            <BottomButton
              onPressFunction={requestDriver}
              buttonText={"REQUEST 🚗"}
            >
              {lookingForDriver && (
                <ActivityIndicator
                  animating={lookingForDriver}
                  size="large"
                  color={"#fff"}
                />
              )}
            </BottomButton>
          )
        }
      </View>
    );
  }
);

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
