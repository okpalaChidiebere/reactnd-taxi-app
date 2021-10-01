const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const port = 3000;

const io = new Server(server, {
  cors: {
    methods: ["GET", "POST"],
  },
});

let taxiRequest = null; //used to cache a driver request looking for passengers

//when a user connects to our socket server
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("taxi_request", (msg) => {
    //console.log(msg);
    console.log("someone is looking for a taxi");
    if (taxiRequest != null) {
      /**
       * We send back to the driver a passenger pickup request
       * NOTE: this is not a production ready code because in real life, you will have to manage different web socket connections
       * for these drivers so that you will know to assign passengers to each individual driver that requested for for a passenger
       * in a queue format
       */
      taxiRequest.emit("taxi_request", msg); //FYI; the msg will contain the routeResponse in json format the a passenger sent
    }
  });

  socket.on("looking_for_passenger", (msg) => {
    console.log("Someone is looking for a Passenger");
    taxiRequest = socket; //we save the current driver connection
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(port, () => {
  console.log("listening on *:3000");
});
