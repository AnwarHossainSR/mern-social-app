const User = require("../models/User");
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
