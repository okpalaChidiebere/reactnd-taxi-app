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

  socket.on("chat_message", (msg) => {
    console.log(msg);
    io.emit("ping", msg); //we basically sent thesame message received in sockect conn back to the device :)
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(port, () => {
  console.log("listening on *:3000");
});
