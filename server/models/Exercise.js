const mongoose = require('mongoose')

const exerciseSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  sets: {
    type: Number,
    required: true,
    validate: { validator: v => Number.isInteger(v) && v > 0, message: 'Sets must be a positive integer' },
  },
  reps: {
    type: Number,
    required: true,
    validate: { validator: v => Number.isInteger(v) && v > 0, message: 'Reps must be a positive integer' },
  },
})

class Exercise {
  constructor({ id, name, sets, reps }) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error('Exercise name is required')
    }
    if (!Number.isInteger(sets) || sets <= 0) {
      throw new Error('Sets must be a positive integer')
    }
    if (!Number.isInteger(reps) || reps <= 0) {
      throw new Error('Reps must be a positive integer')
    }
    this.id = id
    this.name = name.trim()
    this.sets = sets
    this.reps = reps
  }

  toJSON() {
    return { id: this.id, name: this.name, sets: this.sets, reps: this.reps }
  }
}

exerciseSchema.loadClass(Exercise)

module.exports = { Exercise, exerciseSchema }
