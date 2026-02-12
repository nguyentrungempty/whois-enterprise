const axios = require('axios');

async function getTechStack(domain) {
  try {
    const url = `https://${domain}`;
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const headers = response.headers;
    const html = response.data;

    const technologies = {
      server: headers['server'] || 'Unknown',
      poweredBy: headers['x-powered-by'] || 'Unknown',
      framework: detectFramework(html),
      cms: detectCMS(html),
      analytics: detectAnalytics(html),
      cdn: detectCDN(headers),
      cookies: headers['set-cookie'] ? headers['set-cookie'].length : 0
    };

    return technologies;
  } catch (error) {
    return {
      error: error.message,
      server: 'Unknown',
      poweredBy: 'Unknown',
      framework: [],
      cms: null,
      analytics: [],
      cdn: null,
      cookies: 0
    };
  }
}

function detectFramework(html) {
  const frameworks = [];
  
  if (html.includes('react') || html.includes('_reactRoot')) frameworks.push('React');
  if (html.includes('ng-app') || html.includes('angular')) frameworks.push('Angular');
  if (html.includes('vue') || html.includes('v-app')) frameworks.push('Vue.js');
  if (html.includes('next') || html.includes('__NEXT_DATA__')) frameworks.push('Next.js');
  if (html.includes('nuxt')) frameworks.push('Nuxt.js');
  if (html.includes('jquery')) frameworks.push('jQuery');
  
  return frameworks;
}

function detectCMS(html) {
  if (html.includes('wp-content') || html.includes('wordpress')) return 'WordPress';
  if (html.includes('joomla')) return 'Joomla';
  if (html.includes('drupal')) return 'Drupal';
  if (html.includes('shopify')) return 'Shopify';
  if (html.includes('wix.com')) return 'Wix';
  
  return null;
}

function detectAnalytics(html) {
  const analytics = [];
  
  if (html.includes('google-analytics') || html.includes('gtag')) analytics.push('Google Analytics');
  if (html.includes('facebook.com/tr')) analytics.push('Facebook Pixel');
  if (html.includes('hotjar')) analytics.push('Hotjar');
  if (html.includes('mixpanel')) analytics.push('Mixpanel');
  
  return analytics;
}

function detectCDN(headers) {
  const server = (headers['server'] || '').toLowerCase();
  const cdnHeader = headers['cdn-cache'] || headers['x-cdn'] || '';
  
  if (server.includes('cloudflare') || cdnHeader.includes('cloudflare')) return 'Cloudflare';
  if (server.includes('akamai')) return 'Akamai';
  if (headers['x-amz-cf-id']) return 'Amazon CloudFront';
  if (headers['x-fastly-request-id']) return 'Fastly';
  
  return null;
}

module.exports = { getTechStack };
