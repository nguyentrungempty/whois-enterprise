const axios = require('axios');
const dns = require('dns').promises;

async function getIPInfo(domain) {
  try {
    const ips = await dns.resolve4(domain);
    const ip = ips[0];

    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 5000
    });

    return {
      ip: ip,
      allIPs: ips,
      country: response.data.country || 'Unknown',
      countryCode: response.data.countryCode || 'Unknown',
      region: response.data.regionName || 'Unknown',
      city: response.data.city || 'Unknown',
      isp: response.data.isp || 'Unknown',
      org: response.data.org || 'Unknown',
      as: response.data.as || 'Unknown',
      lat: response.data.lat || null,
      lon: response.data.lon || null
    };
  } catch (error) {
    throw new Error(`IP lookup failed: ${error.message}`);
  }
}

module.exports = { getIPInfo };
