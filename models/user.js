const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
  username: String,  // this will be the default "username" field used by passport-local-mongoose
  email: { type: String, unique: true, required: true },
  // No password field needed explicitly (passport-local-mongoose handles it)
});

UserSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',  // if you want to use email as username, else remove this line
});

module.exports = mongoose.model('User', UserSchema);