const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const User = require('../models/User')

// PATCH /api/user/become-trainer
router.patch('/become-trainer', authMiddleware, async (req, res) => {
  try {
    const { bio, certifications, gymName, location } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        isTrainer: true,
        trainerProfile: { bio, certifications, gymName, location },
      },
      { new: true }
    )
    res.json(user.toJSON())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/user/trainer-profile
router.patch('/trainer-profile', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isTrainer) {
      return res.status(403).json({ error: 'User is not a trainer' })
    }
    const { bio, certifications, gymName, location } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { trainerProfile: { bio, certifications, gymName, location } },
      { new: true }
    )
    res.json(user.toJSON())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
