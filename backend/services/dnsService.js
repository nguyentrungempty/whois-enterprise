const dns = require('dns').promises;

async function getDNSInfo(domain) {
  try {
    const [a, aaaa, mx, txt, ns, cname, soa, caa, srv] = await Promise.allSettled([
      dns.resolve4(domain).catch(() => []),
      dns.resolve6(domain).catch(() => []),
      dns.resolveMx(domain).catch(() => []),
      dns.resolveTxt(domain).catch(() => []),
      dns.resolveNs(domain).catch(() => []),
      dns.resolveCname(domain).catch(() => []),
      dns.resolveSoa(domain).catch(() => null),
      dns.resolveCaa(domain).catch(() => []),
      dns.resolveSrv(`_http._tcp.${domain}`).catch(() => [])
    ]);

    // Get PTR records for the A records
    const ptrRecords = [];
    if (a.status === 'fulfilled' && a.value.length > 0) {
      for (const ip of a.value.slice(0, 3)) { // Limit to first 3 IPs
        try {
          const ptr = await dns.reverse(ip).catch(() => []);
          if (ptr.length > 0) {
            ptrRecords.push({ ip, hostnames: ptr });
          }
        } catch (e) {
          // Skip PTR errors
        }
      }
    }

    return {
      A: a.status === 'fulfilled' ? a.value : [],
      AAAA: aaaa.status === 'fulfilled' ? aaaa.value : [],
      MX: mx.status === 'fulfilled' ? mx.value : [],
      TXT: txt.status === 'fulfilled' ? txt.value.map(r => r.join('')) : [],
      NS: ns.status === 'fulfilled' ? ns.value : [],
      CNAME: cname.status === 'fulfilled' ? cname.value : [],
      SOA: soa.status === 'fulfilled' ? soa.value : null,
      CAA: caa.status === 'fulfilled' ? caa.value : [],
      SRV: srv.status === 'fulfilled' ? srv.value : [],
      PTR: ptrRecords
    };
  } catch (error) {
    throw new Error(`DNS lookup failed: ${error.message}`);
  }
}

module.exports = { getDNSInfo };
