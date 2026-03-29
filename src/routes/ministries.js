const express  = require('express');
const router   = express.Router();
const Ministry = require('../models/Ministry');
const Interest = require('../models/Interest');

// GET all ministries
router.get('/', async (req, res) => {
  try {
    const ministries = await Ministry.find().sort({ createdAt: 1 });
    res.json(ministries);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create ministry
router.post('/', async (req, res) => {
  try {
    const { name, icon, limit } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const ministry = await Ministry.create({
      name: name.trim(),
      icon: icon || '🙏',
      limit: limit || 1,
    });
    res.status(201).json(ministry);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update ministry
router.put('/:id', async (req, res) => {
  try {
    const { name, icon, limit } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const ministry = await Ministry.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), ...(icon && { icon }), ...(limit && { limit }) },
      { new: true, runValidators: true }
    );
    if (!ministry) return res.status(404).json({ error: 'Ministry not found' });
    res.json(ministry);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE ministry
router.delete('/:id', async (req, res) => {
  try {
    const ministry = await Ministry.findByIdAndDelete(req.params.id);
    if (!ministry) return res.status(404).json({ error: 'Ministry not found' });
    await Interest.deleteMany({ ministryId: req.params.id });
    res.json({ message: 'Ministry deleted', id: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
