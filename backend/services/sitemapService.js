const axios = require('axios');
const xml2js = require('xml2js');

async function getSitemap(domain) {
  const results = {
    domain: domain,
    totalUrls: 0,
    urls: [],
    resources: {
      css: [],
      js: [],
      images: [],
      fonts: [],
      videos: [],
      iframes: []
    },
    thirdParty: {
      domains: [],
      scripts: [],
      stylesheets: [],
      apis: [],
      cdn: []
    },
    sitemaps: [],
    errors: [],
    lastScanned: new Date().toISOString()
  };

  try {
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    const cleanDomain = baseUrl.replace(/\/$/, '');
    const mainDomain = extractMainDomain(cleanDomain);

    // First, scan the homepage for all resources
    const resources = await scanPageResources(cleanDomain, mainDomain);
    results.resources = resources.internal;
    results.thirdParty = resources.external;

    // Then get sitemap URLs
    const sitemapUrls = await getSitemapUrls(cleanDomain);
    results.urls = sitemapUrls.urls;
    results.sitemaps = sitemapUrls.sitemaps;

    results.totalUrls = results.urls.length;
    results.analysis = analyzeUrls(results.urls);
    results.resourceStats = getResourceStats(results.resources, results.thirdParty);

    return results;

  } catch (error) {
    console.error('[Sitemap Error]:', error.message);
    return {
      error: `Failed to get sitemap: ${error.message}`,
      domain: domain,
      totalUrls: 0,
      urls: [],
      resources: { css: [], js: [], images: [], fonts: [] },
      thirdParty: { domains: [], scripts: [], stylesheets: [] }
    };
  }
}

function extractMainDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}

async function scanPageResources(url, mainDomain) {
  const resources = {
    internal: {
      css: [],
      js: [],
      images: [],
      fonts: [],
      videos: [],
      iframes: []
    },
    external: {
      domains: new Set(),
      scripts: [],
      stylesheets: [],
      apis: [],
      cdn: []
    }
  };

  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResourceScanner/1.0)' }
    });

    const html = response.data;

    // Extract CSS files
    const cssRegex = /<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/gi;
    let match;
    while ((match = cssRegex.exec(html)) !== null) {
      const cssUrl = resolveUrl(url, match[1]);
      categorizeResource(cssUrl, mainDomain, resources, 'css');
    }

    // Extract inline styles with @import
    const importRegex = /@import\s+(?:url\()?["']([^"']+)["']\)?/gi;
    while ((match = importRegex.exec(html)) !== null) {
      const cssUrl = resolveUrl(url, match[1]);
      categorizeResource(cssUrl, mainDomain, resources, 'css');
    }

    // Extract JavaScript files
    const jsRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = jsRegex.exec(html)) !== null) {
      const jsUrl = resolveUrl(url, match[1]);
      categorizeResource(jsUrl, mainDomain, resources, 'js');
    }

    // Extract images
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = imgRegex.exec(html)) !== null) {
      const imgUrl = resolveUrl(url, match[1]);
      categorizeResource(imgUrl, mainDomain, resources, 'image');
    }

    // Extract background images from inline styles
    const bgImgRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
    while ((match = bgImgRegex.exec(html)) !== null) {
      const imgUrl = resolveUrl(url, match[1]);
      categorizeResource(imgUrl, mainDomain, resources, 'image');
    }

    // Extract fonts
    const fontRegex = /@font-face[^}]*src:\s*url\(["']?([^"')]+)["']?\)/gi;
    while ((match = fontRegex.exec(html)) !== null) {
      const fontUrl = resolveUrl(url, match[1]);
      categorizeResource(fontUrl, mainDomain, resources, 'font');
    }

    // Extract font links
    const fontLinkRegex = /<link[^>]+href=["']([^"']*(?:fonts|woff|ttf|eot)[^"']*)["'][^>]*>/gi;
    while ((match = fontLinkRegex.exec(html)) !== null) {
      const fontUrl = resolveUrl(url, match[1]);
      categorizeResource(fontUrl, mainDomain, resources, 'font');
    }

    // Extract videos
    const videoRegex = /<(?:video|source)[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = videoRegex.exec(html)) !== null) {
      const videoUrl = resolveUrl(url, match[1]);
      categorizeResource(videoUrl, mainDomain, resources, 'video');
    }

    // Extract iframes
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = iframeRegex.exec(html)) !== null) {
      const iframeUrl = resolveUrl(url, match[1]);
      categorizeResource(iframeUrl, mainDomain, resources, 'iframe');
    }

    // Detect API calls from scripts (common patterns)
    const apiPatterns = [
      /fetch\(["']([^"']+)["']/gi,
      /axios\.(?:get|post|put|delete)\(["']([^"']+)["']/gi,
      /\$\.ajax\([^}]*url:\s*["']([^"']+)["']/gi,
      /XMLHttpRequest[^}]*open\([^,]*,\s*["']([^"']+)["']/gi
    ];

    apiPatterns.forEach(regex => {
      while ((match = regex.exec(html)) !== null) {
        const apiUrl = match[1];
        if (apiUrl.startsWith('http') && !apiUrl.includes(mainDomain)) {
          resources.external.apis.push(apiUrl);
        }
      }
    });

    // Convert Sets to Arrays and identify CDNs
    resources.external.domains = Array.from(resources.external.domains);
    resources.external.cdn = identifyCDNs(resources.external);

  } catch (error) {
    console.error('[Resource Scan Error]:', error.message);
  }

  return resources;
}

function resolveUrl(baseUrl, relativeUrl) {
  try {
    // Remove any leading/trailing whitespace
    relativeUrl = relativeUrl.trim();
    
    // Skip data URLs
    if (relativeUrl.startsWith('data:')) {
      return null;
    }

    // If already absolute URL
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }

    // If protocol-relative URL
    if (relativeUrl.startsWith('//')) {
      return 'https:' + relativeUrl;
    }

    // Resolve relative URL
    const base = new URL(baseUrl);
    return new URL(relativeUrl, base.origin).href;
  } catch (e) {
    return null;
  }
}

function categorizeResource(resourceUrl, mainDomain, resources, type) {
  if (!resourceUrl) return;

  try {
    const urlObj = new URL(resourceUrl);
    const resourceDomain = urlObj.hostname;
    const isExternal = !resourceDomain.includes(mainDomain) && resourceDomain !== mainDomain;

    if (isExternal) {
      // External resource
      resources.external.domains.add(resourceDomain);
      
      if (type === 'css') {
        resources.external.stylesheets.push({
          url: resourceUrl,
          domain: resourceDomain
        });
      } else if (type === 'js') {
        resources.external.scripts.push({
          url: resourceUrl,
          domain: resourceDomain
        });
      }
    } else {
      // Internal resource
      if (!resources.internal[type + 's']) {
        resources.internal[type + 's'] = [];
      }
      
      const targetArray = type === 'css' ? resources.internal.css :
                         type === 'js' ? resources.internal.js :
                         type === 'image' ? resources.internal.images :
                         type === 'font' ? resources.internal.fonts :
                         type === 'video' ? resources.internal.videos :
                         type === 'iframe' ? resources.internal.iframes : null;
      
      if (targetArray && !targetArray.includes(resourceUrl)) {
        targetArray.push(resourceUrl);
      }
    }
  } catch (e) {
    // Invalid URL, skip
  }
}

function identifyCDNs(external) {
  const cdnPatterns = {
    'Cloudflare': /cloudflare|cdnjs/i,
    'Google CDN': /googleapis|gstatic/i,
    'jsDelivr': /jsdelivr/i,
    'unpkg': /unpkg\.com/i,
    'Amazon CloudFront': /cloudfront\.net/i,
    'Fastly': /fastly\.net/i,
    'Akamai': /akamai/i,
    'MaxCDN': /maxcdn/i,
    'KeyCDN': /keycdn/i,
    'BunnyCDN': /bunnycdn/i
  };

  const cdns = [];
  const allUrls = [
    ...external.scripts.map(s => s.url),
    ...external.stylesheets.map(s => s.url)
  ];

  Object.entries(cdnPatterns).forEach(([name, pattern]) => {
    const found = allUrls.some(url => pattern.test(url));
    if (found) {
      cdns.push(name);
    }
  });

  return cdns;
}

async function getSitemapUrls(cleanDomain) {
  const sitemapLocations = [
    `${cleanDomain}/sitemap.xml`,
    `${cleanDomain}/sitemap_index.xml`,
    `${cleanDomain}/sitemap1.xml`,
    `${cleanDomain}/post-sitemap.xml`,
    `${cleanDomain}/page-sitemap.xml`,
    `${cleanDomain}/product-sitemap.xml`,
    `${cleanDomain}/category-sitemap.xml`,
    `${cleanDomain}/wp-sitemap.xml`,
    `${cleanDomain}/sitemap-index.xml`
  ];

  const sitemaps = [];
  const urls = [];

  // Check robots.txt first
  try {
    const robotsUrl = `${cleanDomain}/robots.txt`;
    const robotsResponse = await axios.get(robotsUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SitemapBot/1.0)' }
    });

    const robotsContent = robotsResponse.data;
    const sitemapMatches = robotsContent.match(/Sitemap:\s*(.+)/gi);
    
    if (sitemapMatches) {
      sitemapMatches.forEach(match => {
        const url = match.replace(/Sitemap:\s*/i, '').trim();
        if (!sitemapLocations.includes(url)) {
          sitemapLocations.unshift(url);
        }
      });
    }
  } catch (err) {
    // robots.txt not found
  }

  // Try each sitemap location
  for (const sitemapUrl of sitemapLocations) {
    try {
      const response = await axios.get(sitemapUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SitemapBot/1.0)' }
      });

      const parser = new xml2js.Parser();
      const xmlData = await parser.parseStringPromise(response.data);

      if (xmlData.sitemapindex) {
        sitemaps.push({ url: sitemapUrl, type: 'index', found: true });

        const childSitemaps = xmlData.sitemapindex.sitemap || [];
        for (const sitemap of childSitemaps) {
          const childUrl = sitemap.loc[0];
          try {
            const childResponse = await axios.get(childUrl, {
              timeout: 15000,
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SitemapBot/1.0)' }
            });

            const childData = await parser.parseStringPromise(childResponse.data);
            if (childData.urlset && childData.urlset.url) {
              childData.urlset.url.forEach(urlObj => {
                urls.push({
                  loc: urlObj.loc[0],
                  lastmod: urlObj.lastmod ? urlObj.lastmod[0] : null,
                  changefreq: urlObj.changefreq ? urlObj.changefreq[0] : null,
                  priority: urlObj.priority ? urlObj.priority[0] : null
                });
              });
            }
          } catch (childErr) {
            // Skip failed child sitemap
          }
        }
      } else if (xmlData.urlset && xmlData.urlset.url) {
        sitemaps.push({ url: sitemapUrl, type: 'urlset', found: true });

        xmlData.urlset.url.forEach(urlObj => {
          urls.push({
            loc: urlObj.loc[0],
            lastmod: urlObj.lastmod ? urlObj.lastmod[0] : null,
            changefreq: urlObj.changefreq ? urlObj.changefreq[0] : null,
            priority: urlObj.priority ? urlObj.priority[0] : null
          });
        });
      }

      if (urls.length > 0) break;

    } catch (err) {
      // Continue to next location
    }
  }

  // If no sitemap found, crawl homepage
  if (urls.length === 0) {
    const crawledUrls = await crawlHomepage(cleanDomain);
    urls.push(...crawledUrls);
    sitemaps.push({
      url: 'crawled',
      type: 'homepage-crawl',
      found: true,
      note: 'No sitemap found, crawled from homepage'
    });
  }

  return { urls, sitemaps };
}

async function crawlHomepage(baseUrl) {
  try {
    const response = await axios.get(baseUrl, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SitemapBot/1.0)' }
    });

    const html = response.data;
    const urls = [];
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let match;

    while ((match = hrefRegex.exec(html)) !== null) {
      let url = match[1];
      
      if (url.startsWith('#') || url.startsWith('javascript:') || 
          url.startsWith('mailto:') || url.startsWith('tel:')) {
        continue;
      }

      if (url.startsWith('/')) {
        url = baseUrl + url;
      } else if (!url.startsWith('http')) {
        url = baseUrl + '/' + url;
      }

      if (url.startsWith(baseUrl)) {
        urls.push({
          loc: url,
          lastmod: null,
          changefreq: null,
          priority: null,
          source: 'crawled'
        });
      }
    }

    const uniqueUrls = urls.filter((url, index, self) =>
      index === self.findIndex((t) => t.loc === url.loc)
    );

    return uniqueUrls.slice(0, 100);

  } catch (error) {
    console.error('[Crawl Error]:', error.message);
    return [];
  }
}

function analyzeUrls(urls) {
  const analysis = {
    byType: {},
    byChangeFreq: {},
    byPriority: {},
    recent: [],
    old: []
  };

  urls.forEach(url => {
    const path = url.loc.replace(/^https?:\/\/[^/]+/, '');
    let type = 'page';
    
    if (path.includes('/blog/') || path.includes('/post/')) type = 'blog';
    else if (path.includes('/product/') || path.includes('/shop/')) type = 'product';
    else if (path.includes('/category/') || path.includes('/cat/')) type = 'category';
    else if (path.includes('/tag/')) type = 'tag';
    else if (path.match(/\.(jpg|jpeg|png|gif|pdf|doc)$/i)) type = 'media';

    analysis.byType[type] = (analysis.byType[type] || 0) + 1;

    if (url.changefreq) {
      analysis.byChangeFreq[url.changefreq] = (analysis.byChangeFreq[url.changefreq] || 0) + 1;
    }

    if (url.priority) {
      const priorityKey = `priority_${url.priority}`;
      analysis.byPriority[priorityKey] = (analysis.byPriority[priorityKey] || 0) + 1;
    }

    if (url.lastmod) {
      const lastModDate = new Date(url.lastmod);
      const now = new Date();
      const daysDiff = (now - lastModDate) / (1000 * 60 * 60 * 24);

      if (daysDiff <= 30) {
        analysis.recent.push(url);
      } else if (daysDiff > 365) {
        analysis.old.push(url);
      }
    }
  });

  return {
    totalUrls: urls.length,
    byType: analysis.byType,
    byChangeFreq: analysis.byChangeFreq,
    byPriority: analysis.byPriority,
    recentUrls: analysis.recent.length,
    oldUrls: analysis.old.length,
    topRecent: analysis.recent.slice(0, 10),
    topOld: analysis.old.slice(0, 10)
  };
}

function getResourceStats(internal, external) {
  return {
    internal: {
      css: internal.css.length,
      js: internal.js.length,
      images: internal.images.length,
      fonts: internal.fonts.length,
      videos: internal.videos.length,
      iframes: internal.iframes.length,
      total: internal.css.length + internal.js.length + internal.images.length + 
             internal.fonts.length + internal.videos.length + internal.iframes.length
    },
    external: {
      domains: external.domains.length,
      scripts: external.scripts.length,
      stylesheets: external.stylesheets.length,
      apis: external.apis.length,
      cdn: external.cdn.length,
      total: external.scripts.length + external.stylesheets.length
    }
  };
}

module.exports = { getSitemap };

