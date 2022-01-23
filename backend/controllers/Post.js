const Post = require("../models/Post");
exports.createPost = async (req, res) => {
  try {
    const newPost = {
      caption: req.body.caption,
      image: {
        public_id: "req.body.public_id",
        url: "req.body.url",
      },
      owner: req.user._id,
    };
    const post = await Post.create(newPost);
    res.status(200).json({
      success: true,
      post: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
