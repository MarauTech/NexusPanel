import dns from 'dns/promises';
import net from 'net';
import http from 'http';
import https from 'https';
import axios from 'axios';
import config from '../config/index.js';

// Blocked metadata / loopback / dangerous IP addresses
const BLOCKED_EXACT_IPS = new Set([
  '169.254.169.254', // Cloud Metadata (AWS, GCP, Azure, DigitalOcean)
  '169.254.170.2',   // AWS ECS Task Metadata
  '100.100.100.200', // Tailscale metadata
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '::',
  '255.255.255.255'
]);

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
  'instance-data',
  'kubernetes.default',
  'kubernetes.default.svc',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback'
]);

// Normalize non-standard decimal, hex, or octal IP strings to canonical dotted-decimal
export function normalizeIpString(rawHost) {
  let host = rawHost.trim().toLowerCase().replace(/^\[|\]$/g, '');

  // If host contains userinfo (e.g. user:pass@127.0.0.1), strip it
  if (host.includes('@')) {
    host = host.split('@').pop();
  }

  // 1. Single integer decimal IP (e.g. 2130706433 -> 127.0.0.1)
  if (/^\d+$/.test(host)) {
    const num = parseInt(host, 10);
    if (num >= 0 && num <= 0xFFFFFFFF) {
      return [
        (num >>> 24) & 0xFF,
        (num >>> 16) & 0xFF,
        (num >>> 8) & 0xFF,
        num & 0xFF
      ].join('.');
    }
  }

  // 2. Single hex integer (e.g. 0x7f000001 -> 127.0.0.1)
  if (/^0x[0-9a-f]+$/i.test(host)) {
    const num = parseInt(host, 16);
    if (num >= 0 && num <= 0xFFFFFFFF) {
      return [
        (num >>> 24) & 0xFF,
        (num >>> 16) & 0xFF,
        (num >>> 8) & 0xFF,
        num & 0xFF
      ].join('.');
    }
  }

  // 3. Octal or hex dotted quad (e.g. 0177.0.0.1 or 0x7f.0.0.1)
  const parts = host.split('.');
  if (parts.length === 4) {
    const normalizedParts = [];
    for (const p of parts) {
      let val;
      if (/^0x[0-9a-f]+$/i.test(p)) {
        val = parseInt(p, 16);
      } else if (/^0[0-7]+$/.test(p) && p !== '0') {
        val = parseInt(p, 8);
      } else if (/^\d+$/.test(p)) {
        val = parseInt(p, 10);
      } else {
        return host; // Not an IP format
      }
      if (val < 0 || val > 255) return host;
      normalizedParts.push(val);
    }
    return normalizedParts.join('.');
  }

  return host;
}

// Convert IPv4 string to 32-bit integer
function ipToInt(ip) {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

// Check if IP is in CIDR subnet
export function isIpInCidr(ip, cidr) {
  if (!net.isIPv4(ip)) return false;
  if (!cidr.includes('/')) cidr = `${cidr}/32`;
  const [range, bits = '32'] = cidr.split('/');
  if (!net.isIPv4(range)) return false;
  const mask = bits === '0' ? 0 : (~0 << (32 - parseInt(bits, 10))) >>> 0;
  return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
}

// Detect loopback, link-local, cloud metadata, multicast, broadcast
export function isDangerousOrReservedIp(rawIp) {
  const ip = normalizeIpString(rawIp);

  if (BLOCKED_EXACT_IPS.has(ip)) return true;

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fe80:')) return true; // Link-local
    if (lower.startsWith('fd00:ec2::')) return true; // AWS IPv6 metadata
    if (lower.startsWith('ff')) return true; // Multicast
    
    // Check IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1)
    if (lower.startsWith('::ffff:')) {
      const v4 = lower.substring(7);
      return isDangerousOrReservedIp(v4);
    }
    return false;
  }

  // IPv4 checks
  if (net.isIPv4(ip)) {
    // 127.0.0.0/8 (Loopback)
    if (isIpInCidr(ip, '127.0.0.0/8')) return true;
    // 169.254.0.0/16 (Link-Local & Cloud Metadata)
    if (isIpInCidr(ip, '169.254.0.0/16')) return true;
    // 0.0.0.0/8 (Current network)
    if (isIpInCidr(ip, '0.0.0.0/8')) return true;
    // 100.64.0.0/10 (Carrier-Grade NAT / Shared Address Space)
    if (isIpInCidr(ip, '100.64.0.0/10')) return true;
    // 198.18.0.0/15 (Benchmark / Inter-network communications)
    if (isIpInCidr(ip, '198.18.0.0/15')) return true;
    // 224.0.0.0/4 (Multicast)
    if (isIpInCidr(ip, '224.0.0.0/4')) return true;
    // 240.0.0.0/4 (Reserved / Broadcast)
    if (isIpInCidr(ip, '240.0.0.0/4')) return true;
    return false;
  }

  return true; // If not valid IPv4 or IPv6, treat as dangerous/invalid
}

// Check if IP is in RFC1918 private ranges (10.x, 172.16-31.x, 192.168.x)
export function isRfc1918PrivateIp(ip) {
  const normalized = normalizeIpString(ip);
  if (!net.isIPv4(normalized)) return false;
  return (
    isIpInCidr(normalized, '10.0.0.0/8') ||
    isIpInCidr(normalized, '172.16.0.0/12') ||
    isIpInCidr(normalized, '192.168.0.0/16')
  );
}

// Validate a target host / IP address
export async function validateDestinationHost(rawHost, allowPrivateHomelab = true) {
  const host = normalizeIpString(rawHost);

  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new Error(`Access to blocked hostname '${host}' is forbidden (SSRF protection)`);
  }

  let resolvedIps = [];

  if (net.isIP(host)) {
    resolvedIps = [host];
  } else {
    try {
      const addresses = await dns.resolve4(host);
      if (addresses && addresses.length > 0) {
        resolvedIps.push(...addresses);
      }
    } catch (err) {
      // Try v6
      try {
        const v6 = await dns.resolve6(host);
        if (v6 && v6.length > 0) resolvedIps.push(...v6);
      } catch (e) {
        throw new Error(`Cannot resolve destination host '${host}'`);
      }
    }
  }

  if (resolvedIps.length === 0) {
    throw new Error(`Cannot resolve host '${host}'`);
  }

  // Check all resolved IPs
  for (const ip of resolvedIps) {
    if (isDangerousOrReservedIp(ip)) {
      throw new Error(`Access to restricted IP '${ip}' (resolved from '${host}') is forbidden (SSRF protection)`);
    }

    if (!allowPrivateHomelab && isRfc1918PrivateIp(ip)) {
      throw new Error(`Access to private network IP '${ip}' is not permitted`);
    }
  }

  return { host, resolvedIp: resolvedIps[0], allIps: resolvedIps };
}

// Safe HTTP client with strict timeouts, content size limits, and redirect inspection
export async function safeHttpRequest(targetUrl, options = {}) {
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (err) {
    throw new Error(`Invalid URL format: '${targetUrl}'`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Disallowed protocol '${parsed.protocol}'. Only http: and https: are allowed.`);
  }

  // Strip userinfo
  if (parsed.username || parsed.password) {
    parsed.username = '';
    parsed.password = '';
  }

  // Validate hostname
  await validateDestinationHost(parsed.hostname, true);

  const timeoutMs = options.timeout || 5000;
  const maxContentLength = options.maxContentLength || 5 * 1024 * 1024; // 5MB limit
  const verifySsl = options.verifySsl !== false; // Strict SSL by default

  const agent = parsed.protocol === 'https:'
    ? new https.Agent({ rejectUnauthorized: verifySsl })
    : new http.Agent();

  const instance = axios.create({
    timeout: timeoutMs,
    maxContentLength,
    maxBodyLength: maxContentLength,
    maxRedirects: 0, // Prevent uninspected redirect loops / open redirect SSRF
    httpAgent: agent,
    httpsAgent: agent
  });

  return instance.request({
    url: parsed.toString(),
    method: options.method || 'GET',
    headers: options.headers || {},
    data: options.data,
    validateStatus: options.validateStatus || ((status) => status >= 200 && status < 400)
  });
}
