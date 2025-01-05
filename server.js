const express = require("express");
const env = require("dotenv");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const userRouter = require("./routers/userRouter");
const contentRouter = require("./routers/contentRouter");
const optionRouter = require("./routers/optionRouter");
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
    origin: [
      "http://localhost:5173",
      "https://astounding-tarsier-99ba45.netlify.app/",
      "https://ssblogger.netlify.app",
    ],
  })
);

// app.use(setCorsHeaders);

env.config({ path: "./config.env" });

const port = process.env.PORT_SERVER;

app.use("/api/v1/", userRouter);
app.use("/api/v1/", contentRouter);
app.use("/api/v1/", optionRouter);

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
