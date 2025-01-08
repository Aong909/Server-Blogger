const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.hashPassword = async (userPassword) => {
  return await bcrypt.hash(userPassword, 12);
};

exports.comperePassword = async (userPassword, hash) => {
  return await bcrypt.compare(userPassword, hash);
};

exports.genToken = async (obj) => {
  return jwt.sign(obj, process.env.SECRET, { expiresIn: "24h" });
};

exports.verifyToken = async (token) => {
  return jwt.verify(token, process.env.SECRET);
};
