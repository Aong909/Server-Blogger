const express = require("express");

const service = require("../service/userService");
const middleware = require("../service/middleware");

const router = express.Router();

router
  .get("/users", middleware.verifyAuthToken, service.GetAllUser)
  .get("/user/:id", middleware.verifyAuthToken, service.getUserByID)
  .put("/user/:id", middleware.verifyAuthToken, service.updateUserByID)
  //login and register
  .post("/register", service.SignUp)
  .post("/login", service.LogIn)
  //category
  .get("/category", middleware.verifyAuthToken, service.getAllCategory)
  .get("/category/:limit", middleware.verifyAuthToken, service.getTopCategory)

  //follow
  .post("/follow", middleware.verifyAuthToken, service.follow)
  .get("/follow", middleware.verifyAuthToken, service.getTopFollow)
  .get("/follow/:id", middleware.verifyAuthToken, service.getFollowByID)
  .delete("/follow", middleware.verifyAuthToken, service.unFollow)

  //bookmark
  .post("/bookmark", middleware.verifyAuthToken, service.postBookmark)
  .get("/bookmark/:id", middleware.verifyAuthToken, service.getBookmarkByID)
  .delete("/bookmark", middleware.verifyAuthToken, service.deleteBookmark)
  //favorite
  .post("/favorite", middleware.verifyAuthToken, service.postLike)
  .get("/favorite/:id", middleware.verifyAuthToken, service.getLikeByID)
  .delete("/favorite", middleware.verifyAuthToken, service.deleteLike)
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
