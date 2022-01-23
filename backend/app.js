const express = require("express");
const { createPost } = require("./controllers/Post");
const app = express();

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: "backend/config/config.env" });
}

//using middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//importing Routes
const post = require("./routes/Post");
//using Route
app.use("/api/v1", post);
module.exports = app;
