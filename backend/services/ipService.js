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
      country: response.data.country || 'Không rõ',
      countryCode: response.data.countryCode || 'Không rõ',
      region: response.data.regionName || 'Không rõ',
      city: response.data.city || 'Không rõ',
      isp: response.data.isp || 'Không rõ',
      org: response.data.org || 'Không rõ',
      as: response.data.as || 'Không rõ',
      lat: response.data.lat || null,
      lon: response.data.lon || null
    };
  } catch (error) {
    throw new Error(`Tra cứu địa chỉ IP thất bại: ${error.message}`);
  }
}

module.exports = { getIPInfo };
