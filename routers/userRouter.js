const express = require("express");

const service = require("../services/userService");
const middleware = require("../middleware/middleware");

const router = express.Router();

router
  .get("/users", middleware.verifyAuthToken, service.GetAllUser)
  .get("/user/:id", middleware.verifyAuthToken, service.getUserByID)
  .put("/user/:id", middleware.verifyAuthToken, service.updateUserByID)
  //login and register
  .post("/register", service.SignUp)
  .post("/login", service.LogIn);

module.exports = router;
