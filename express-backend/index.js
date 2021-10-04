const express = require("express");
const userRouter = require("./routes/users");

const PORT = 4000; //we set a different port here :) Our socket.io server is running on port 3000
const app = express();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use("/users", userRouter);

app.listen(PORT, () => {
  console.log("Server is listening on PORT: " + PORT);
});
