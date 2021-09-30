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

//when a user connects to our socket server
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("taxi_request", (msg) => {
    console.log(msg);
  });

  socket.on("looking_for_passenger", (msg) => {
    console.log("Someone is looking for a Passenger");
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(port, () => {
  console.log("listening on *:3000");
});
