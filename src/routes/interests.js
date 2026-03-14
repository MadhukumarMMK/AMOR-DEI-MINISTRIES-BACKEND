const express  = require('express');
const router   = express.Router();
const Interest = require('../models/Interest');

// GET all interests (optionally filter by memberId or ministryId)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.memberId)   filter.memberId   = req.query.memberId;
    if (req.query.ministryId) filter.ministryId = req.query.ministryId;

    const interests = await Interest.find(filter);
    res.json(interests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST toggle interest (add if not exists, remove if exists)
router.post('/toggle', async (req, res) => {
  try {
    const { memberId, ministryId } = req.body;
    if (!memberId || !ministryId)
      return res.status(400).json({ error: 'memberId and ministryId are required' });

    const existing = await Interest.findOne({ memberId, ministryId });
    if (existing) {
      await Interest.deleteOne({ _id: existing._id });
      return res.json({ action: 'removed', memberId, ministryId });
    } else {
      const interest = await Interest.create({ memberId, ministryId });
      return res.status(201).json({ action: 'added', interest });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
