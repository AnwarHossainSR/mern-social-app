const mongoose = require("mongoose");

const userSchecma = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Plese enter a password"],
  },
  avatar: { public_id: String, url: String },
  url: String,
  email: {
    type: String,
    required: [true, "Plese enter an email"],
    unique: [true, "Email already exists"],
  },
  password: {
    type: String,
    required: [true, "Plese enter a password"],
    minlength: [6, "Password must be at least 6 charecter"],
    select: false,
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("User", userSchecma);
