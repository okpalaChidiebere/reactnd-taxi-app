import React from "react";
import { Keyboard } from "react-native";
import * as Location from "expo-location";
import PolyLine from "@mapbox/polyline";
import apiKey from "../google_api_key";

const GenericContainer = (WrappedComponent) => (props) => {
  const watchId = React.useRef();
  const mapRef = React.useRef();
  const [state, setState] = React.useState({
    latitude: null,
    longitude: null,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
    pointCoords: [],
    routeResponse: {},
  });
  React.useEffect(() => {
    return async () => {
      if (watchId.current) {
        watchId.current.remove(); //unsubscribe the watch event
      }
    };
  }, []);

  const setLocation = async () => {
    /**
     * We want the Map to follow the user as they are in motion that why we use Location.watchPositionAsync()
     * over Location.getCurrentPositionAsync()
     *
     * Anytime the lat and lng updates the initialRegion prop of the maps updates. So even though the user
     * touch gesture(like zoomIn or zoomOut) positions on the map will still be maintained
     *  */
    watchId.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 100, //we want to location to update as quickly as possible
        distanceInterval: 1,
      },
      ({ coords }) => {
        setState((currState) => ({
          ...currState,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));
        mapRef.current.animateToRegion(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: state.latitudeDelta, //must specify to work properly on Android
            longitudeDelta: state.longitudeDelta, //must specify to work properly on Android
          },
          1000
        );
      }
    );
  };

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
        `https://maps.googleapis.com/maps/api/directions/json?origin=${latitude},${longitude}&destination=place_id:${destinationPlaceId}&key=${apiKey}`
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
        pointCoords,
        /**
         * NOTE: the routeResponse looks like:
         * 
         * {
              geocoded_waypoints: [ //contains the two objects that have placeIds for the startDestination and EndDestination of the passenger ],
              routes: [...],
              status: OK,
            }
         * The geocoded_waypoints[0] will be the used in the driver screen to calculate the route to the passenger 
            they want to pick up. They can see how far away the passenger is and decide of they want to take the request or not

          The geocoded_waypoints[1] will be used to know where the passenger want to be dropped
         */
        routeResponse: json,
      }));
      Keyboard.dismiss(); //dismiss the keyBoard

      /*
      This will set the correct zoom with a little animation show the direction in full
      
      You can disable the animation and set edgePadding. The second params is optional
      */
      mapRef.current.fitToCoordinates(pointCoords, {
        edgePadding: { top: 20, bottom: 20, left: 20, right: 20 }, //{ top: 20, bottom: 20, left: 50, right: 50 },
      });

      return destinationName;
    } catch (error) {
      console.log(error);
    }
  };

  const {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
    pointCoords,
    routeResponse,
  } = state;
  return (
    <WrappedComponent
      ref={mapRef}
      latitude={latitude}
      longitude={longitude}
      latitudeDelta={latitudeDelta}
      longitudeDelta={longitudeDelta}
      getRouteDirections={getRouteDirections}
      setLocation={setLocation}
      pointCoords={pointCoords}
      routeResponse={routeResponse}
      {...props}
    />
  );
};
export default GenericContainer;
