const express = require('express');
const router = express.Router();
const db = require('../database/db');

// List Active Strategies
router.get('/', (req, res) => {
  const { broker, includeInactive } = req.query;
  let strategies = db.get('strategies');
  if (broker) {
    const bLower = broker.toLowerCase().trim();
    strategies = strategies.filter(s => {
      const sBroker = (s.broker || '').toLowerCase().trim();
      return !sBroker || sBroker === bLower || sBroker === 'all' || (bLower === 'quotex' && (sBroker.includes('quotex') || sBroker === ''));
    });
  }
  if (includeInactive !== 'true') {
    strategies = strategies.filter(s => s.isActive !== false);
  }
  return res.json({ strategies });
});

// Admin: Add or Edit Strategy
router.post('/save', (req, res) => {
  try {
    const { id, name, broker, winRate, timeframe, indicatorSummary, description, isActive } = req.body;
    const strategies = db.get('strategies');

    if (id) {
      const idx = strategies.findIndex(s => s.id === id);
      if (idx >= 0) {
        strategies[idx] = {
          ...strategies[idx],
          name: name || strategies[idx].name,
          broker: broker || strategies[idx].broker,
          winRate: winRate ? parseFloat(winRate) : strategies[idx].winRate,
          timeframe: timeframe || strategies[idx].timeframe,
          indicatorSummary: indicatorSummary || strategies[idx].indicatorSummary,
          description: description || strategies[idx].description,
          isActive: isActive !== undefined ? isActive : strategies[idx].isActive
        };
      }
    } else {
      const newStrategy = {
        id: `strat-${Date.now()}`,
        name,
        broker,
        winRate: parseFloat(winRate || 85),
        timeframe: timeframe || '1M',
        indicatorSummary: indicatorSummary || 'Custom Signal Algorithmic Setup',
        description: description || 'Master Admin configured trading algorithm.',
        isActive: true,
        createdBy: 'Master Admin'
      };
      strategies.push(newStrategy);
    }

    db.save();
    return res.json({ message: 'Strategy saved successfully!', strategies });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
