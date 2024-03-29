const User = require("../models/User");
const Post = require("../models/Post");
const { mailSend } = require("../middlewares/sendEmail");
const crypto = require("crypto");

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
    let followers = user.followers;
    let following = user.following;
    let userId = user._id;

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
    //removing user from followers following
    for (let i = 0; i < followers.length; i++) {
      const follower = await User.findById(followers[i]);
      const index = follower.following.indexOf(userId);
      follower.following.splice(index, 1);
      await follower.save();
    }

    //removing user from following's follower
    for (let i = 0; i < following.length; i++) {
      const follow = await User.findById(following[i]);
      const index = follow.followers.indexOf(userId);
      follow.followers.splice(index, 1);
      await follow.save();
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

exports.myProfile = async (req, res) => {
  try {
    let user = await User.findById(req.user._id).populate("posts");
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.userProfile = async (req, res) => {
  try {
    let user = await User.findById(req.params.id).populate("posts");
    if (!user) {
      res.status(400).json({
        success: false,
        message: "user not found",
      });
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.allUsers = async (req, res) => {
  try {
    let user = await User.find({}).populate("posts");
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "user not found",
      });
    }
    const resetPasswordToken = await user.getResetPasswordToken();
    await user.save();

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/password/reset/${resetPasswordToken}`;
    const message = `Reset your password by ckicking on the link bellow : \n\n ${resetUrl}`;
    try {
      await mailSend({
        email: user.email,
        subject: "Reset Password",
        message,
      });
      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email}`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid token or has expire",
      });
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
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
