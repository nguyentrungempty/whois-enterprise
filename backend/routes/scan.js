const express = require('express');
const router = express.Router();
const whoisService = require('../services/whoisService');
const dnsService = require('../services/dnsService');
const ipService = require('../services/ipService');
const sslService = require('../services/sslService');
const techService = require('../services/techService');
const riskEngine = require('../services/riskEngine');
const { getScreenshot } = require('../services/screenshotService');
const validator = require('../utils/validator');

router.get('/scan', async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({ error: 'Domain parameter is required' });
    }

    if (!validator.isValidDomain(domain)) {
      return res.status(400).json({ error: 'Invalid domain format' });
    }

    const [whois, dns, ip, ssl, tech] = await Promise.allSettled([
      whoisService.getWhoisInfo(domain),
      dnsService.getDNSInfo(domain),
      ipService.getIPInfo(domain),
      sslService.getSSLInfo(domain),
      techService.getTechStack(domain)
    ]);

    const results = {
      whois: whois.status === 'fulfilled' ? whois.value : { error: whois.reason?.message },
      dns: dns.status === 'fulfilled' ? dns.value : { error: dns.reason?.message },
      ip: ip.status === 'fulfilled' ? ip.value : { error: ip.reason?.message },
      ssl: ssl.status === 'fulfilled' ? ssl.value : { error: ssl.reason?.message },
      tech: tech.status === 'fulfilled' ? tech.value : { error: tech.reason?.message }
    };

    results.riskScore = riskEngine.calculateRiskScore(results);

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/whois-raw', async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({ error: 'Domain parameter is required' });
    }

    if (!validator.isValidDomain(domain)) {
      return res.status(400).json({ error: 'Invalid domain format' });
    }

    const whoisData = await whoisService.getWhoisInfo(domain);
    
    res.json({
      domain: domain,
      raw: whoisData.raw,
      parsed: whoisData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/screenshot", async (req, res) => {
  const { domain } = req.query;

  const screenshot = await getScreenshot(domain);

  res.json({ screenshot });
});

module.exports = router;
