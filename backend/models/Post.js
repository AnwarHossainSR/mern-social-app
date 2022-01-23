const mongoose = require("mongoose");

const postSchecma = new mongoose.Schema({
  caption: String,
  imageUrl: {
    public_id: String,
    url: String,
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [
    {
      user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  comments: [
    {
      user: { type: mongoose.Types.ObjectId, ref: "User" },
      comment: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
  ],
});

module.exports = mongoose.model("Post", postSchecma);
