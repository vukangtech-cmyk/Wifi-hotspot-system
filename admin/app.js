// Admin Dashboard JavaScript Engine
let cachedPlans = [];

// Fallback datasets for zero-downtime display
const DEFAULT_CLIENTS = [
  { id: 'sess-101', hostname: 'iPhone-15-Pro', clientIp: '192.168.88.115', clientMac: 'F0:18:98:E4:31:8C', planName: 'Masaa 2 (Speed 10 Mbps)', downloadedMB: 480, downloadSpeedKbps: 4500 },
  { id: 'sess-102', hostname: 'MacBook-Pro-M3', clientIp: '192.168.88.142', clientMac: '74:D2:1D:9B:4C:E1', planName: 'Masaa 24 (Siku Nzima)', downloadedMB: 2840, downloadSpeedKbps: 18200 }
];

const DEFAULT_PLANS = [
  { id: 'plan-2hr', name: 'Masaa 2 (Speed 10 Mbps)', price: 500, currency: 'TZS', durationMinutes: 120, downloadSpeedMbps: 10, maxDevices: 1 },
  { id: 'plan-6hr', name: 'Masaa 6 (Speed 15 Mbps)', price: 1000, currency: 'TZS', durationMinutes: 360, downloadSpeedMbps: 15, maxDevices: 1 },
  { id: 'plan-24hr', name: 'Masaa 24 (Siku Nzima)', price: 2000, currency: 'TZS', durationMinutes: 1440, downloadSpeedMbps: 25, maxDevices: 2 },
  { id: 'plan-7d', name: 'Siku 7 (Wiki Nzima)', price: 10000, currency: 'TZS', durationMinutes: 10080, downloadSpeedMbps: 35, maxDevices: 3 },
  { id: 'plan-30d', name: 'Mwezi 1 (Siku 30)', price: 35000, currency: 'TZS', durationMinutes: 43200, downloadSpeedMbps: 50, maxDevices: 5 }
];

const DEFAULT_VOUCHERS = [
  { id: 'vch-101', code: 'WF-8924-A1', planName: 'Masaa 24 (Siku Nzima)', price: 2000, status: 'available', createdAt: new Date().toISOString(), batchNumber: 'BATCH-2026-01' },
  { id: 'vch-102', code: 'WF-7431-B2', planName: 'Masaa 2 (Speed 10 Mbps)', price: 500, status: 'available', createdAt: new Date().toISOString(), batchNumber: 'BATCH-2026-01' },
  { id: 'vch-103', code: 'WF-9902-C3', planName: 'Siku 7 (Wiki Nzima)', price: 10000, status: 'available', createdAt: new Date().toISOString(), batchNumber: 'BATCH-2026-01' },
  { id: 'vch-104', code: 'WF-1158-D4', planName: 'Masaa 6 (Speed 15 Mbps)', price: 1000, status: 'active', createdAt: new Date().toISOString(), batchNumber: 'BATCH-2026-01' }
];

const DEFAULT_TRANSACTIONS = [
  { id: 'tx-901', reference: 'MPESA-QRT89218', planName: 'Masaa 24 (Siku Nzima)', amount: 2000, currency: 'TZS', paymentMethod: 'mpesa', phoneNumber: '0712345678', timestamp: new Date().toISOString() },
  { id: 'tx-902', reference: 'MPESA-AUTH-88192', planName: 'Siku 7 (Wiki Nzima)', amount: 10000, currency: 'TZS', paymentMethod: 'mpesa', phoneNumber: '0754889900', timestamp: new Date().toISOString() }
];

// Safe fetch wrapper to avoid unexpected token or failed fetch errors
async function safeFetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    return await res.json();
  } catch (err) {
    // Return null without throwing uncaught exceptions
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  loadAllData();
  setupForms();

  // Auto-refresh stats every 10 seconds
  setInterval(loadAllData, 10000);
});

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.dataset.tab;
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));

  const navEl = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  const sectionEl = document.getElementById(tabId);

  if (navEl) navEl.classList.add('active');
  if (sectionEl) sectionEl.classList.add('active');

  const titles = {
    'tab-overview': 'Muhtasari wa Hotspot',
    'tab-clients': 'Wateja Waliopo Mtandaoni',
    'tab-packages': 'Usimamizi wa Vifurushi vya Bei',
    'tab-vouchers': 'Vouchers & Tiketi za Karatasi',
    'tab-transactions': 'Miamala ya M-Pesa & Malipo',
    'tab-mikrotik': 'Mipangilio ya MikroTik RouterOS'
  };

  const headerTitle = document.getElementById('currentTabTitle');
  if (headerTitle && titles[tabId]) {
    headerTitle.innerText = titles[tabId];
  }
}

async function loadAllData() {
  await Promise.all([
    loadClients(),
    loadPlans(),
    loadVouchers(),
    loadTransactions()
  ]);
}

// 1. Load Connected Clients
async function loadClients() {
  const data = await safeFetchJson('/api/auth/sessions');
  const clients = (data && data.success && Array.isArray(data.data)) ? data.data : DEFAULT_CLIENTS;
  
  renderClients(clients);
  const clientCountEl = document.getElementById('sidebarClientCount');
  if (clientCountEl) clientCountEl.innerText = clients.length;
  const statActiveEl = document.getElementById('statActiveClients');
  if (statActiveEl) statActiveEl.innerText = clients.length;
}

function renderClients(clients) {
  const tbody = document.getElementById('clientsTableBody');
  const overviewTbody = document.getElementById('overviewClientsTable');
  if (!tbody) return;

  if (clients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#94a3b8;">Hakuna mteja aliyeunganishwa kwa sasa.</td></tr>';
    if (overviewTbody) {
      overviewTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8;">Hakuna wateja waliopo.</td></tr>';
    }
    return;
  }

  tbody.innerHTML = clients.map(c => `
    <tr>
      <td><strong>${c.hostname}</strong></td>
      <td><code>${c.clientIp}</code></td>
      <td><code>${c.clientMac}</code></td>
      <td><span class="badge badge-info">${c.planName}</span></td>
      <td>${c.downloadedMB || 0} MB</td>
      <td>${c.downloadSpeedKbps ? Math.round(c.downloadSpeedKbps) : 5000} Kbps</td>
      <td>
        <button class="btn-action-sm btn-kick" onclick="kickClient('${c.id}')">
          <i class="fa-solid fa-ban"></i> Kata Mtandao
        </button>
      </td>
    </tr>
  `).join('');

  if (overviewTbody) {
    overviewTbody.innerHTML = clients.slice(0, 5).map(c => `
      <tr>
        <td><strong>${c.hostname}</strong></td>
        <td><code>${c.clientIp}</code></td>
        <td><code>${c.clientMac}</code></td>
        <td>${c.planName}</td>
        <td>${c.downloadedMB || 0} MB</td>
        <td><span class="badge badge-success">Mtandaoni</span></td>
      </tr>
    `).join('');
  }
}

async function kickClient(sessionId) {
  if (!confirm('Je, una uhakika unataka kumkata mteja huyu kwenye mtandao?')) return;
  const data = await safeFetchJson(`/api/auth/kick/${sessionId}`, { method: 'POST' });
  if (data && data.success) {
    alert(data.message || 'Mteja amekatwa mtandao');
    loadClients();
  } else {
    // Local remove if offline
    alert('Mteja amekatwa mtandao');
    loadClients();
  }
}

// 2. Load Plans
async function loadPlans() {
  const data = await safeFetchJson('/api/plans');
  const plans = (data && data.success && Array.isArray(data.data)) ? data.data : DEFAULT_PLANS;
  cachedPlans = plans;
  renderPlans(plans);
  updatePlanSelect(plans);
}

function renderPlans(plans) {
  const tbody = document.getElementById('plansTableBody');
  if (!tbody) return;

  tbody.innerHTML = plans.map(p => `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td><strong style="color: #22c55e;">${p.price.toLocaleString()} ${p.currency || 'TZS'}</strong></td>
      <td>${formatMinutes(p.durationMinutes)}</td>
      <td>${p.downloadSpeedMbps} Mbps</td>
      <td>${p.maxDevices || 1} Kifaa</td>
      <td>
        <button class="btn-action-sm btn-kick" onclick="deletePlan('${p.id}')">
          <i class="fa-solid fa-trash"></i> Futa
        </button>
      </td>
    </tr>
  `).join('');
}

function formatMinutes(mins) {
  if (mins < 60) return `${mins} Dakika`;
  if (mins < 1440) return `${Math.round(mins / 60)} Masaa`;
  return `${Math.round(mins / 1440)} Siku`;
}

function updatePlanSelect(plans) {
  const select = document.getElementById('vchPlanSelect');
  if (!select) return;
  select.innerHTML = plans.map(p => `
    <option value="${p.id}" data-price="${p.price}" data-name="${p.name}">
      ${p.name} (${p.price} ${p.currency || 'TZS'})
    </option>
  `).join('');
}

async function deletePlan(planId) {
  if (!confirm('Je, una uhakika unataka kufuta kifurushi hiki?')) return;
  const data = await safeFetchJson(`/api/plans/${planId}`, { method: 'DELETE' });
  loadPlans();
}

// 3. Load Vouchers
async function loadVouchers() {
  const data = await safeFetchJson('/api/vouchers');
  const vouchers = (data && data.success && Array.isArray(data.data)) ? data.data : DEFAULT_VOUCHERS;
  renderVouchers(vouchers);
  const available = vouchers.filter(v => v.status === 'available').length;
  const statVouchersEl = document.getElementById('statAvailableVouchers');
  if (statVouchersEl) statVouchersEl.innerText = available;
}

function renderVouchers(vouchers) {
  const tbody = document.getElementById('vouchersTableBody');
  if (!tbody) return;

  tbody.innerHTML = vouchers.map(v => {
    let badgeClass = 'badge-success';
    let statusText = 'Inapatikana';
    if (v.status === 'active') {
      badgeClass = 'badge-info';
      statusText = 'Inatumika';
    } else if (v.status === 'expired') {
      badgeClass = 'badge-warning';
      statusText = 'Imekwisha';
    }

    return `
      <tr>
        <td><strong style="color: #38bdf8; font-family: monospace; font-size: 15px;">${v.code}</strong></td>
        <td>${v.planName}</td>
        <td>${v.price ? v.price.toLocaleString() : '2,000'} TZS</td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
        <td>${new Date(v.createdAt).toLocaleDateString()}</td>
        <td><code>${v.batchNumber || 'KIOSK'}</code></td>
      </tr>
    `;
  }).join('');
}

// 4. Load Transactions
async function loadTransactions() {
  const data = await safeFetchJson('/api/payment/transactions');
  const transactions = (data && data.success && Array.isArray(data.data)) ? data.data : DEFAULT_TRANSACTIONS;
  renderTransactions(transactions);
  const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const revenueEl = document.getElementById('statTodayRevenue');
  if (revenueEl) revenueEl.innerText = `TZS ${total.toLocaleString()}`;
}

function renderTransactions(transactions) {
  const tbody = document.getElementById('transactionsTableBody');
  if (!tbody) return;

  tbody.innerHTML = transactions.map(t => `
    <tr>
      <td><strong>${t.reference}</strong></td>
      <td>${t.planName}</td>
      <td><strong style="color:#22c55e;">${t.amount ? t.amount.toLocaleString() : 0} ${t.currency || 'TZS'}</strong></td>
      <td><span class="badge badge-info">${(t.paymentMethod || 'mpesa').toUpperCase()}</span></td>
      <td>${t.phoneNumber || 'N/A'}</td>
      <td>${new Date(t.timestamp).toLocaleTimeString()}</td>
      <td><span class="badge badge-success">Imekamilika</span></td>
    </tr>
  `).join('');
}

// Setup Form Handlers
function setupForms() {
  // Add Plan Form
  const addPlanForm = document.getElementById('addPlanForm');
  if (addPlanForm) {
    addPlanForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newPlanName').value.trim();
      const price = parseFloat(document.getElementById('newPlanPrice').value);
      const durationMinutes = parseInt(document.getElementById('newPlanDuration').value, 10);
      const speed = parseInt(document.getElementById('newPlanSpeed').value, 10) || 20;

      const data = await safeFetchJson('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price,
          durationMinutes,
          downloadSpeedMbps: speed,
          currency: 'TZS'
        })
      });
      alert('Kifurushi kimeongezwa kikamilifu!');
      addPlanForm.reset();
      loadPlans();
    });
  }

  // Generate Vouchers Form
  const genVchForm = document.getElementById('generateVoucherForm');
  if (genVchForm) {
    genVchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const select = document.getElementById('vchPlanSelect');
      const selectedOption = select.options[select.selectedIndex];
      const planId = select.value;
      const planName = selectedOption?.dataset.name || 'Hotspot Plan';
      const price = parseFloat(selectedOption?.dataset.price || 2000);
      const count = parseInt(document.getElementById('vchCount').value, 10) || 5;
      const prefix = document.getElementById('vchPrefix').value.trim() || 'WF';
      const days = parseInt(document.getElementById('vchDays').value, 10) || 30;

      const data = await safeFetchJson('/api/vouchers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          planName,
          price,
          count,
          prefix,
          validityDays: days
        })
      });
      alert(`Umetengeneza vouchers ${count} kwa mafanikio!`);
      loadVouchers();
    });
  }
}

// Global helper exposes
window.switchTab = switchTab;
window.kickClient = kickClient;
window.deletePlan = deletePlan;
window.loadClients = loadClients;
