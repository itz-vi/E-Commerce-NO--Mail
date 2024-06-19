const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/E-COMMERCE")


const userSchema = mongoose.Schema({
  fullname: String,
  email: String,
  password: String,

});

module.exports = mongoose.model('user', userSchema)