const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

userSchecma.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchecma.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchecma.methods.generateToken = async function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
};

module.exports = mongoose.model("User", userSchecma);
