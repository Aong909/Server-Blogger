const errors = require("../util/errors");
const enCode = require("../util/enCode");

exports.verifyAuthToken = async (req, res, next) => {
  try {
    const authToken = req.cookies.token;

    if (!authToken) {
      errors.MappingError(next, 401, "Authorization not found");
    }

    const verify = await enCode.verifyToken(authToken);

    req.user = {};
    req.user.userID = verify.id;
    req.user.userRole = verify.role;

    next();
  } catch (error) {
    console.log(error.message);
    if (error.message === "invalid signature") {
      return errors.MappingError(next, 401, "Authorization is not signature");
    }

    return errors.MappingError(next, 500, "Internal server error");
  }
};
