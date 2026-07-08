const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware')
const User = require('../models/User')

// PATCH /api/user/become-trainer
router.patch('/become-trainer', authMiddleware, async (req, res) => {
  try {
    const { bio, certifications, gymName, location } = req.body
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        isTrainer: true,
        trainerProfile: { bio, certifications, gymName, location },
      },
      { new: true }
    )
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user.toJSON())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/user/trainer-profile
router.patch('/trainer-profile', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id)
    if (!currentUser) return res.status(404).json({ error: 'User not found' })
    if (!currentUser.isTrainer) return res.status(403).json({ error: 'User is not a trainer' })

    const { bio, certifications, gymName, location } = req.body
    const updates = {}
    if (bio !== undefined) updates['trainerProfile.bio'] = bio
    if (certifications !== undefined) updates['trainerProfile.certifications'] = certifications
    if (gymName !== undefined) updates['trainerProfile.gymName'] = gymName
    if (location !== undefined) updates['trainerProfile.location'] = location

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    )
    res.json(user.toJSON())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
