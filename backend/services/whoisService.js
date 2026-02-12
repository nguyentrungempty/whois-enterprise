const whois = require('whois');

async function getWhoisInfo(domain) {
  return new Promise((resolve, reject) => {
    whois.lookup(domain, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      const parsed = parseWhoisData(data);
      resolve(parsed);
    });
  });
}

function parseWhoisData(data) {
  const lines = data.split('\n');
  const result = {
    raw: data,
    registrar: null,
    creationDate: null,
    expirationDate: null,
    updatedDate: null,
    status: [],
    nameServers: []
  };

  lines.forEach(line => {
    const lower = line.toLowerCase();
    
    if (lower.includes('registrar:')) {
      result.registrar = line.split(':')[1]?.trim();
    }
    if (lower.includes('creation date:') || lower.includes('created:')) {
      result.creationDate = line.split(':').slice(1).join(':').trim();
    }
    if (lower.includes('expir') && lower.includes('date:')) {
      result.expirationDate = line.split(':').slice(1).join(':').trim();
    }
    if (lower.includes('updated date:') || lower.includes('last updated:')) {
      result.updatedDate = line.split(':').slice(1).join(':').trim();
    }
    if (lower.includes('domain status:') || lower.includes('status:')) {
      const status = line.split(':').slice(1).join(':').trim();
      if (status && !result.status.includes(status)) {
        result.status.push(status);
      }
    }
    if (lower.includes('name server:')) {
      const ns = line.split(':')[1]?.trim();
      if (ns && !result.nameServers.includes(ns)) {
        result.nameServers.push(ns);
      }
    }
  });

  return result;
}

module.exports = { getWhoisInfo };
