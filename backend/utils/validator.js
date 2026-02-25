function isValidDomain(domain) {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  domain = domain.trim().toLowerCase();

  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    domain = domain.replace(/^https?:\/\//, '');
  }

  domain = domain.split('/')[0];

  if (domain.length > 253) {
    return false;
  }

  return domainRegex.test(domain);
}

module.exports = { isValidDomain };
