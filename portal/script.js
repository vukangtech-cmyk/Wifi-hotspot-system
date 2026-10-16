const API_BASE = 'https://api.jinaLako.co.tz'; // Badilisha baadaye

let state = {
  packages: [],
  selectedPackage: null,
  phone: '',
  checkoutId: null,
  pollTimer: null,
};

// ============ 1. PAKUA PACKAGES ============
async function loadPackages() {
  try {
    const res = await fetch(`${API_BASE}/api/packages`);
    state.packages = await res.json();
  } catch (e) {
    try {
      const localRes = await fetch('/api/packages');
      state.packages = await localRes.json();
    } catch (err) {
      // Fallback kwa demo
      state.packages = [
        { id: 1, name: 'Saa 1', price: 200, duration_hours: 1 },
        { id: 2, name: 'Siku 1', price: 1000, duration_hours: 24 },
        { id: 3, name: 'Wiki 1', price: 5000, duration_hours: 168 },
        { id: 4, name: 'Mwezi 1', price: 15000, duration_hours: 720 },
      ];
    }
  }
  renderPackages();
}

function renderPackages() {
  const list = document.getElementById('packageList');
  list.innerHTML = state.packages.map(p => `
    <div class="pkg" data-id="${p.id}" data-price="${p.price}" data-hours="${p.duration_hours}">
      <span class="pkg-name">${p.name}</span>
      <span class="pkg-price">TZS ${p.price.toLocaleString()}</span>
    </div>
  `).join('');

  document.querySelectorAll('.pkg').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.pkg').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      state.selectedPackage = {
        id: parseInt(el.dataset.id),
        price: parseInt(el.dataset.price),
        hours: parseInt(el.dataset.hours),
      };
      document.getElementById('nextBtn').disabled = false;
    });
  });
}

// ============ 2. NAVIGATION ============
function showStep(id) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}
function goBack() { showStep('step-package'); }
window.goBack = goBack;

document.getElementById('nextBtn').addEventListener('click', () => {
  showStep('step-phone');
});

// ============ 3. MALIPO ============
document.getElementById('payBtn').addEventListener('click', async () => {
  const phone = document.getElementById('phone').value.trim();
  if (!/^0[67]\d{8}$/.test(phone)) {
    alert('Weka namba sahihi (mfano 0712345678)');
    return;
  }
  state.phone = phone;

  showStep('step-waiting');
  startCountdown(180); // Dakika 3

  try {
    let data;
    try {
      const res = await fetch(`${API_BASE}/api/payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          packageId: state.selectedPackage.id,
          macAddress: getMacAddress(),
        }),
      });
      data = await res.json();
    } catch (e) {
      // Fallback kwa demo / local server
      const localRes = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          packageId: state.selectedPackage.id,
          macAddress: getMacAddress(),
        }),
      });
      data = await localRes.json();
    }

    if (!data.success) throw new Error(data.message || 'Imeshindikana');

    state.checkoutId = data.checkoutRequestId;
    pollPaymentStatus();
  } catch (err) {
    showStep('step-failed');
    document.getElementById('failMsg').textContent = err.message || 'Hitilafu ya mtandao';
  }
});

// ============ 4. POLLING MALIPO ============
function pollPaymentStatus() {
  state.pollTimer = setInterval(async () => {
    try {
      let res;
      try {
        res = await fetch(`${API_BASE}/api/payment/status/${state.checkoutId}`);
      } catch (err) {
        res = await fetch(`/api/payment/status/${state.checkoutId}`);
      }
      const data = await res.json();

      if (data.status === 'success') {
        clearInterval(state.pollTimer);
        clearInterval(window._countdown);
        showStep('step-success');
        document.getElementById('successMsg').textContent =
          `Umepata ${state.selectedPackage.hours} saa za internet.`;
        // Redirect kwa RADIUS authorization (baadaye)
      } else if (data.status === 'failed') {
        clearInterval(state.pollTimer);
        clearInterval(window._countdown);
        showStep('step-failed');
        document.getElementById('failMsg').textContent = 'Malipo hayakufanikiwa.';
      }
    } catch (e) { /* endelea polling */ }
  }, 3000);
}

// ============ 5. COUNTDOWN ============
function startCountdown(seconds) {
  let remaining = seconds;
  const el = document.getElementById('timer');
  el.textContent = formatTime(remaining);
  window._countdown = setInterval(() => {
    remaining--;
    el.textContent = formatTime(remaining);
    if (remaining <= 0) {
      clearInterval(window._countdown);
      clearInterval(state.pollTimer);
      showStep('step-failed');
      document.getElementById('failMsg').textContent = 'Muda wa malipo umeisha.';
    }
  }, 1000);
}
function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// ============ 6. MAC ADDRESS ============
function getMacAddress() {
  // MikroTik inatuma MAC kupitia URL parameter
  const params = new URLSearchParams(window.location.search);
  return params.get('mac') || 'AA:BB:CC:DD:EE:FF';
}

// ============ START ============
loadPackages();
