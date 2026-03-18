const express = require('express');
const router = express.Router();
const whoisService = require('../services/whoisService');
const dnsService = require('../services/dnsService');
const ipService = require('../services/ipService');
const sslService = require('../services/sslService');
const techService = require('../services/techService');
const riskEngine = require('../services/riskEngine');
const debugService = require('../services/debugService');
const sitemapService = require('../services/sitemapService');
const malwareService = require('../services/malwareService');
const { getScreenshot } = require('../services/screenshotService');
const validator = require('../utils/validator');

router.get('/scan', async(req, res) => {
    try {
        let { domain } = req.query;

        if (!domain) {
            return res.status(400).json({ error: 'Tham số miền là bắt buộc' });
        }

        // Extract clean domain from URL
        const fullDomain = validator.extractDomain(domain);

        // Extract root domain for WHOIS (remove subdomain)
        const rootDomain = validator.extractRootDomain(domain);

        if (!validator.isValidDomain(domain)) {
            return res.status(400).json({ error: 'Định dạng miền không hợp lệ' });
        }

        const [whois, dns, ip, ssl, tech, security] = await Promise.allSettled([
            whoisService.getWhoisInfo(rootDomain), // Use root domain for WHOIS
            dnsService.getDNSInfo(fullDomain),     // Use full domain for DNS
            ipService.getIPInfo(fullDomain),       // Use full domain for IP
            sslService.getSSLInfo(fullDomain),     // Use full domain for SSL
            techService.getTechStack(fullDomain),  // Use full domain for Tech
            riskEngine.analyzeWebsiteSecurity(fullDomain) // Use full domain for Security
        ]);

        const results = {
            domain: fullDomain,
            rootDomain: rootDomain,
            whois: whois.status === 'fulfilled' ? whois.value : { error: whois.reason?.message },
            dns: dns.status === 'fulfilled' ? dns.value : { error: dns.reason?.message },
            ip: ip.status === 'fulfilled' ? ip.value : { error: ip.reason?.message },
            ssl: ssl.status === 'fulfilled' ? ssl.value : { error: ssl.reason?.message },
            tech: tech.status === 'fulfilled' ? tech.value : { error: tech.reason?.message },
            security: security.status === 'fulfilled' ? security.value : { error: security.reason?.message, score: 0, level: 'critical', checks: [] }
        };

        // results.riskScore = riskEngine.calculateRiskScore(results);

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/whois-raw', async(req, res) => {
    try {
        let { domain } = req.query;

        if (!domain) {
            return res.status(400).json({ error: 'Tham số miền là bắt buộc' });
        }

        /// Extract root domain for WHOIS (remove subdomain)
        const rootDomain = validator.extractRootDomain(domain);

        if (!validator.isValidDomain(domain)) {
            return res.status(400).json({ error: 'Định dạng miền không hợp lệ' });
        }

        const whoisData = await whoisService.getWhoisInfo(rootDomain);

        res.json({
            domain: rootDomain,
            raw: whoisData.raw,
            parsed: whoisData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/screenshot", async(req, res) => {
    let { domain } = req.query;
    // Extract clean domain from URL
    const fullDomain = validator.extractDomain(domain);

    const screenshot = await getScreenshot(fullDomain);

    res.json({ screenshot });
});

router.get('/debug', async(req, res) => {
    try {
        let { domain } = req.query;

        if (!domain) {
            return res.status(400).json({ error: 'Tham số miền là bắt buộc' });
        }

        // Extract clean domain from URL
        domain = validator.extractDomain(domain);

        if (!validator.isValidDomain(domain)) {
            return res.status(400).json({ error: 'Định dạng miền không hợp lệ' });
        }

        console.log(`[API] Starting debug for domain: ${domain}`);

        const debugReport = await debugService.debugWebsite(domain);

        res.json(debugReport);
    } catch (error) {
        console.error('[API] Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

router.get('/sitemap', async (req, res) => {
  try {
    let { domain } = req.query;

    if (!domain) {
      return res.status(400).json({ error: 'Tham số miền là bắt buộc' });
    }

    // Extract clean domain from URL
    domain = validator.extractDomain(domain);

    if (!validator.isValidDomain(domain)) {
      return res.status(400).json({ error: 'Định dạng miền không hợp lệ' });
    }

    console.log(`[API] Getting sitemap for domain: ${domain}`);
    
    const sitemapData = await sitemapService.getSitemap(domain);
    
    res.json(sitemapData);
  } catch (error) {
    console.error('[API] Sitemap error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/malware', async (req, res) => {
  try {
    let { domain } = req.query;

    if (!domain) {
      return res.status(400).json({ error: 'Tham số miền là bắt buộc' });
    }

    // Extract clean domain from URL
    domain = validator.extractDomain(domain);

    if (!validator.isValidDomain(domain)) {
      return res.status(400).json({ error: 'Định dạng miền không hợp lệ' });
    }

    console.log(`[API] Scanning malware for domain: ${domain}`);
    
    const malwareData = await malwareService.scanMalware(domain);
    
    res.json(malwareData);
  } catch (error) {
    console.error('[API] Malware scan error:', error);
    res.status(500).json({ error: error.message });
  }
});
