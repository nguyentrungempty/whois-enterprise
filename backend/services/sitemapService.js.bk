const axios = require('axios');
const xml2js = require('xml2js');

async function getSitemap(domain) {
    const results = {
        domain: domain,
        totalUrls: 0,
        urls: [],
        sitemaps: [],
        errors: [],
        lastScanned: new Date().toISOString()
    };

    try {
        const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
        const cleanDomain = baseUrl.replace(/\/$/, '');

        // Common sitemap locations
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
            // robots.txt not found or error - continue with default locations
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

                // Check if it's a sitemap index (contains other sitemaps)
                if (xmlData.sitemapindex) {
                    results.sitemaps.push({
                        url: sitemapUrl,
                        type: 'index',
                        found: true
                    });

                    const sitemaps = xmlData.sitemapindex.sitemap || [];
                    for (const sitemap of sitemaps) {
                        const childUrl = sitemap.loc[0];
                        try {
                            const childResponse = await axios.get(childUrl, {
                                timeout: 15000,
                                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SitemapBot/1.0)' }
                            });

                            const childData = await parser.parseStringPromise(childResponse.data);
                            if (childData.urlset && childData.urlset.url) {
                                const urls = childData.urlset.url;
                                urls.forEach(urlObj => {
                                    results.urls.push({
                                        loc: urlObj.loc[0],
                                        lastmod: urlObj.lastmod ? urlObj.lastmod[0] : null,
                                        changefreq: urlObj.changefreq ? urlObj.changefreq[0] : null,
                                        priority: urlObj.priority ? urlObj.priority[0] : null
                                    });
                                });
                            }
                        } catch (childErr) {
                            results.errors.push({
                                sitemap: childUrl,
                                error: childErr.message
                            });
                        }
                    }
                }
                // Regular sitemap with URLs
                else if (xmlData.urlset && xmlData.urlset.url) {
                    results.sitemaps.push({
                        url: sitemapUrl,
                        type: 'urlset',
                        found: true
                    });

                    const urls = xmlData.urlset.url;
                    urls.forEach(urlObj => {
                        results.urls.push({
                            loc: urlObj.loc[0],
                            lastmod: urlObj.lastmod ? urlObj.lastmod[0] : null,
                            changefreq: urlObj.changefreq ? urlObj.changefreq[0] : null,
                            priority: urlObj.priority ? urlObj.priority[0] : null
                        });
                    });
                }

                // Found at least one sitemap, break
                if (results.urls.length > 0) {
                    break;
                }

            } catch (err) {
                // Continue to next location
            }
        }

        // If no sitemap found, try crawling homepage links
        if (results.urls.length === 0) {
            const crawledUrls = await crawlHomepage(cleanDomain);
            results.urls = crawledUrls;
            results.sitemaps.push({
                url: 'crawled',
                type: 'homepage-crawl',
                found: true,
                note: 'No sitemap found, crawled from homepage'
            });
        }

        results.totalUrls = results.urls.length;

        // Analyze URLs
        results.analysis = analyzeUrls(results.urls);

        return results;

    } catch (error) {
        console.error('[Sitemap Error]:', error.message);
        return {
            error: `Failed to get sitemap: ${error.message}`,
            domain: domain,
            totalUrls: 0,
            urls: []
        };
    }
}

async function crawlHomepage(baseUrl) {
    try {
        const response = await axios.get(baseUrl, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SitemapBot/1.0)' }
        });

        const html = response.data;
        const urls = [];

        // Extract all links from homepage
        const hrefRegex = /href=["']([^"']+)["']/gi;
        let match;

        while ((match = hrefRegex.exec(html)) !== null) {
            let url = match[1];

            // Skip anchors, javascript, mailto, tel
            if (url.startsWith('#') || url.startsWith('javascript:') ||
                url.startsWith('mailto:') || url.startsWith('tel:')) {
                continue;
            }

            // Convert relative URLs to absolute
            if (url.startsWith('/')) {
                url = baseUrl + url;
            } else if (!url.startsWith('http')) {
                url = baseUrl + '/' + url;
            }

            // Only include URLs from same domain
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

        // Remove duplicates
        const uniqueUrls = urls.filter((url, index, self) =>
            index === self.findIndex((t) => t.loc === url.loc)
        );

        return uniqueUrls.slice(0, 100); // Limit to 100 URLs from homepage

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
        // Categorize by type (based on path)
        const path = url.loc.replace(/^https?:\/\/[^/]+/, '');
        let type = 'page';

        if (path.includes('/blog/') || path.includes('/post/')) type = 'blog';
        else if (path.includes('/product/') || path.includes('/shop/')) type = 'product';
        else if (path.includes('/category/') || path.includes('/cat/')) type = 'category';
        else if (path.includes('/tag/')) type = 'tag';
        else if (path.match(/\.(jpg|jpeg|png|gif|pdf|doc)$/i)) type = 'media';

        analysis.byType[type] = (analysis.byType[type] || 0) + 1;

        // By change frequency
        if (url.changefreq) {
            analysis.byChangeFreq[url.changefreq] = (analysis.byChangeFreq[url.changefreq] || 0) + 1;
        }

        // By priority
        if (url.priority) {
            const priorityKey = `priority_${url.priority}`;
            analysis.byPriority[priorityKey] = (analysis.byPriority[priorityKey] || 0) + 1;
        }

        // Recent vs old
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

module.exports = { getSitemap };
