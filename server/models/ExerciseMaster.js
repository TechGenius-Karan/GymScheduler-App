const mongoose = require('mongoose')
const { randomUUID } = require('crypto')

const exerciseMasterSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => randomUUID() },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    muscleImpact: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('ExerciseMaster', exerciseMasterSchema)
