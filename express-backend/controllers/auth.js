const users = require("../users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");

exports.createUser = async (req, res) => {
  const { email, password } = req.body;

  const data = users.get();
  if (data.users.find((c) => c.email === email)) {
    return res
      .status(409)
      .send(`An account with the mail ${email} already exists`);
  }

  if (email && password) {
    const hashedPassword = await bcrypt.hash(password, 12);

    return res.send(
      users.add({
        ...req.body,
        password: hashedPassword,
      })
    );
  } else {
    return res
      .status(403)
      .send(
        "Please provide make sure you provided the email and password fields"
      );
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
    return res.status(401).send(`Password does not match email ${email}`);
  }
  return res.status(401).send(`This email ${email} does not exist`);
};
