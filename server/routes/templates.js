const router = require('express').Router()
const fs = require('fs')
const path = require('path')
const authMiddleware = require('../middleware/authMiddleware')

const TEMPLATES_DIR = path.join(__dirname, '../data/templates')

function loadAllTemplates() {
  return fs
    .readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8')))
}

// GET /api/templates — return summaries only
router.get('/', authMiddleware, (req, res) => {
  try {
    const summaries = loadAllTemplates().map(({ id, name, description }) => ({ id, name, description }))
    res.json(summaries)
  } catch (err) {
    res.status(500).json({ message: 'Failed to load templates' })
  }
})

// GET /api/templates/:id — return full template
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const filePath = path.join(TEMPLATES_DIR, `${req.params.id}.json`)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Template not found' })
    }
    res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')))
  } catch (err) {
    res.status(500).json({ message: 'Failed to load template' })
  }
})

module.exports = router
