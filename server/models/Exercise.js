const mongoose = require('mongoose')

const exerciseSchema = new mongoose.Schema({
  id: { type: String, required: true },
  exerciseId: { type: String },
  name: { type: String, trim: true },
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

module.exports = { exerciseSchema }
