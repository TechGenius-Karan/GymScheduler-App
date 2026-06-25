require('dotenv').config()
const express = require('express')
const cors = require('cors')
const passport = require('passport')
const connectDB = require('./config/db')

const app = express()

connectDB()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(passport.initialize())

app.use('/auth', require('./routes/auth'))
app.use('/api/schedules', require('./routes/schedule'))
app.use('/api/templates', require('./routes/templates'))
app.use('/api/user', require('./routes/trainer'))
app.use('/api/exercises', require('./routes/exercises'))
app.use('/api/tracker', require('./routes/tracker'))
app.use('/api/slots', require('./routes/trainerSlots'))
app.use('/api/bookings', require('./routes/trainerSchedules'))
app.use('/api/reviews', require('./routes/reviews'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
