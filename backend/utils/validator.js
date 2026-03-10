function isValidDomain(domain) {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  domain = domain.trim().toLowerCase();

  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    domain = domain.replace(/^https?:\/\//, '');
  }

  // Remove www. prefix
  if (domain.startsWith('www.')) {
    domain = domain.substring(4);
  }

  domain = domain.split('/')[0];
  
  // Remove port if present
  domain = domain.split(':')[0];

  if (domain.length > 253) {
    return false;
  }

  return domainRegex.test(domain);
}

function extractDomain(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  input = input.trim().toLowerCase();

  // Remove protocol
  if (input.startsWith('http://') || input.startsWith('https://')) {
    input = input.replace(/^https?:\/\//, '');
  }

  // Remove www. prefix
  if (input.startsWith('www.')) {
    input = input.substring(4);
  }

  // Remove path, query, hash
  input = input.split('/')[0];
  input = input.split('?')[0];
  input = input.split('#')[0];
  
  // Remove port if present
  input = input.split(':')[0];

  return input;
}

function extractRootDomain(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // First extract the domain (remove URL parts)
  let domain = extractDomain(input);
  if (!domain) return null;

  // Split domain into parts
  const parts = domain.split('.');
  
  // If less than 2 parts, invalid domain
  if (parts.length < 2) {
    return domain;
  }

  // List of known second-level domains (SLDs)
  const secondLevelDomains = [
    'com', 'net', 'org', 'edu', 'gov', 'mil', 'co', 'ac', 'sch',
    // Country-specific SLDs
    'com.vn', 'net.vn', 'org.vn', 'edu.vn', 'gov.vn', 'int.vn', 'ac.vn', 'pro.vn', 'info.vn', 'health.vn', 'name.vn', 'biz.vn',
    'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'asn.au', 'id.au',
    'co.uk', 'org.uk', 'me.uk', 'ac.uk', 'gov.uk',
    'co.jp', 'or.jp', 'ne.jp', 'ac.jp', 'go.jp',
    'co.kr', 'or.kr', 'ne.kr', 'ac.kr', 'go.kr',
    'com.cn', 'net.cn', 'org.cn', 'edu.cn', 'gov.cn',
    'com.tw', 'net.tw', 'org.tw', 'edu.tw', 'gov.tw',
    'com.hk', 'net.hk', 'org.hk', 'edu.hk', 'gov.hk',
    'com.sg', 'net.sg', 'org.sg', 'edu.sg', 'gov.sg',
    'com.my', 'net.my', 'org.my', 'edu.my', 'gov.my',
    'co.id', 'net.id', 'or.id', 'ac.id', 'go.id',
    'co.th', 'net.th', 'or.th', 'ac.th', 'go.th',
    'com.ph', 'net.ph', 'org.ph', 'edu.ph', 'gov.ph'
  ];

  // Check if domain has a known second-level domain
  if (parts.length >= 3) {
    const lastTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (secondLevelDomains.includes(lastTwo)) {
      // For example: demo.linhni.com.vn -> linhni.com.vn
      return `${parts[parts.length - 3]}.${lastTwo}`;
    }
  }

  // Default: return last 2 parts
  // For example: demo.linhni.com -> linhni.com
  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
}

module.exports = { isValidDomain, extractDomain, extractRootDomain };

