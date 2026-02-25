const https = require('https');
const tls = require('tls');

async function getSSLInfo(domain) {
  return new Promise((resolve, reject) => {
    const options = {
      host: domain,
      port: 443,
      method: 'GET',
      rejectUnauthorized: false,
      agent: false
    };

    const req = https.get(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      
      if (!cert || Object.keys(cert).length === 0) {
        resolve({
          hasSSL: false,
          error: 'Không tìm thấy chứng chỉ SSL'
        });
        return;
      }

      const now = new Date();
      const validFrom = new Date(cert.valid_from);
      const validTo = new Date(cert.valid_to);
      const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

      resolve({
        hasSSL: true,
        issuer: cert.issuer?.O || 'Unknown',
        subject: cert.subject?.CN || domain,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        daysRemaining: daysRemaining,
        isValid: now >= validFrom && now <= validTo,
        protocol: res.socket.getProtocol(),
        cipher: res.socket.getCipher()
      });

      res.socket.end();
    });

    req.on('error', (error) => {
      resolve({
        hasSSL: false,
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        hasSSL: false,
        error: 'Connection timeout'
      });
    });
  });
}

module.exports = { getSSLInfo };
