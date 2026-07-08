const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')
const { exerciseSchema } = require('./Exercise')

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const daySchema = new mongoose.Schema({
  day: { type: String, required: true, enum: DAYS_OF_WEEK },
  isRest: { type: Boolean, default: false },
  splitName: { type: String, default: '' },
  exercises: { type: [exerciseSchema], default: [] },
})

const programSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, maxlength: 40 },
  isActive: { type: Boolean, default: false },
  days: { type: [daySchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

class Program {
  getDay(dayName) {
    return this.days.find(d => d.day === dayName) ?? null
  }

  async activate() {
    await ProgramModel.updateMany({ userId: this.userId, _id: { $ne: this._id } }, { isActive: false })
    this.isActive = true
    return this.save()
  }

  static buildBlank(userId, name) {
    return new ProgramModel({
      userId,
      name,
      days: DAYS_OF_WEEK.map(day => ({ day, isRest: false, splitName: '', exercises: [] })),
    })
  }

  static fromJSON(userId, name, days) {
    return new ProgramModel({
      userId,
      name,
      days: days.map(d => ({
        day: d.day,
        isRest: d.isRest ?? false,
        splitName: d.splitName ?? '',
        exercises: (d.exercises || []).map(ex => ({
          id: ex.id || uuidv4(),
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
        })),
      })),
      updatedAt: new Date(),
    })
  }
}

programSchema.loadClass(Program)

const ProgramModel = mongoose.model('Program', programSchema)

module.exports = ProgramModel
