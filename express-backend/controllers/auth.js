const users = require("../users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");

exports.createUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const data = users.get();
  if (data.users.find((c) => c.email === email)) {
    return res
      .status(409)
      .send(`An account with the mail ${email} already exists`);
  }

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
      const token = jwt.sign({ email: user.email }, config.jwtSecret);
      return res.json({ token });
    }
    return res.send(`Password does not match email ${email}`);
  }
  return res.send(`This email ${email} does not exist`);
};
