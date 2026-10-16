# =====================================================================
# SpeedWave WiFi Hotspot - MikroTik RouterOS Setup Script (v6 & v7)
# Architecture: Captive Portal + Walled Garden + Bandwidth Profiles
# =====================================================================

:log info "Starting SpeedWave WiFi Hotspot Setup..."

# 1. IP Pool & Address Configuration
/ip pool
add name=hs-pool-1 ranges=192.168.88.10-192.168.88.254

/ip address
add address=192.168.88.1/24 comment="Hotspot Gateway IP" interface=bridge

# 2. Hotspot User Profiles with Bandwidth Throttling (Rate Limits)
/ip hotspot user profile
set [ find default=yes ] idle-timeout=5m keepalive-timeout=2m name=default rate-limit="10M/5M" shared-users=1
add name="1-Hour-Flash" rate-limit="20M/10M" shared-users=1 session-timeout=1h transparent-proxy=no
add name="3-Hours-Boost" rate-limit="35M/15M" shared-users=1 session-timeout=3h transparent-proxy=no
add name="24-Hours-DayPass" rate-limit="50M/25M" shared-users=2 session-timeout=1d transparent-proxy=no
add name="7-Days-Explorer" rate-limit="60M/30M" shared-users=3 session-timeout=7d transparent-proxy=no
add name="30-Days-Monthly" rate-limit="100M/50M" shared-users=5 session-timeout=30d transparent-proxy=no
add name="Trial-15Min" rate-limit="10M/3M" shared-users=1 session-timeout=15m transparent-proxy=no

# 3. Hotspot Server Profile
/ip hotspot profile
add dns-name="wifi.hotspot" \
    hotspot-address=192.168.88.1 \
    html-directory=hotspot \
    http-cookie-lifetime=1d \
    login-by=cookie,http-chap,http-pap \
    name=hsprof-speedwave \
    use-radius=no

# 4. Hotspot Server Instance
/ip hotspot
add address-pool=hs-pool-1 disabled=no interface=bridge name=speedwave-hotspot profile=hsprof-speedwave

# 5. Walled Garden Entries (Allow access to payment gateways before login)
/ip hotspot walled-garden
add comment="Allow Captive Portal Backend" dst-host="*.run.app"
add comment="Allow Safaricom M-Pesa" dst-host="*.safaricom.co.ke"
add comment="Allow Daraja API" dst-host="api.safaricom.co.ke"
add comment="Allow Airtel Money" dst-host="*.airtel.com"
add comment="Allow Stripe Payments" dst-host="*.stripe.com"
add comment="Allow PayPal" dst-host="*.paypal.com"
add comment="Allow Google Fonts & CDNs" dst-host="fonts.googleapis.com"
add comment="Allow Google Fonts Static" dst-host="fonts.gstatic.com"
add comment="Allow CDN Icons" dst-host="cdn.jsdelivr.net"
add comment="Allow Apple Captive Network Assist" dst-host="captive.apple.com"
add comment="Allow Android Captive Detection" dst-host="connectivitycheck.gstatic.com"

# 6. Firewall & NAT Rules
/ip firewall nat
add action=masquerade chain=srcnat comment="Hotspot Masquerade NAT" out-interface=ether1

:log info "SpeedWave WiFi Hotspot Setup Complete!"
