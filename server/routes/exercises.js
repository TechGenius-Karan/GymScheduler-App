const express = require('express')
const router = express.Router()
const ExerciseMaster = require('../models/ExerciseMaster')
const authMiddleware = require('../middleware/authMiddleware')

// GET /api/exercises — all exercises for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const exercises = await ExerciseMaster.find({ createdBy: req.user.id })
    res.json(exercises)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/exercises — create a new exercise
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, muscleImpact } = req.body
    const exercise = await ExerciseMaster.create({
      name,
      description,
      muscleImpact,
      createdBy: req.user.id,
    })
    res.status(201).json(exercise)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/exercises/:id — edit an exercise
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, muscleImpact } = req.body
    const exercise = await ExerciseMaster.findOneAndUpdate(
      { id: req.params.id, createdBy: req.user.id },
      { name, description, muscleImpact },
      { new: true, runValidators: true }
    )
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' })
    res.json(exercise)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/exercises/:id — delete an exercise
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const exercise = await ExerciseMaster.findOneAndDelete({
      id: req.params.id,
      createdBy: req.user.id,
    })
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
