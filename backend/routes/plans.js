import express from 'express';
export const plansRouter = express.Router();

// In-memory persistent state
export let plans = [
  {
    id: 'plan-2hr',
    name: 'Masaa 2 (Speed 10 Mbps)',
    description: 'Inafaa kwa WhatsApp, Facebook, na browsing ya kawaida.',
    price: 500,
    currency: 'TZS',
    durationMinutes: 120,
    dataLimitMB: 0,
    downloadSpeedMbps: 10,
    uploadSpeedMbps: 5,
    maxDevices: 1,
    isActive: true,
    badge: 'Popular'
  },
  {
    id: 'plan-6hr',
    name: 'Masaa 6 (Speed 15 Mbps)',
    description: 'Inafaa kwa video fupi, muziki, na kazi za mtandaoni.',
    price: 1000,
    currency: 'TZS',
    durationMinutes: 360,
    dataLimitMB: 0,
    downloadSpeedMbps: 15,
    uploadSpeedMbps: 8,
    maxDevices: 1,
    isActive: true
  },
  {
    id: 'plan-24hr',
    name: 'Masaa 24 (Siku Nzima)',
    description: 'Speed ya juu bila kikomo cha bando kwa vifaa hadi 2.',
    price: 2000,
    currency: 'TZS',
    durationMinutes: 1440,
    dataLimitMB: 0,
    downloadSpeedMbps: 25,
    uploadSpeedMbps: 12,
    maxDevices: 2,
    isPopular: true,
    isActive: true,
    badge: 'Inapendwa Zaidi'
  },
  {
    id: 'plan-7d',
    name: 'Siku 7 (Wiki Nzima)',
    description: 'Bora kwa ofisi ndogo, nyumbani na matumizi endelevu.',
    price: 10000,
    currency: 'TZS',
    durationMinutes: 10080,
    dataLimitMB: 0,
    downloadSpeedMbps: 35,
    uploadSpeedMbps: 18,
    maxDevices: 3,
    isActive: true,
    badge: 'Thamani Bora'
  },
  {
    id: 'plan-30d',
    name: 'Mwezi 1 (Siku 30)',
    description: 'Internet ya mwezi mzima bila kikomo kwa vifaa 5.',
    price: 35000,
    currency: 'TZS',
    durationMinutes: 43200,
    dataLimitMB: 0,
    downloadSpeedMbps: 50,
    uploadSpeedMbps: 25,
    maxDevices: 5,
    isActive: true
  }
];

// GET /api/plans
plansRouter.get('/', (req, res) => {
  res.json({ success: true, count: plans.length, data: plans });
});

// POST /api/plans (Create plan)
plansRouter.post('/', (req, res) => {
  const { name, price, durationMinutes, dataLimitMB, downloadSpeedMbps, uploadSpeedMbps, description } = req.body;
  if (!name || price === undefined || !durationMinutes) {
    return res.status(400).json({ success: false, error: 'Missing required plan fields' });
  }

  const newPlan = {
    id: `plan-${Date.now()}`,
    name,
    description: description || 'High-speed internet access',
    price: parseFloat(price),
    currency: req.body.currency || 'USD',
    durationMinutes: parseInt(durationMinutes, 10),
    dataLimitMB: parseInt(dataLimitMB || 0, 10),
    downloadSpeedMbps: parseInt(downloadSpeedMbps || 20, 10),
    uploadSpeedMbps: parseInt(uploadSpeedMbps || 10, 10),
    maxDevices: parseInt(req.body.maxDevices || 1, 10),
    isActive: true,
    badge: req.body.badge || ''
  };

  plans.push(newPlan);
  res.status(201).json({ success: true, data: newPlan });
});

// PUT /api/plans/:id (Update plan)
plansRouter.put('/:id', (req, res) => {
  const index = plans.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Plan not found' });
  }
  plans[index] = { ...plans[index], ...req.body };
  res.json({ success: true, data: plans[index] });
});

// DELETE /api/plans/:id
plansRouter.delete('/:id', (req, res) => {
  plans = plans.filter(p => p.id !== req.params.id);
  res.json({ success: true, message: 'Plan deleted successfully' });
});
