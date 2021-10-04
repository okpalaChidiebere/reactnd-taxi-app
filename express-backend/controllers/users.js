const users = require("../users");

exports.getUsers = (req, res) => {
  const data = users.get();

  const newUsers = data.users.map(({ firstName, lastName, email }) => ({
    firstName,
    lastName,
    email,
  }));
  res.send({ users: newUsers });
};
