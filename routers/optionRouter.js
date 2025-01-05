const express = require("express");

const service = require("../services/userService");
const middleware = require("../middleware/middleware");

const router = express.Router();

router

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
  .delete("/favorite", middleware.verifyAuthToken, service.deleteLike);

module.exports = router;
