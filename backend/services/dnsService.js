const dns = require('dns').promises;

async function getDNSInfo(domain) {
  try {
    const [a, aaaa, mx, txt, ns, cname] = await Promise.allSettled([
      dns.resolve4(domain).catch(() => []),
      dns.resolve6(domain).catch(() => []),
      dns.resolveMx(domain).catch(() => []),
      dns.resolveTxt(domain).catch(() => []),
      dns.resolveNs(domain).catch(() => []),
      dns.resolveCname(domain).catch(() => [])
    ]);

    return {
      A: a.status === 'fulfilled' ? a.value : [],
      AAAA: aaaa.status === 'fulfilled' ? aaaa.value : [],
      MX: mx.status === 'fulfilled' ? mx.value : [],
      TXT: txt.status === 'fulfilled' ? txt.value.map(r => r.join('')) : [],
      NS: ns.status === 'fulfilled' ? ns.value : [],
      CNAME: cname.status === 'fulfilled' ? cname.value : []
    };
  } catch (error) {
    throw new Error(`DNS lookup failed: ${error.message}`);
  }
}

module.exports = { getDNSInfo };
