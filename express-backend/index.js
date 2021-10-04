const express = require("express");
const users = require("./users");

const PORT = 4000; //we set a different port here :) Our socket.io server is running on port 3000
const app = express();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get("/users", (req, res) => {
  res.send("You fetched a user!");
});

app.post("/users", async (req, res) => {
  const { firstName, lastName } = req.body;

  if (firstName && lastName) {
    res.send(users.add(req.body));
  } else {
    res.status(403).send({
      errors: "Please provide both a name and a handle",
    });
  }
});

app.listen(PORT, () => {
  console.log("Server is listening on PORT: " + PORT);
});
