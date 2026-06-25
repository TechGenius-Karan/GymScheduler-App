const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  picture: { type: String, default: '' },
  firstLogin: { type: Boolean, default: true },
  isTrainer: { type: Boolean, default: false },
  trainerProfile: {
    type: {
      bio: { type: String },
      certifications: { type: String },
      gymName: { type: String },
      location: { type: String },
      averageRating: { type: Number, default: null },
      reviewCount: { type: Number, default: 0 },
    },
    default: null,
  },
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
      isTrainer: this.isTrainer,
      trainerProfile: this.trainerProfile ?? null,
    }
  }
}

userSchema.loadClass(User)

const UserModel = mongoose.model('User', userSchema)

module.exports = UserModel
