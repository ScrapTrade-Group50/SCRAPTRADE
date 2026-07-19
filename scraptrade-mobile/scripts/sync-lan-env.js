/**
 * Detects the active LAN IPv4 (default-route interface) and writes EXPO_PUBLIC_API_URL to .env
 */
const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const API_PORT = process.env.SCRAPTRADE_API_PORT || '8080';

function isPrivateLan(ip) {
  if (!ip || ip.includes(':')) return false;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 192 && parts[1] === 168) {
    if (parts[2] === 56) return false;
    if (parts[2] === 137 && parts[3] === 1) return false;
    return true;
  }
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
}

function getActiveLanIpWindows() {
  const ps =
    "(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up' } | Sort-Object InterfaceMetric | Select-Object -First 1).IPv4Address.IPAddress";
  const ip = execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], {
    encoding: 'utf8',
  }).trim();
  if (ip && isPrivateLan(ip)) return ip;
  return null;
}

function getActiveLanIpUnix() {
  try {
    const ip = execSync(
      "ip route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i==\"src\") print $(i+1)}'",
      { encoding: 'utf8', shell: true }
    ).trim();
    if (ip && isPrivateLan(ip)) return ip;
  } catch {
    /* fall through */
  }
  return null;
}

function getActiveLanIpFromInterfaces() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const entries of Object.values(nets)) {
    for (const entry of entries) {
      if (entry.internal || entry.family !== 'IPv4') continue;
      if (isPrivateLan(entry.address)) candidates.push(entry.address);
    }
  }
  return candidates[0] || null;
}

function getActiveLanIp() {
  let ip = null;
  if (process.platform === 'win32') ip = getActiveLanIpWindows();
  else ip = getActiveLanIpUnix();
  if (!ip) ip = getActiveLanIpFromInterfaces();
  if (!ip) {
    console.error('Could not detect a LAN IPv4 address. Connect to Wi‑Fi or Ethernet and try again.');
    process.exit(1);
  }
  return ip;
}

function updateEnv(lanIp) {
  const apiUrl = `http://${lanIp}:${API_PORT}/api`;
  const line = `EXPO_PUBLIC_API_URL=${apiUrl}`;

  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  if (/^EXPO_PUBLIC_API_URL=/m.test(content)) {
    content = content.replace(/^EXPO_PUBLIC_API_URL=.*$/m, line);
  } else if (content.length && !content.endsWith('\n')) {
    content += `\n${line}\n`;
  } else {
    content = `${content}${line}\n`;
  }

  fs.writeFileSync(ENV_PATH, content, 'utf8');
  return apiUrl;
}

function main() {
  const lanIp = getActiveLanIp();
  const apiUrl = updateEnv(lanIp);
  console.log(`LAN IP:     ${lanIp}`);
  console.log(`Updated:    ${ENV_PATH}`);
  console.log(`API URL:    ${apiUrl}`);
  console.log('');
  console.log('Restart Expo if it is already running (Ctrl+C, then npm start).');
}

main();
