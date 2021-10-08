const express = require("express");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/users");
const cors = require("cors");
const authMiddleware = require("./middleware/auth");
const errorMiddleware = require("./middleware/error");

const PORT = 4000; //we set a different port here :) Our socket.io server is running on port 3000
const app = express();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cors());

app.use("/auth", authRouter);
app.use("*", authMiddleware); //`*` means we will apply this middleware to every other routes besides the /auth. The position where we place this middleware is important
app.use("/users", userRouter);
app.use(errorMiddleware); //this prevents our server from crashing on errors and also prints out nicely external api errors that we did not catch :)

app.listen(PORT, () => {
  console.log("Server is listening on PORT: " + PORT);
});
