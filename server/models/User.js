const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  picture: { type: String, default: '' },
  firstLogin: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

class User {
  static async fromGoogle(profile) {
    const existing = await UserModel.findOne({ googleId: profile.id })
    if (existing) return existing

    return UserModel.create({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value ?? '',
      firstLogin: true,
    })
  }

  markReturning() {
    this.firstLogin = false
    return this.save()
  }

  toJSON() {
    return {
      id: this._id,
      name: this.name,
      email: this.email,
      picture: this.picture,
      isNew: this.firstLogin,
    }
  }
}

userSchema.loadClass(User)

const UserModel = mongoose.model('User', userSchema)

module.exports = UserModel
