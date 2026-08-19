import net from 'net';

/**
 * Ping / TCP Socket Probe Service
 * Performs raw connection checks to IP addresses or hostnames with custom ports.
 * Ideal for network switches, printers, cameras, and local homelab devices without HTTP servers.
 */
export async function probeTcpOrPing(targetHost, targetPort = 80, timeoutMs = 3000) {
  return new Promise((resolve) => {
    let cleanHost = targetHost;
    let cleanPort = targetPort || 80;

    // If a full URL is passed, parse out hostname and port
    if (cleanHost.includes('://')) {
      try {
        const u = new URL(cleanHost);
        cleanHost = u.hostname;
        cleanPort = u.port ? parseInt(u.port, 10) : (u.protocol === 'https:' ? 443 : 80);
      } catch (e) {
        // use raw host
      }
    } else if (cleanHost.includes(':')) {
      const parts = cleanHost.split(':');
      cleanHost = parts[0];
      cleanPort = parseInt(parts[1], 10) || 80;
    }

    const startTime = Date.now();
    const socket = new net.Socket();

    let resolved = false;

    const finalize = (status, responseTime, error = null) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve({
        status,
        responseTime,
        error,
        host: cleanHost,
        port: cleanPort,
        checkedAt: new Date().toISOString()
      });
    };

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      const responseTime = Date.now() - startTime;
      const status = responseTime < 1000 ? 'online' : 'degraded';
      finalize(status, responseTime);
    });

    socket.on('timeout', () => {
      finalize('offline', null, `Connection timed out (${timeoutMs}ms)`);
    });

    socket.on('error', (err) => {
      // If connection was refused by port, host is technically alive and online on network
      if (err.code === 'ECONNREFUSED') {
        const responseTime = Date.now() - startTime;
        finalize('online', responseTime, 'Port closed but host is responding');
      } else {
        finalize('offline', null, err.message || 'Host unreachable');
      }
    });

    try {
      socket.connect(cleanPort, cleanHost);
    } catch (err) {
      finalize('offline', null, err.message);
    }
  });
}
