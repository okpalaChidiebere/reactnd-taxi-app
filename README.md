# Taxi App

The primary goal of this project is to learn how to use web sockets in React Native Thesame concepts here can be carried over to the React for web as well. We used the `socket.io-client` package for the front-end because we used socket.io for our backend. For some reason you cannot mix regular JS WebSocket interface with Socket.io client. Read more about this [here](https://stackoverflow.com/questions/22232023/can-i-use-socket-io-client-to-connect-to-a-standard-websocket).
Full course [here](https://react-native-tutorial.thinkific.com/courses/taxi-app)

- The two main package we used from expo `expo-task-manager` and `expo-location`. The Main take away here was as long as the driver and passenger are online and their webSocket connections are still open, we can send data in real time back and forth between a driver and a user communicating after the driver has agreed to pick the passenger!
- Make Sure you look at the permissions and key we added in AndroidManifest.xml and Info.plist file
- We can use REST-Api to get data like How many trips the user have had in the past, Get license plate of the driver, a user data, ratings for a driver, etc.
- FYI: we did not finish implementing a full blown passenger journey from start to finish but you can finish that on your own based on the working knowledge from this lesson.

# Google Maps APIs

- After you have initialized your project in Google console, the API we used are Places API, Directions API, Maps SDK for Android and Maps SDK for iOS from the [library](https://console.cloud.google.com/apis/library). It does not matter if we enabled all these API on one KEY or we make various Keys, what is important is that the Key you used to query the API must be valid.
- We learned how to use [google maps from web](https://www.google.ca/maps/dir/) to [download gpx-files](https://mapstogpx.com/mobiledev.php) to test navigation in the emulators

# Higher Order Components

- https://medium.com/javascript-scene/do-react-hooks-replace-higher-order-components-hocs-7ae4a08b7b58
- https://reactjs.org/docs/higher-order-components.html

# React Native Maps

- [React Native Maps Mini Course](https://www.youtube.com/watch?v=qlELLikT3FU&t=271s)
- [https://stackoverflow.com/questions/56766390/react-native-maps-how-to-use-animatecamera-and-setcamera
  ](https://stackoverflow.com/questions/56766390/react-native-maps-how-to-use-animatecamera-and-setcamera)

# More to explore

- [How to use auth token in sockets?](https://stackoverflow.com/questions/36788831/authenticating-socket-io-connections) Basically, you make a property with the token, and you check for that always in the socket.io backend.
