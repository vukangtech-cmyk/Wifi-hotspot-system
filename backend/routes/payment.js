import express from 'express';
import { plans } from './plans.js';
import { vouchers } from './vouchers.js';
import { activeSessions } from './auth.js';

export const paymentRouter = express.Router();

export let transactions = [
  {
    id: 'tx-901',
    reference: 'MPESA-QRT89218',
    planId: 'plan-24hr',
    planName: '24 Hours Day Pass',
    amount: 2.50,
    currency: 'USD',
    paymentMethod: 'mpesa',
    phoneNumber: '+254 712 345 678',
    clientMac: '74:D2:1D:9B:4C:E1',
    clientIp: '192.168.88.142',
    status: 'completed',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    voucherGenerated: 'WF-8924-A1'
  },
  {
    id: 'tx-902',
    reference: 'CARD-AUTH-88192',
    planId: 'plan-7d',
    planName: '7 Days Explorer',
    amount: 8.00,
    currency: 'USD',
    paymentMethod: 'card',
    email: 'traveler@digitalnomad.io',
    clientMac: '2C:F0:EE:88:A9:1B',
    clientIp: '192.168.88.204',
    status: 'completed',
    timestamp: new Date(Date.now() - 1440 * 60000 * 2).toISOString(),
    voucherGenerated: 'WF-9902-C3'
  }
];

// Helper to generate reference
function generateReference(prefix = 'TX') {
  return `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// GET /api/payment/transactions
paymentRouter.get('/transactions', (req, res) => {
  res.json({ success: true, count: transactions.length, data: transactions });
});

// POST /api/payment/checkout
paymentRouter.post('/checkout', (req, res) => {
  const { planId, paymentMethod, phoneNumber, email, clientMac, clientIp, hostname } = req.body;

  const plan = plans.find(p => p.id === planId);
  if (!plan) {
    return res.status(404).json({ success: false, error: 'Selected plan not found' });
  }

  // Generate voucher
  const voucherCode = `WF-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
  const newVoucher = {
    id: `vch-${Date.now()}`,
    code: voucherCode,
    planId: plan.id,
    planName: plan.name,
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + (plan.durationMinutes + 1440) * 60000).toISOString(),
    usedAt: new Date().toISOString(),
    usedByMac: clientMac || 'E4:5F:01:22:98:AA',
    usedByIp: clientIp || '192.168.88.165',
    price: plan.price
  };
  vouchers.unshift(newVoucher);

  // Record transaction
  const ref = generateReference(paymentMethod ? paymentMethod.toUpperCase() : 'PAY');
  const transaction = {
    id: `tx-${Date.now()}`,
    reference: ref,
    planId: plan.id,
    planName: plan.name,
    amount: plan.price,
    currency: plan.currency,
    paymentMethod: paymentMethod || 'mpesa',
    phoneNumber: phoneNumber || '+254 700 000 000',
    email: email || '',
    clientMac: clientMac || 'E4:5F:01:22:98:AA',
    clientIp: clientIp || '192.168.88.165',
    status: 'completed',
    timestamp: new Date().toISOString(),
    voucherGenerated: voucherCode
  };
  transactions.unshift(transaction);

  // Auto-connect device session
  const durationMinutes = plan.durationMinutes || 60;
  const newSession = {
    id: `sess-${Date.now()}`,
    clientIp: clientIp || '192.168.88.165',
    clientMac: clientMac || 'E4:5F:01:22:98:AA',
    hostname: hostname || 'Payment-Client',
    deviceType: 'phone',
    planId: plan.id,
    planName: plan.name,
    voucherCode: voucherCode,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + durationMinutes * 60000).toISOString(),
    downloadedMB: 0,
    uploadedMB: 0,
    downloadSpeedKbps: plan.downloadSpeedMbps * 1000,
    uploadSpeedKbps: plan.uploadSpeedMbps * 1000,
    status: 'connected',
    isPaused: false
  };

  activeSessions.unshift(newSession);

  res.json({
    success: true,
    message: 'Payment received successfully! WiFi access has been activated.',
    transaction,
    voucher: newVoucher,
    session: newSession
  });
});

// Map to track active checkouts
export const checkoutStore = new Map();

// POST /api/payment/initiate
paymentRouter.post('/initiate', (req, res) => {
  const { phone, packageId, macAddress } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Namba ya simu inahitajika' });
  }

  const checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const packagesList = [
    { id: 1, name: 'Saa 1', price: 200, duration_hours: 1 },
    { id: 2, name: 'Siku 1', price: 1000, duration_hours: 24 },
    { id: 3, name: 'Wiki 1', price: 5000, duration_hours: 168 },
    { id: 4, name: 'Mwezi 1', price: 15000, duration_hours: 720 },
  ];
  const pkg = packagesList.find(p => p.id === parseInt(packageId, 10)) || packagesList[0];

  checkoutStore.set(checkoutRequestId, {
    checkoutRequestId,
    phone,
    packageId,
    pkg,
    macAddress: macAddress || 'AA:BB:CC:DD:EE:FF',
    createdAt: Date.now(),
    status: 'pending'
  });

  res.json({
    success: true,
    checkoutRequestId,
    message: 'Ombi la M-Pesa limetumwa kwenye simu yako'
  });
});

// GET /api/payment/status/:checkoutId
paymentRouter.get('/status/:checkoutId', (req, res) => {
  const item = checkoutStore.get(req.params.checkoutId);
  if (!item) {
    return res.status(404).json({ status: 'failed', message: 'Muamala haukupatikana' });
  }

  // After 3 seconds, simulate successful M-Pesa PIN approval
  const elapsed = Date.now() - item.createdAt;
  if (elapsed > 3000) {
    if (item.status !== 'success') {
      item.status = 'success';

      const tx = {
        id: `tx-${Date.now()}`,
        reference: `MPESA-${Math.floor(100000 + Math.random() * 900000)}`,
        planId: `pkg-${item.pkg.id}`,
        planName: item.pkg.name,
        amount: item.pkg.price,
        currency: 'TZS',
        paymentMethod: 'mpesa',
        phoneNumber: item.phone,
        clientMac: item.macAddress,
        clientIp: '192.168.88.115',
        status: 'completed',
        timestamp: new Date().toISOString()
      };
      transactions.unshift(tx);

      const newSession = {
        id: `sess-${Date.now()}`,
        clientIp: '192.168.88.115',
        clientMac: item.macAddress,
        hostname: 'M-Pesa-Customer',
        deviceType: 'phone',
        planId: `pkg-${item.pkg.id}`,
        planName: item.pkg.name,
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + item.pkg.duration_hours * 3600000).toISOString(),
        downloadedMB: 0,
        uploadedMB: 0,
        downloadSpeedKbps: 15000,
        uploadSpeedKbps: 5000,
        status: 'connected',
        isPaused: false
      };
      activeSessions.unshift(newSession);
    }

    return res.json({ status: 'success', checkoutRequestId: item.checkoutRequestId });
  }

  res.json({ status: 'pending', checkoutRequestId: item.checkoutRequestId });
});
