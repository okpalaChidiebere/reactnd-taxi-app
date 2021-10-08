const users = require("../users");

exports.getUsers = (req, res) => {
  const data = users.get();

  const newUsers = data.users.map(({ id, email }) => ({
    id,
    email,
  }));
  return res.send({ users: newUsers });
};
