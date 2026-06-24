const router = require('express').Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/User')
const authMiddleware = require('../middleware/authMiddleware')

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await User.fromGoogle(profile)
        done(null, user)
      } catch (err) {
        done(err, null)
      }
    }
  )
)

// GET /auth/google — redirect to Google consent screen
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }))

// GET /auth/google/callback — Google redirects here after consent
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }),
  (req, res) => {
    const user = req.user
    const token = jwt.sign(
      { id: user._id, email: user.email, isNew: user.firstLogin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`)
  }
)

// GET /auth/me — return current user from JWT
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user.toJSON())
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
