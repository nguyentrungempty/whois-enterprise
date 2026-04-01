const axios = require('axios');

async function getTechStack(domain) {
    try {
        const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;

        const response = await axios.get(baseUrl, {
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: () => true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const html = response.data;
        const headers = response.headers;
        const headersStr = JSON.stringify(headers).toLowerCase();

        const technologies = {
            cms: [],
            frameworks: {
                frontend: [],
                backend: []
            },
            programmingLanguages: [],
            webServers: [],
            jsLibraries: [],
            cssFrameworks: [],
            analytics: [],
            cdn: [],
            security: [],
            fonts: [],
            marketing: [],
            paymentProcessors: [],
            versions: {
                wordpress: null,
                php: null,
                mysql: null,
                joomla: null,
                drupal: null,
                apache: null,
                nginx: null,
                server: null
            }
        };

        // Helper function to check pattern
        const detect = (pattern) => pattern.test(html) || pattern.test(headersStr);

        // Detect versions from headers
        if (headers['x-powered-by']) {
            const poweredBy = headers['x-powered-by'];

            // PHP version
            const phpMatch = poweredBy.match(/PHP[\/\s]?([\d\.]+)/i);
            if (phpMatch) {
                technologies.versions.php = phpMatch[1];
                technologies.programmingLanguages.push({
                    name: 'PHP',
                    version: phpMatch[1],
                    detected: 'x-powered-by header'
                });
            }
        }

        // Server version from headers
        if (headers['server']) {
            technologies.versions.server = headers['server'];

            // Apache version
            const apacheMatch = headers['server'].match(/Apache[\/\s]?([\d\.]+)?/i);
            if (apacheMatch) {
                technologies.versions.apache = apacheMatch[1] || 'detected';
                technologies.webServers.push({
                    name: 'Apache',
                    version: apacheMatch[1] || null,
                    detected: 'server header'
                });
            }

            // Nginx version
            const nginxMatch = headers['server'].match(/nginx[\/\s]?([\d\.]+)?/i);
            if (nginxMatch) {
                technologies.versions.nginx = nginxMatch[1] || 'detected';
                technologies.webServers.push({
                    name: 'nginx',
                    version: nginxMatch[1] || null,
                    detected: 'server header'
                });
            }

            // LiteSpeed
            const liteSpeedMatch = headers['server'].match(/LiteSpeed[\/\s]?([\d\.]+)?/i);
            if (liteSpeedMatch) {
                technologies.webServers.push({
                    name: 'LiteSpeed',
                    version: liteSpeedMatch[1] || null,
                    detected: 'server header'
                });
            }
        }

        // WordPress version detection
        const wpVersionMeta = html.match(/<meta\s+name=["']generator["']\s+content=["']WordPress\s+([\d\.]+)["']/i);
        const wpVersionLink = html.match(/wp-includes\/.*ver=([\d\.]+)/i);
        const wpVersionReadme = html.match(/\/readme\.html.*Stable tag:\s*([\d\.]+)/i);

        if (wpVersionMeta) {
            technologies.versions.wordpress = wpVersionMeta[1];
        } else if (wpVersionLink) {
            technologies.versions.wordpress = wpVersionLink[1];
        }

        // Detect CMS
        if (detect(/\/wp-content\/|\/wp-includes\/|wordpress/i)) {
            technologies.cms.push({
                name: 'WordPress',
                version: technologies.versions.wordpress,
                detected: technologies.versions.wordpress ? 'version found' : 'files detected'
            });
        }

        // Joomla version
        const joomlaVersionMeta = html.match(/<meta\s+name=["']generator["']\s+content=["']Joomla!\s+([\d\.]+)["']/i);
        if (joomlaVersionMeta) {
            technologies.versions.joomla = joomlaVersionMeta[1];
            technologies.cms.push({
                name: 'Joomla',
                version: joomlaVersionMeta[1],
                detected: 'meta generator'
            });
        } else if (detect(/\/components\/com_|joomla/i)) {
            technologies.cms.push({ name: 'Joomla', detected: 'files detected' });
        }

        // Drupal version
        const drupalVersionMeta = html.match(/<meta\s+name=["']generator["']\s+content=["']Drupal\s+([\d\.]+)["']/i);
        if (drupalVersionMeta) {
            technologies.versions.drupal = drupalVersionMeta[1];
            technologies.cms.push({
                name: 'Drupal',
                version: drupalVersionMeta[1],
                detected: 'meta generator'
            });
        } else if (detect(/\/sites\/default\/|drupal/i)) {
            technologies.cms.push({ name: 'Drupal', detected: 'files detected' });
        }

        // Other CMS (without version for now)
        if (detect(/shopify/i)) technologies.cms.push({ name: 'Shopify', detected: 'cdn/script' });
        if (detect(/wix\.com/i)) technologies.cms.push({ name: 'Wix', detected: 'domain' });
        if (detect(/squarespace/i)) technologies.cms.push({ name: 'Squarespace', detected: 'script' });
        if (detect(/webflow/i)) technologies.cms.push({ name: 'Webflow', detected: 'script' });

        // Frontend Frameworks (with version detection where possible)
        const reactVersion = html.match(/react@([\d\.]+)/i) || html.match(/react[.-]([\d\.]+)\.(?:min\.)?js/i);
        if (detect(/react/i)) {
            technologies.frameworks.frontend.push({
                name: 'React',
                version: reactVersion ? reactVersion[1] : null,
                detected: reactVersion ? 'script version' : 'script detected'
            });
        }

        const vueVersion = html.match(/vue@([\d\.]+)/i) || html.match(/vue[.-]([\d\.]+)\.(?:min\.)?js/i);
        if (detect(/vue\.js|vue\.min\.js|__vue/i)) {
            technologies.frameworks.frontend.push({
                name: 'Vue.js',
                version: vueVersion ? vueVersion[1] : null,
                detected: vueVersion ? 'script version' : 'script detected'
            });
        }

        const angularVersion = html.match(/angular@([\d\.]+)/i) || html.match(/angular[.-]([\d\.]+)\.(?:min\.)?js/i);
        if (detect(/angular|ng-app|ng-controller/i)) {
            technologies.frameworks.frontend.push({
                name: 'Angular',
                version: angularVersion ? angularVersion[1] : null,
                detected: angularVersion ? 'script version' : 'attributes detected'
            });
        }

        if (detect(/_next\/|next\.js/i)) technologies.frameworks.frontend.push({ name: 'Next.js', detected: 'build files' });
        if (detect(/_nuxt\/|nuxt\.js/i)) technologies.frameworks.frontend.push({ name: 'Nuxt.js', detected: 'build files' });
        if (detect(/gatsby/i)) technologies.frameworks.frontend.push({ name: 'Gatsby', detected: 'build' });
        if (detect(/svelte/i)) technologies.frameworks.frontend.push({ name: 'Svelte', detected: 'script' });
        if (detect(/alpine\.js|x-data|x-show/i)) technologies.frameworks.frontend.push({ name: 'Alpine.js', detected: 'attributes' });

        // Backend Frameworks
        if (detect(/laravel|laravel_session/i)) {
            technologies.frameworks.backend.push({ name: 'Laravel', detected: 'session/script' });
            if (!technologies.programmingLanguages.find(l => l.name === 'PHP')) {
                technologies.programmingLanguages.push({ name: 'PHP', detected: 'framework detected' });
            }
        }
        if (detect(/symfony/i)) technologies.frameworks.backend.push({ name: 'Symfony', detected: 'script' });
        if (detect(/django|csrftoken|__admin/i)) {
            technologies.frameworks.backend.push({ name: 'Django', detected: 'csrf/admin' });
            technologies.programmingLanguages.push({ name: 'Python', detected: 'framework detected' });
        }
        if (detect(/express/i) && detect(/node/i)) technologies.frameworks.backend.push({ name: 'Express', detected: 'script' });
        if (detect(/ruby on rails|rails/i)) technologies.frameworks.backend.push({ name: 'Ruby on Rails', detected: 'script' });

        // Programming Languages (if not detected yet)
        if (detect(/\.php/i) && !technologies.programmingLanguages.find(l => l.name === 'PHP')) {
            technologies.programmingLanguages.push({ name: 'PHP', detected: 'file extension' });
        }
        if (detect(/\.jsp|\.java/i)) technologies.programmingLanguages.push({ name: 'Java', detected: 'file extension' });
        if (detect(/\.aspx|\.asp/i)) technologies.programmingLanguages.push({ name: 'ASP.NET', detected: 'file extension' });
        if (detect(/node\.js|nodejs/i) && !technologies.programmingLanguages.find(l => l.name === 'Node.js')) {
            technologies.programmingLanguages.push({ name: 'Node.js', detected: 'script' });
        }

        // JavaScript Libraries (with versions)
        const jqueryVersion = html.match(/jquery[.-]([\d\.]+)\.(?:min\.)?js/i);
        if (detect(/jquery/i)) {
            technologies.jsLibraries.push({
                name: 'jQuery',
                version: jqueryVersion ? jqueryVersion[1] : null,
                detected: jqueryVersion ? 'script version' : 'script detected'
            });
        }

        if (detect(/modernizr/i)) technologies.jsLibraries.push({ name: 'Modernizr', detected: 'script' });
        if (detect(/lodash|underscore\.js/i)) technologies.jsLibraries.push({ name: 'Lodash', detected: 'script' });
        if (detect(/axios/i)) technologies.jsLibraries.push({ name: 'Axios', detected: 'script' });
        if (detect(/gsap|greensock/i)) technologies.jsLibraries.push({ name: 'GSAP', detected: 'script' });
        if (detect(/chart\.js/i)) technologies.jsLibraries.push({ name: 'Chart.js', detected: 'script' });
        if (detect(/d3\.js|d3\.min\.js/i)) technologies.jsLibraries.push({ name: 'D3.js', detected: 'script' });
        if (detect(/three\.js|three\.min\.js/i)) technologies.jsLibraries.push({ name: 'Three.js', detected: 'script' });
        if (detect(/swiper/i)) technologies.jsLibraries.push({ name: 'Swiper', detected: 'script' });
        if (detect(/aos\.js|data-aos/i)) technologies.jsLibraries.push({ name: 'AOS', detected: 'script/attributes' });

        // CSS Frameworks
        if (detect(/bootstrap/i)) technologies.cssFrameworks.push({ name: 'Bootstrap', detected: 'css/script' });
        if (detect(/tailwind|tailwindcss/i)) technologies.cssFrameworks.push({ name: 'Tailwind CSS', detected: 'css classes' });
        if (detect(/material-ui|mui/i)) technologies.cssFrameworks.push({ name: 'Material-UI', detected: 'classes' });
        if (detect(/bulma/i)) technologies.cssFrameworks.push({ name: 'Bulma', detected: 'css' });
        if (detect(/foundation/i)) technologies.cssFrameworks.push({ name: 'Foundation', detected: 'css' });

        // Analytics
        if (detect(/google-analytics\.com|ga\.js|gtag/i)) technologies.analytics.push({ name: 'Google Analytics', detected: 'script' });
        if (detect(/googletagmanager\.com|gtm\.js/i)) technologies.analytics.push({ name: 'Google Tag Manager', detected: 'script' });
        if (detect(/facebook\.net\/.*\/fbevents\.js|fbq\(/i)) technologies.analytics.push({ name: 'Facebook Pixel', detected: 'script' });
        if (detect(/hotjar/i)) technologies.analytics.push({ name: 'Hotjar', detected: 'script' });
        if (detect(/mixpanel/i)) technologies.analytics.push({ name: 'Mixpanel', detected: 'script' });

        // CDN
        if (detect(/cloudflare/i)) technologies.cdn.push({ name: 'Cloudflare', detected: 'script/header' });
        if (detect(/cloudfront\.net/i)) technologies.cdn.push({ name: 'Amazon CloudFront', detected: 'domain' });
        if (detect(/fastly/i)) technologies.cdn.push({ name: 'Fastly', detected: 'header' });
        if (detect(/jsdelivr\.net/i)) technologies.cdn.push({ name: 'jsDelivr', detected: 'script' });
        if (detect(/cdnjs\.cloudflare\.com/i)) technologies.cdn.push({ name: 'cdnjs', detected: 'script' });

        // Web Servers (if not detected from headers)
        if (!technologies.webServers.length) {
            if (detect(/apache/i)) technologies.webServers.push({ name: 'Apache', detected: 'script/comment' });
            if (detect(/nginx/i)) technologies.webServers.push({ name: 'nginx', detected: 'script/comment' });
            if (detect(/microsoft-iis/i)) technologies.webServers.push({ name: 'Microsoft IIS', detected: 'script' });
        }

        // Security
        if (detect(/recaptcha|google\.com\/recaptcha/i)) technologies.security.push({ name: 'reCAPTCHA', detected: 'script' });
        if (detect(/hcaptcha/i)) technologies.security.push({ name: 'hCaptcha', detected: 'script' });

        // Fonts
        if (detect(/fonts\.googleapis\.com|fonts\.gstatic\.com/i)) technologies.fonts.push({ name: 'Google Fonts', detected: 'link' });
        if (detect(/font-awesome|fontawesome/i)) technologies.fonts.push({ name: 'Font Awesome', detected: 'css/script' });

        // Marketing
        if (detect(/mailchimp/i)) technologies.marketing.push({ name: 'Mailchimp', detected: 'script' });
        if (detect(/hubspot/i)) technologies.marketing.push({ name: 'HubSpot', detected: 'script' });
        if (detect(/intercom/i)) technologies.marketing.push({ name: 'Intercom', detected: 'script' });
        if (detect(/drift/i)) technologies.marketing.push({ name: 'Drift', detected: 'script' });

        // Payment Processors
        if (detect(/stripe\.com|stripe\.js/i)) technologies.paymentProcessors.push({ name: 'Stripe', detected: 'script' });
        if (detect(/paypal\.com|paypal/i)) technologies.paymentProcessors.push({ name: 'PayPal', detected: 'script' });

        return technologies;

    } catch (error) {
        console.error('[Tech Detection Error]:', error.message);
        return {
            error: error.message,
            cms: [],
            frameworks: { frontend: [], backend: [] },
            programmingLanguages: [],
            webServers: [],
            jsLibraries: [],
            cssFrameworks: [],
            analytics: [],
            cdn: [],
            security: [],
            fonts: [],
            marketing: [],
            paymentProcessors: [],
            versions: {}
        };
    }
}

module.exports = { getTechStack };
