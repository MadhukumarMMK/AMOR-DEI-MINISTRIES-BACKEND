const express  = require('express');
const router   = express.Router();
const Roster   = require('../models/Roster');
const Interest = require('../models/Interest');
const Ministry = require('../models/Ministry');

// ── Random assignment engine (respects ministry limit) ────────────────────
async function generateAssignments() {
  const ministries = await Ministry.find().sort({ createdAt: 1 });
  const interests  = await Interest.find();
  const used       = new Set();
  const assignments = [];

  for (const min of ministries) {
    const lim = min.limit || 1;
    // Pool: interested members not yet used elsewhere
    const pool = interests
      .filter(i => i.ministryId.toString() === min._id.toString() && !used.has(i.memberId.toString()))
      .map(i => i.memberId.toString());

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const picks = pool.slice(0, lim);
    picks.forEach(p => used.add(p));

    if (picks.length > 0) {
      assignments.push({ ministryId: min._id, memberIds: picks });
    } else {
      // Fallback: any interested member
      const fallback = interests
        .filter(i => i.ministryId.toString() === min._id.toString())
        .map(i => i.memberId.toString());
      if (fallback.length > 0) {
        const pick = fallback[Math.floor(Math.random() * fallback.length)];
        assignments.push({ ministryId: min._id, memberIds: [pick] });
      } else {
        assignments.push({ ministryId: min._id, memberIds: [] });
      }
    }
  }
  return assignments;
}

const populateRoster = (id) =>
  Roster.findById(id)
    .populate('assignments.ministryId')
    .populate('assignments.memberIds');

// GET all rosters
router.get('/', async (req, res) => {
  try {
    const rosters = await Roster.find()
      .sort({ createdAt: -1 }).limit(20)
      .populate('assignments.ministryId')
      .populate('assignments.memberIds');
    res.json(rosters);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET latest roster
router.get('/latest/current', async (req, res) => {
  try {
    const roster = await Roster.findOne()
      .sort({ createdAt: -1 })
      .populate('assignments.ministryId')
      .populate('assignments.memberIds');
    res.json(roster || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single roster
router.get('/:id', async (req, res) => {
  try {
    const roster = await populateRoster(req.params.id);
    if (!roster) return res.status(404).json({ error: 'Roster not found' });
    res.json(roster);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST generate new roster
router.post('/generate', async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });
    const assignments = await generateAssignments();
    const roster = await Roster.create({ date, assignments, status: 'draft' });
    res.status(201).json(await populateRoster(roster._id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH add a member to a ministry in the roster
router.patch('/:id/add-member', async (req, res) => {
  try {
    const { ministryId, memberId } = req.body;
    if (!ministryId || !memberId)
      return res.status(400).json({ error: 'ministryId and memberId are required' });

    const roster = await Roster.findById(req.params.id);
    if (!roster) return res.status(404).json({ error: 'Roster not found' });

    const assignment = roster.assignments.find(a => a.ministryId.toString() === ministryId);
    if (!assignment) return res.status(404).json({ error: 'Ministry not in roster' });

    // Check ministry limit
    const ministry = await Ministry.findById(ministryId);
    const lim = ministry?.limit || 1;
    if (assignment.memberIds.length >= lim)
      return res.status(400).json({ error: `This ministry has a limit of ${lim} person${lim>1?'s':''}` });

    if (!assignment.memberIds.map(id => id.toString()).includes(memberId))
      assignment.memberIds.push(memberId);

    await roster.save();
    res.json(await populateRoster(roster._id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH remove a member from a ministry in the roster
router.patch('/:id/remove-member', async (req, res) => {
  try {
    const { ministryId, memberId } = req.body;
    if (!ministryId || !memberId)
      return res.status(400).json({ error: 'ministryId and memberId are required' });

    const roster = await Roster.findById(req.params.id);
    if (!roster) return res.status(404).json({ error: 'Roster not found' });

    const assignment = roster.assignments.find(a => a.ministryId.toString() === ministryId);
    if (!assignment) return res.status(404).json({ error: 'Ministry not in roster' });

    assignment.memberIds = assignment.memberIds.filter(id => id.toString() !== memberId);
    await roster.save();
    res.json(await populateRoster(roster._id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH confirm roster
router.patch('/:id/confirm', async (req, res) => {
  try {
    const roster = await Roster.findByIdAndUpdate(
      req.params.id, { status: 'confirmed' }, { new: true }
    ).populate('assignments.ministryId').populate('assignments.memberIds');
    if (!roster) return res.status(404).json({ error: 'Roster not found' });
    res.json(roster);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE roster
router.delete('/:id', async (req, res) => {
  try {
    const roster = await Roster.findByIdAndDelete(req.params.id);
    if (!roster) return res.status(404).json({ error: 'Roster not found' });
    res.json({ message: 'Roster deleted', id: req.params.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
