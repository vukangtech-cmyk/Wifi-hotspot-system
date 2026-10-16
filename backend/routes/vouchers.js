import express from 'express';
export const vouchersRouter = express.Router();

export let vouchers = [
  {
    id: 'vch-101',
    code: 'WF-8924-A1',
    planId: 'plan-24hr',
    planName: '24 Hours Day Pass',
    status: 'available',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 28).toISOString(),
    batchNumber: 'BATCH-2026-01',
    price: 2.50
  },
  {
    id: 'vch-102',
    code: 'WF-7431-B2',
    planId: 'plan-1hr',
    planName: '1 Hour Flash',
    status: 'available',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 28).toISOString(),
    batchNumber: 'BATCH-2026-01',
    price: 0.50
  },
  {
    id: 'vch-103',
    code: 'WF-9902-C3',
    planId: 'plan-7d',
    planName: '7 Days Explorer',
    status: 'available',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 28).toISOString(),
    batchNumber: 'BATCH-2026-01',
    price: 8.00
  },
  {
    id: 'vch-104',
    code: 'WF-1158-D4',
    planId: 'plan-3hr',
    planName: '3 Hours Boost',
    status: 'active',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 29).toISOString(),
    usedAt: new Date(Date.now() - 3600000).toISOString(),
    usedByMac: 'F0:18:98:E4:31:8C',
    usedByIp: '192.168.88.115',
    batchNumber: 'BATCH-2026-01',
    price: 1.20
  }
];

// Helper to generate voucher code
function generateCode(prefix = 'WF') {
  const digits = Math.floor(1000 + Math.random() * 9000);
  const suffix = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `${prefix}-${digits}-${suffix}`;
}

// GET /api/vouchers
vouchersRouter.get('/', (req, res) => {
  const { status, batch } = req.query;
  let result = vouchers;
  if (status) {
    result = result.filter(v => v.status === status);
  }
  if (batch) {
    result = result.filter(v => v.batchNumber === batch);
  }
  res.json({ success: true, count: result.length, data: result });
});

// GET /api/vouchers/verify/:code
vouchersRouter.get('/verify/:code', (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const voucher = vouchers.find(v => v.code.toUpperCase() === code);
  if (!voucher) {
    return res.status(404).json({ success: false, error: 'Invalid voucher code' });
  }
  if (voucher.status === 'expired') {
    return res.status(400).json({ success: false, error: 'Voucher has expired' });
  }
  if (voucher.status === 'used' || (voucher.status === 'active' && voucher.usedByMac && voucher.usedByMac !== req.query.mac)) {
    return res.status(400).json({ success: false, error: 'Voucher has already been redeemed' });
  }
  res.json({ success: true, data: voucher });
});

// POST /api/vouchers/generate (Batch generator)
vouchersRouter.post('/generate', (req, res) => {
  const { planId, count = 10, prefix = 'WF', validityDays = 30, price } = req.body;
  const num = Math.min(Math.max(parseInt(count, 10) || 5, 1), 100);
  const batchId = `BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const created = [];
  for (let i = 0; i < num; i++) {
    const vch = {
      id: `vch-${Date.now()}-${i}`,
      code: generateCode(prefix),
      planId: planId || 'plan-24hr',
      planName: req.body.planName || '24 Hours Day Pass',
      status: 'available',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + validityDays * 86400000).toISOString(),
      batchNumber: batchId,
      price: price ? parseFloat(price) : 2.50
    };
    created.push(vch);
    vouchers.unshift(vch);
  }

  res.status(201).json({
    success: true,
    batchId,
    count: created.length,
    data: created
  });
});

// DELETE /api/vouchers/:id
vouchersRouter.delete('/:id', (req, res) => {
  vouchers = vouchers.filter(v => v.id !== req.params.id);
  res.json({ success: true, message: 'Voucher deleted' });
});
