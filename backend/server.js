import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { plansRouter } from './routes/plans.js';
import { vouchersRouter } from './routes/vouchers.js';
import { authRouter } from './routes/auth.js';
import { paymentRouter } from './routes/payment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Endpoints
app.use('/api/plans', plansRouter);
app.use('/api/vouchers', vouchersRouter);
app.use('/api/auth', authRouter);
app.use('/api/payment', paymentRouter);

// Alias endpoint for packages
app.get('/api/packages', (req, res) => {
  res.json([
    { id: 1, name: 'Saa 1', price: 200, duration_hours: 1 },
    { id: 2, name: 'Siku 1', price: 1000, duration_hours: 24 },
    { id: 3, name: 'Wiki 1', price: 5000, duration_hours: 168 },
    { id: 4, name: 'Mwezi 1', price: 15000, duration_hours: 720 },
  ]);
});

// Health check & System info API
app.get('/api/system/status', (req, res) => {
  res.json({
    system: 'SpeedWave WiFi Hotspot & Billing Engine',
    version: '2.4.0-stable',
    status: 'online',
    gatewayIp: '192.168.88.1',
    mikrotikStatus: 'connected',
    time: new Date().toISOString()
  });
});

// Serve MikroTik configuration scripts directly
app.use('/mikrotik', express.static(path.join(rootDir, 'mikrotik')));

// Serve Admin Dashboard under /admin
app.use('/admin', express.static(path.join(rootDir, 'admin')));

// Serve Captive Portal static files under /portal and root /
app.use('/portal', express.static(path.join(rootDir, 'portal')));
app.use('/', express.static(path.join(rootDir, 'portal')));

// Catch-all for /api/* routes so they always return JSON and never HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `API route ${req.method} ${req.originalUrl} not found` });
});

// Fallback: If hitting unknown routes, route to portal or admin
app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) {
    res.sendFile(path.join(rootDir, 'admin', 'index.html'));
  } else {
    res.sendFile(path.join(rootDir, 'portal', 'index.html'));
  }
});

app.listen(PORT, HOST, () => {
  console.log(`[WiFi Hotspot System] Server is listening at http://${HOST}:${PORT}`);
  console.log(`- Captive Portal: http://${HOST}:${PORT}/`);
  console.log(`- Admin Dashboard: http://${HOST}:${PORT}/admin`);
  console.log(`- MikroTik Configs: http://${HOST}:${PORT}/mikrotik/hotspot-setup.rsc`);
});
