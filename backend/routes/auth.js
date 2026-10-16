import express from 'express';
import { vouchers } from './vouchers.js';
import { plans } from './plans.js';

export const authRouter = express.Router();

export let activeSessions = [
  {
    id: 'sess-101',
    clientIp: '192.168.88.115',
    clientMac: 'F0:18:98:E4:31:8C',
    hostname: 'iPhone-15-Pro',
    deviceType: 'phone',
    planId: 'plan-3hr',
    planName: '3 Hours Boost',
    voucherCode: 'WF-1158-D4',
    startedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 135 * 60000).toISOString(),
    downloadedMB: 480,
    uploadedMB: 65,
    downloadSpeedKbps: 4500,
    uploadSpeedKbps: 920,
    status: 'connected',
    isPaused: false
  },
  {
    id: 'sess-102',
    clientIp: '192.168.88.142',
    clientMac: '74:D2:1D:9B:4C:E1',
    hostname: 'MacBook-Pro-M3',
    deviceType: 'laptop',
    planId: 'plan-24hr',
    planName: '24 Hours Day Pass',
    startedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 1320 * 60000).toISOString(),
    downloadedMB: 2840,
    uploadedMB: 420,
    downloadSpeedKbps: 18200,
    uploadSpeedKbps: 3400,
    status: 'connected',
    isPaused: false
  }
];

// Helper to extract or fallback client IP/MAC
export function getClientInfo(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '192.168.88.100';
  const cleanIp = ip.includes('::') ? '192.168.88.100' : ip;
  const mac = req.headers['x-client-mac'] || req.body?.mac || 'AA:BB:CC:DD:EE:FF';
  return { ip: cleanIp, mac };
}

// GET /api/auth/status
authRouter.get('/status', (req, res) => {
  const queryMac = req.query.mac || req.headers['x-client-mac'];
  const queryIp = req.query.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const session = activeSessions.find(s =>
    (queryMac && s.clientMac.toLowerCase() === queryMac.toLowerCase()) ||
    (queryIp && s.clientIp === queryIp)
  );

  if (session) {
    const now = Date.now();
    const expiry = new Date(session.expiresAt).getTime();
    const remainingSeconds = Math.max(0, Math.floor((expiry - now) / 1000));

    if (remainingSeconds === 0) {
      session.status = 'expired';
      return res.json({ authenticated: false, session: null, message: 'Session expired' });
    }

    return res.json({
      authenticated: true,
      session: {
        ...session,
        remainingSeconds
      }
    });
  }

  res.json({ authenticated: false, session: null });
});

// POST /api/auth/login-voucher
authRouter.post('/login-voucher', (req, res) => {
  const { code, mac, ip, hostname } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, error: 'Voucher code is required' });
  }

  const vCode = code.trim().toUpperCase();
  const voucher = vouchers.find(v => v.code.toUpperCase() === vCode);

  if (!voucher) {
    return res.status(404).json({ success: false, error: 'Invalid voucher code. Please check and try again.' });
  }

  if (voucher.status === 'expired') {
    return res.status(400).json({ success: false, error: 'This voucher has already expired.' });
  }

  const matchedPlan = plans.find(p => p.id === voucher.planId) || plans[0];
  const clientMac = mac || 'F0:18:98:E4:31:8C';
  const clientIp = ip || '192.168.88.115';

  // Mark voucher as active/used
  voucher.status = 'active';
  voucher.usedAt = new Date().toISOString();
  voucher.usedByMac = clientMac;
  voucher.usedByIp = clientIp;

  // Create session
  const durationMinutes = matchedPlan.durationMinutes || 60;
  const newSession = {
    id: `sess-${Date.now()}`,
    clientIp,
    clientMac,
    hostname: hostname || 'Connected-Device',
    deviceType: 'phone',
    planId: matchedPlan.id,
    planName: matchedPlan.name,
    voucherCode: voucher.code,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + durationMinutes * 60000).toISOString(),
    downloadedMB: 12,
    uploadedMB: 2,
    downloadSpeedKbps: 8400,
    uploadSpeedKbps: 1800,
    status: 'connected',
    isPaused: false
  };

  // Replace any existing session for this MAC
  activeSessions = activeSessions.filter(s => s.clientMac.toLowerCase() !== clientMac.toLowerCase());
  activeSessions.unshift(newSession);

  res.json({
    success: true,
    message: 'Authorized successfully! You are now connected to the internet.',
    session: newSession
  });
});

// POST /api/auth/free-trial
authRouter.post('/free-trial', (req, res) => {
  const { mac, ip, hostname } = req.body;
  const clientMac = mac || 'CC:DD:EE:11:22:33';
  const clientIp = ip || '192.168.88.188';

  const durationMinutes = 15; // 15 minutes complimentary
  const trialSession = {
    id: `sess-trial-${Date.now()}`,
    clientIp,
    clientMac,
    hostname: hostname || 'Guest-Trial',
    deviceType: 'phone',
    planId: 'plan-trial',
    planName: '15 Min Complimentary Trial',
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + durationMinutes * 60000).toISOString(),
    downloadedMB: 0,
    uploadedMB: 0,
    downloadSpeedKbps: 10000,
    uploadSpeedKbps: 3000,
    status: 'connected',
    isPaused: false
  };

  activeSessions = activeSessions.filter(s => s.clientMac.toLowerCase() !== clientMac.toLowerCase());
  activeSessions.unshift(trialSession);

  res.json({
    success: true,
    message: 'Welcome! You have been granted 15 minutes complimentary access.',
    session: trialSession
  });
});

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  const { mac, sessionId } = req.body;
  if (sessionId) {
    activeSessions = activeSessions.filter(s => s.id !== sessionId);
  } else if (mac) {
    activeSessions = activeSessions.filter(s => s.clientMac.toLowerCase() !== mac.toLowerCase());
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/sessions (Admin session list)
authRouter.get('/sessions', (req, res) => {
  res.json({ success: true, count: activeSessions.length, data: activeSessions });
});

// POST /api/auth/kick/:id (Admin disconnect client)
authRouter.post('/kick/:id', (req, res) => {
  const index = activeSessions.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  const removed = activeSessions.splice(index, 1)[0];
  res.json({ success: true, message: `Client ${removed.hostname} (${removed.clientIp}) disconnected`, session: removed });
});
