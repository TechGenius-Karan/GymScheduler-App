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

const scheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  days: { type: [daySchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
})

class Schedule {
  getDay(dayName) {
    return this.days.find(d => d.day === dayName) ?? null
  }

  applyTemplate(templateDays) {
    this.days = templateDays.map(td => ({
      day: td.day,
      isRest: td.isRest,
      splitName: td.splitName,
      exercises: (td.exercises || []).map(ex => ({
        id: uuidv4(),
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
      })),
    }))
    this.updatedAt = new Date()
  }

  static buildBlank(userId) {
    return new ScheduleModel({
      userId,
      days: DAYS_OF_WEEK.map(day => ({
        day,
        isRest: false,
        splitName: '',
        exercises: [],
      })),
    })
  }

  static fromJSON(userId, days) {
    return new ScheduleModel({
      userId,
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

scheduleSchema.loadClass(Schedule)

const ScheduleModel = mongoose.model('Schedule', scheduleSchema)

module.exports = ScheduleModel
