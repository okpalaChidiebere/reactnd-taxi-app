const clone = require("clone");

const db = {};

const defaultData = {
  users: [],
};

const get = () => {
  let data;

  data = clone(defaultData);
  return data;
};

const add = (user) => {
  if (!user.id) {
    user.id = Math.random().toString(36).substr(-8);
  }

  defaultData.users = [...get().users, user];

  return user;
};

module.exports = {
  add,
  get,
};
