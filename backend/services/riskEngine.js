function calculateRiskScore(data) {
  let score = 0;
  let maxScore = 100;
  const risks = [];

  if (data.ssl?.hasSSL === false) {
    score += 30;
    risks.push({ severity: 'high', message: 'No SSL certificate detected' });
  } else if (data.ssl?.isValid === false) {
    score += 25;
    risks.push({ severity: 'high', message: 'SSL certificate is invalid or expired' });
  } else if (data.ssl?.daysRemaining < 30) {
    score += 15;
    risks.push({ severity: 'medium', message: `SSL certificate expires in ${data.ssl.daysRemaining} days` });
  }

  if (data.whois?.expirationDate) {
    try {
      const expDate = new Date(data.whois.expirationDate);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 30) {
        score += 20;
        risks.push({ severity: 'high', message: `Domain expires in ${daysUntilExpiry} days` });
      } else if (daysUntilExpiry < 90) {
        score += 10;
        risks.push({ severity: 'medium', message: `Domain expires in ${daysUntilExpiry} days` });
      }
    } catch (e) {
      // Invalid date format
    }
  }

  if (!data.dns?.MX || data.dns.MX.length === 0) {
    score += 10;
    risks.push({ severity: 'low', message: 'No MX records configured' });
  }

  if (!data.dns?.A || data.dns.A.length === 0) {
    score += 15;
    risks.push({ severity: 'medium', message: 'No A records found' });
  }

  if (data.tech?.server === 'Unknown') {
    score += 5;
    risks.push({ severity: 'low', message: 'Server information hidden' });
  }

  const spfRecord = data.dns?.TXT?.find(txt => txt.toLowerCase().includes('v=spf1'));
  if (!spfRecord) {
    score += 10;
    risks.push({ severity: 'medium', message: 'No SPF record detected' });
  }

  const dmarcRecord = data.dns?.TXT?.find(txt => txt.toLowerCase().includes('v=dmarc1'));
  if (!dmarcRecord) {
    score += 10;
    risks.push({ severity: 'medium', message: 'No DMARC record detected' });
  }

  score = Math.min(score, maxScore);

  let level = 'low';
  if (score >= 50) level = 'critical';
  else if (score >= 30) level = 'high';
  else if (score >= 15) level = 'medium';

  return {
    score: score,
    level: level,
    risks: risks,
    summary: `Risk score: ${score}/${maxScore} (${level.toUpperCase()})`
  };
}

module.exports = { calculateRiskScore };
