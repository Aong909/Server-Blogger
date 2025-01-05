const express = require("express");

const service = require("../services/userService");
const middleware = require("../middleware/middleware");

const router = express.Router();

router
  //category
  .get("/category", middleware.verifyAuthToken, service.getAllCategory)
  .get("/category/:limit", middleware.verifyAuthToken, service.getTopCategory)

  //content
  .post("/content", middleware.verifyAuthToken, service.saveContent)
  .put("/content", middleware.verifyAuthToken, service.updateContent)
  .get("/contents", middleware.verifyAuthToken, service.getAllContent)
  .get("/contents/:id", middleware.verifyAuthToken, service.getContentByUserID)
  .get("/content/:id", middleware.verifyAuthToken, service.getContentByBlogID)
  .delete(
    "/content/:id",
    middleware.verifyAuthToken,
    service.deleteContentByBlogID
  )
  //comment
  .get("/comment/:id", middleware.verifyAuthToken, service.getCommentByID)
  .post("/comment", middleware.verifyAuthToken, service.postComment);

module.exports = router;
