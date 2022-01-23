const user = require("../models/User");
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let userexists = await user.findOne({ email });
    if (userexists) {
      res.status(400).json({
        success: false,
        message: "user already exists",
      });
    }
    const newUser = await user.create({
      name,
      email,
      password,
      avater: { public_id: "sample id", url: "sample url" },
    });
    res.status(201).json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
