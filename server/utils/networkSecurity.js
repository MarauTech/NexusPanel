import dns from 'dns/promises';
import net from 'net';
import http from 'http';
import https from 'https';
import axios from 'axios';
import config from '../config/index.js';

// Blocked metadata / loopback / dangerous IP ranges
const BLOCKED_EXACT_IPS = new Set([
  '169.254.169.254', // AWS, GCP, Azure, OpenStack metadata
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
  'kubernetes.default.svc'
]);

// Convert IPv4 string to 32-bit number
function ipToInt(ip) {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

// Check if IP is in CIDR
export function isIpInCidr(ip, cidr) {
  if (!cidr.includes('/')) cidr = `${cidr}/32`;
  const [range, bits = '32'] = cidr.split('/');
  const mask = bits === '0' ? 0 : (~0 << (32 - parseInt(bits, 10))) >>> 0;
  return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
}

// Detect loopback, link-local, cloud metadata, multicast
export function isDangerousOrReservedIp(ip) {
  if (!net.isIP(ip)) return true;

  if (BLOCKED_EXACT_IPS.has(ip)) return true;

  // IPv6 checks
  if (net.isIPv6(ip)) {
    if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') || ip.startsWith('ff')) return true;
    // Check IPv4-mapped IPv6 (::ffff:127.0.0.1)
    if (ip.toLowerCase().startsWith('::ffff:')) {
      const v4 = ip.substring(7);
      if (net.isIPv4(v4)) return isDangerousOrReservedIp(v4);
    }
  }

  // IPv4 checks
  if (net.isIPv4(ip)) {
    // 127.0.0.0/8 (Loopback)
    if (isIpInCidr(ip, '127.0.0.0/8')) return true;
    // 169.254.0.0/16 (Link-Local & Cloud Metadata)
    if (isIpInCidr(ip, '169.254.0.0/16')) return true;
    // 0.0.0.0/8 (Current network)
    if (isIpInCidr(ip, '0.0.0.0/8')) return true;
    // 224.0.0.0/4 (Multicast)
    if (isIpInCidr(ip, '224.0.0.0/4')) return true;
    // 240.0.0.0/4 (Reserved for future use / Broadcast)
    if (isIpInCidr(ip, '240.0.0.0/4')) return true;
  }

  return false;
}

// Check if IP is in RFC1918 private ranges (10.x, 172.16.x, 192.168.x)
export function isRfc1918PrivateIp(ip) {
  if (!net.isIPv4(ip)) return false;
  return (
    isIpInCidr(ip, '10.0.0.0/8') ||
    isIpInCidr(ip, '172.16.0.0/12') ||
    isIpInCidr(ip, '192.168.0.0/16')
  );
}

// Validate a target host / IP address
export async function validateDestinationHost(hostnameOrIp, allowPrivateHomelab = true) {
  const host = hostnameOrIp.toLowerCase().trim().replace(/^\[|\]$/g, '');

  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new Error(`Access to blocked hostname '${host}' is forbidden (SSRF protection)`);
  }

  let resolvedIp = host;
  if (!net.isIP(host)) {
    try {
      const addresses = await dns.resolve4(host);
      if (!addresses || addresses.length === 0) {
        throw new Error(`Cannot resolve hostname '${host}'`);
      }
      resolvedIp = addresses[0];
    } catch (err) {
      // Try resolving v6 if v4 failed
      try {
        const v6 = await dns.resolve6(host);
        if (v6 && v6.length > 0) resolvedIp = v6[0];
        else throw new Error(`DNS resolution failed for '${host}'`);
      } catch (e) {
        throw new Error(`Cannot resolve destination '${host}'`);
      }
    }
  }

  // Strictly block loopback, link-local, cloud metadata
  if (isDangerousOrReservedIp(resolvedIp)) {
    throw new Error(`Access to restricted IP '${resolvedIp}' is forbidden (SSRF protection)`);
  }

  // If private homelab is not allowed, block RFC1918
  if (!allowPrivateHomelab && isRfc1918PrivateIp(resolvedIp)) {
    throw new Error(`Access to private network IP '${resolvedIp}' is not permitted`);
  }

  return { host, resolvedIp };
}

// Safe HTTP Request client with strict timeouts, max response size, and schema enforcement
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

  // Validate hostname against SSRF
  const { resolvedIp } = await validateDestinationHost(parsed.hostname, true);

  const timeoutMs = options.timeout || 5000;
  const maxContentLength = options.maxContentLength || 5 * 1024 * 1024; // 5MB limit
  const verifySsl = options.verifySsl !== false; // Strict SSL by default

  const agent = parsed.protocol === 'https:'
    ? new https.Agent({ rejectUnauthorized: verifySsl })
    : new http.Agent();

  return axios({
    url: targetUrl,
    method: options.method || 'GET',
    headers: options.headers || {},
    data: options.data,
    timeout: timeoutMs,
    maxContentLength,
    maxBodyLength: maxContentLength,
    maxRedirects: 3,
    httpAgent: agent,
    httpsAgent: agent,
    validateStatus: options.validateStatus || ((status) => status >= 200 && status < 400)
  });
}
