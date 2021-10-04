const users = require("../users");
const bcrypt = require("bcrypt");

exports.getUser = (req, res) => {
  res.send("You fetched a user!");
};

exports.createUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (firstName && lastName && email && password) {
    const hashedPassword = await bcrypt.hash(password, 12);

    res.send(
      users.add({
        ...req.body,
        password: hashedPassword,
      })
    );
  } else {
    res.status(403).send({
      errors:
        "Please provide make sure you provided the firstName, lastName, email and password fields",
    });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  const data = users.get();
  const user = data.users.find((c) => c.email === email);

  if (user) {
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (isPasswordCorrect) {
      return res.send("You are logged in!");
    }
    return res.send(`Password does not match email ${email}`);
  }
  return res.send(`This email ${email} does not exist`);
};
