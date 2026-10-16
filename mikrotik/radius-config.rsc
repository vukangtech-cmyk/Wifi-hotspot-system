# =====================================================================
# SpeedWave WiFi Hotspot - RADIUS & Central Billing Integration
# RouterOS RADIUS Client & CoA (Change of Authorization) Config
# =====================================================================

:log info "Configuring RADIUS Authentication & Accounting..."

# 1. Enable RADIUS in Hotspot Server Profile
/ip hotspot profile
set [ find name=hsprof-speedwave ] use-radius=yes radius-accounting=yes radius-interim-update=2m

# 2. Add RADIUS Server Integration
/radius
add address=192.168.88.1 comment="SpeedWave Central Billing API" \
    service=hotspot,wireless \
    secret="SpeedWaveSecretKey2026!" \
    authentication-port=1812 \
    accounting-port=1813 \
    timeout=3000ms

# 3. Configure RADIUS Incoming CoA (Change of Authorization for Dynamic Kicks/Bandwidth Changes)
/radius incoming
set accept=yes port=3799

# 4. User Manager (Optional Built-in FreeRADIUS Server on RouterOS)
# /tool user-manager customer
# add login=admin password="AdminPassword2026" permissions=owner

:log info "RADIUS & Central Accounting Configuration Applied!"
