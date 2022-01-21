const mongoose = require("mongoose");

exports.connectDatabase = () => {
  mongoose
    .connect(process.env.MONGO_URL)
    .then((con) => console.log(`Database connected on ${con.connection.host}`))
    .catch((err) => console.log(err));
};
