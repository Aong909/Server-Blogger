const express = require("express");
const env = require("dotenv");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const userRouter = require("./router/userRouter");
const errors = require("./util/errors");

function setCorsHeaders(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
}

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use(
  cors({
    credentials: true,
    origin: "*",
  })
);

app.use(setCorsHeaders);

env.config({ path: "./config.env" });

const port = process.env.PORT_SERVER;

app.use("/api/v1/", userRouter);

app.get("/test", (req, res) => {
  res.send("test");
});

app.use("*", (req, res, next) => {
  res.status(404).json({
    status: "Failed",
    message: `Path ${req.baseUrl} not found in the server`,
  });
});
app.use(errors.APIError);

app.listen(port, () => {
  console.log("Server listening on port", port);
});
