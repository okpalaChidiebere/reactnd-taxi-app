import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
import { Foundation } from "@expo/vector-icons";
import * as TaskManager from "expo-task-manager";
import MapView, { Polyline, Marker } from "react-native-maps";
import * as Location from "expo-location";
import Constants from "expo-constants";
import io from "socket.io-client";
import BottomButton from "../components/BottomButton";

const SocketEndpoint = "http://127.0.0.1:3000";
const LOCATION_TASK_NAME = "background-location-task";

//request a websocket connection
const socket = io(SocketEndpoint, {
  transports: ["websocket"],
});

//TaskManager.unregisterAllTasksAsync();

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data: { locations }, error }) => {
  if (error) {
    console.log(error);
    return;
  }

  for (let location of locations) {
    //Send driver's location to the passenger they decided to go pick up
    socket.emit("driver_location", {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  }
});

export default React.forwardRef(
  (
    {
      longitude,
      latitude,
      longitudeDelta,
      latitudeDelta,
      setLocation,
      pointCoords,
      getRouteDirections,
    },
    ref
  ) => {
    const [state, setState] = React.useState({
      lookingForPassengers: false, //used to keep track of where to show activityIndicator as the driver is looking for passengers or not
      passengerSearchText: "FIND PASSENGERS 👥",
      passengerFound: false,
      bgLocationPermissionStatus: null,
      fgLocationPermissionStatus: null,
    });

    const currLatitudeDelta = React.useRef(latitudeDelta);
    const currLongitudeDelta = React.useRef(longitudeDelta);

    React.useEffect(() => {
      (async () => {
        /** Be sure to requestForPermissions when the App.js UI loads. You want the user to be able to use
         * some part of your app that need permissions to display data in the UI */
        const { status: bgLocationPermissionStatus } =
          await Location.getForegroundPermissionsAsync();

        const { status: fgLocationPermissionStatus } =
          await Location.getBackgroundPermissionsAsync();

        setState((currState) => ({
          ...currState,
          bgLocationPermissionStatus,
          fgLocationPermissionStatus,
        }));

        if (
          bgLocationPermissionStatus === Location.PermissionStatus.GRANTED &&
          fgLocationPermissionStatus === Location.PermissionStatus.GRANTED
        ) {
          setLocation();

          /*let tasks = await TaskManager.getRegisteredTasksAsync();
        if (tasks.find((f) => f.taskName === LOCATION_TASK_NAME) !== null) {
          //console.log("Registering task")

          TaskManager.unregisterTaskAsync(LOCATION_TASK_NAME);
        }*/
          //await TaskManager.unregisterAllTasksAsync();
        }
      })();

      return async () => {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        // await TaskManager.unregisterTaskAsync(LOCATION_TASK_NAME);
      };
    }, []);

    const askPermission = async () => {
      const { status: bgLocationPermissionStatus } =
        await Location.requestBackgroundPermissionsAsync();
      bgLocationPermissionStatus = bgResp.status;

      const { status: fgLocationPermissionStatus } =
        await Location.requestForegroundPermissionsAsync();
      fgLocationPermissionStatus = fgResp.status;

      console.log(bgLocationPermissionStatus, fgLocationPermissionStatus);

      setState((currState) => ({
        ...currState,
        bgLocationPermissionStatus,
        fgLocationPermissionStatus,
      }));

      if (
        bgLocationPermissionStatus === Location.PermissionStatus.GRANTED &&
        fgLocationPermissionStatus === Location.PermissionStatus.GRANTED
      ) {
        setLocation();
      }
    };

    const handleFindPassenger = () => {
      setState((currState) => ({
        ...currState,
        lookingForPassengers: true,
        passengerSearchText: "FINDING PASSENGERS...",
      }));

      //send a looking for passenger event
      socket.emit("looking_for_passenger"); //FYI: we are not sending any additional message

      /** we receive taxi request send by passengers here. We receive a passenger location which is the 'routeResponse'
       *
       * - routeResponse.geocoded_waypoints[0] is where the passenger is located
       * - routeResponse.geocoded_waypoints[1] is where the passenger wants to go to
       *
       */
      socket.on("taxi_request", async (msg) => {
        //console.log(msg);
        await getRouteDirections(msg.geocoded_waypoints[0].place_id);
        setState((currState) => ({
          ...currState,
          lookingForPassengers: false,
          passengerSearchText: "FOUND PASSENGER! ACCEPT RIDE?",
          passengerFound: true,
        }));
      });
    };

    const handleAcceptPassengerRequest = async () => {
      const LocationFetchStatus = await Location.hasStartedLocationUpdatesAsync(
        LOCATION_TASK_NAME
      );

      if (!LocationFetchStatus) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 10000,
          distanceInterval: 50,
          deferredUpdatesInterval: 5000,
          deferredUpdatesDistance: 50,
          foregroundService: {
            notificationTitle: "Taxi App",
            notificationBody: "Location is used when App is in background",
          },
          activityType: Location.ActivityType.AutomotiveNavigation,
          showsBackgroundLocationIndicator: true,
        });
      }

      /**
       * Remember we has initially store the coordinates (from start to end destination) of the passenger when
       * the driver was deciding whether to go pick up a passenger or not if they are not too far away.
       *
       * We are just accessing the end destination here
       */
      const passengerLocation = pointCoords[pointCoords.length - 1];

      if (Platform.OS === "ios") {
        //learn more: https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html
        Linking.openURL(
          `maps://?daddr=${passengerLocation.latitude},${passengerLocation.longitude}`
        );
      } else {
        //learn more: https://developers.google.com/maps/documentation/urls/android-intents#launch_turn-by-turn_navigation
        Linking.openURL(
          `google.navigation:q=${passengerLocation.latitude},${passengerLocation.longitude}`
        );
      }
    };

    const bottomButtonFunction = React.useCallback(() => {
      if (state.passengerFound) {
        handleAcceptPassengerRequest();
      } else if (!state.lookingForPassengers && !state.passengerFound) {
        handleFindPassenger();
      }
    }, [
      state.lookingForPassengers,
      state.passengerFound,
      latitude, // we need this method to re-render to have the updated driver location
      latitude,
      pointCoords, //when we are deciding whether we want to pick up the passenger or not, we still need this updated value
    ]);

    const {
      lookingForPassengers,
      passengerSearchText,
      bgLocationPermissionStatus,
      fgLocationPermissionStatus,
    } = state;

    if (
      bgLocationPermissionStatus === null ||
      fgLocationPermissionStatus === null ||
      latitude === null
    ) {
      //user hans't given us any permission yet
      return (
        //we just show a loading indicator
        <View style={styles.container}>
          <ActivityIndicator style={{ marginTop: 30 }} color={"black"} />
        </View>
      );
    }

    if (
      bgLocationPermissionStatus === Location.PermissionStatus.DENIED ||
      fgLocationPermissionStatus === Location.PermissionStatus.DENIED
    ) {
      //Here we ask for permission and the user did not give our app permission
      return (
        <View style={styles.container}>
          <Foundation name="alert" size={50} />
          <Text>
            You denied your location. You can fix this by visiting your settings
            and enabling location services for this app.
          </Text>
        </View>
      );
    }

    if (
      bgLocationPermissionStatus === Location.PermissionStatus.UNDETERMINED ||
      fgLocationPermissionStatus === Location.PermissionStatus.UNDETERMINED
    ) {
      return (
        <View style={styles.container}>
          <Foundation name="alert" size={50} />
          <Text>
            You need to enable location services for the Driver UI of this app.
          </Text>
          <TouchableOpacity style={styles.button} onPress={askPermission}>
            <Text style={styles.buttonText}>Enable</Text>
          </TouchableOpacity>
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
          onRegionChange={(region) => {
            if (
              region.latitudeDelta !== currLatitudeDelta.current ||
              region.longitudeDelta !== currLongitudeDelta.current
            ) {
              //user zoomed
              currLatitudeDelta.current = region.latitudeDelta;
              currLongitudeDelta.current = region.longitudeDelta;
            }
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
            <Marker coordinate={pointCoords[pointCoords.length - 1]}>
              <Image
                style={{ width: 40, height: 40 }}
                source={require("../images/person-marker.png")}
              />
            </Marker>
          )}
        </MapView>
        <BottomButton
          onPressFunction={bottomButtonFunction}
          buttonText={passengerSearchText}
        >
          {lookingForPassengers && (
            <ActivityIndicator
              animating={lookingForPassengers}
              size="large"
              color={"#fff"}
            />
          )}
        </BottomButton>
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
  button: {
    padding: 10,
    backgroundColor: "black",
    alignSelf: "center",
    borderRadius: 5,
    margin: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 20,
  },
});
