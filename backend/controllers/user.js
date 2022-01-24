const { findById } = require("../models/User");
const User = require("../models/User");
const Post = require("../models/Post");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "user already exists",
      });
    }
    user = await User.create({
      name,
      email,
      password,
      avatar: { public_id: "sample id", url: "sample url" },
    });
    const token = await user.generateToken();
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };
    res.status(201).cookie("token", token, options).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user doesn't exists",
      });
    }
    let isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "incorrect password",
      });
    }
    const token = await user.generateToken();
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };
    res.status(200).cookie("token", token, options).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
      .json({
        success: true,
        message: "logged out",
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const loggiedInUser = await User.findById(req.user._id);
    if (!userToFollow) {
      res.status(404).json({
        success: false,
        message: "user not found",
      });
    }
    if (loggiedInUser.following.includes(userToFollow._id)) {
      const indexFollowing = loggiedInUser.following.indexOf(userToFollow._id);
      loggiedInUser.following.splice(indexFollowing, 1);
      const indexFollower = userToFollow.following.indexOf(loggiedInUser._id);
      userToFollow.followers.splice(indexFollower, 1);
      await loggiedInUser.save();
      await userToFollow.save();
      res.status(200).json({
        success: true,
        message: "user unfollowd",
      });
    } else {
      loggiedInUser.following.push(userToFollow._id);
      userToFollow.followers.push(loggiedInUser._id);
      await loggiedInUser.save();
      await userToFollow.save();
      res.status(200).json({
        success: true,
        message: "user followd",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    let user = await User.findById(req.user._id).select("+password");
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "please provide old and new password",
      });
    }
    let isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "incorrect current password",
      });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({
      success: true,
      message: "password updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    const { name, email } = req.body;
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }
    //TODO:User avater

    await user.save();
    res.status(200).json({
      success: true,
      message: "profile updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteMyProfile = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    let posts = user.posts;
    await user.remove();
    //logout
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    //Deleting all post from user
    for (let index = 0; index < posts.length; index++) {
      const post = await Post.findById(posts[index]);
      await post.remove();
    }
    res.status(200).json({
      success: true,
      message: "profile deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
