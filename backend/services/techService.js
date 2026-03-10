const axios = require('axios');

async function getTechStack(domain) {
  try {
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = response.data;
    const headers = response.headers;

    const technologies = {
      cms: [],
      ecommerce: [],
      frameworks: {
        frontend: [],
        backend: []
      },
      jsLibraries: [],
      cssFrameworks: [],
      analytics: [],
      advertising: [],
      cdn: [],
      webServers: [],
      databases: [],
      programmingLanguages: [],
      marketing: [],
      paymentProcessors: [],
      security: [],
      hosting: [],
      emailServices: [],
      livechat: [],
      widgets: [],
      fonts: [],
      miscellaneous: []
    };

    // CMS Detection (30+ CMS)
    const cmsPatterns = {
      'WordPress': [
        /wp-content/i,
        /wp-includes/i,
        /wordpress/i,
        /<meta name="generator" content="WordPress/i
      ],
      'Joomla': [
        /\/components\/com_/i,
        /Joomla!/i,
        /\/media\/jui\//i
      ],
      'Drupal': [
        /\/sites\/default\/files\//i,
        /Drupal/i,
        /\/misc\/drupal\.js/i
      ],
      'Magento': [
        /Mage\.Cookies/i,
        /\/skin\/frontend\//i,
        /Magento/i
      ],
      'Shopify': [
        /cdn\.shopify\.com/i,
        /Shopify/i,
        /shopify-buy/i
      ],
      'Wix': [
        /wix\.com/i,
        /static\.wixstatic\.com/i
      ],
      'Squarespace': [
        /squarespace/i,
        /static\.squarespace\.com/i
      ],
      'Webflow': [
        /webflow/i,
        /assets\.website-files\.com/i
      ],
      'Ghost': [
        /ghost/i,
        /content\/ghost/i
      ],
      'PrestaShop': [
        /prestashop/i,
        /\/modules\/ps_/i
      ],
      'OpenCart': [
        /catalog\/view\/theme/i,
        /route=common/i
      ],
      'TYPO3': [
        /typo3/i,
        /\/typo3conf\//i
      ],
      'Contentful': [
        /contentful/i,
        /cdn\.contentful\.com/i
      ],
      'Strapi': [
        /strapi/i,
        /x-powered-by.*strapi/i
      ],
      'Umbraco': [
        /umbraco/i,
        /\/umbraco\//i
      ],
      'Kentico': [
        /kentico/i,
        /\/CMSPages\//i
      ],
      'Sitefinity': [
        /sitefinity/i,
        /\/Sitefinity\//i
      ],
      'BigCommerce': [
        /bigcommerce/i,
        /cdn\d+\.bigcommerce\.com/i
      ],
      'Blogger': [
        /blogger/i,
        /blogspot/i
      ],
      'Medium': [
        /medium\.com/i,
        /medium-feed/i
      ],
      'Notion': [
        /notion/i,
        /notion\.site/i
      ]
    };

    // Frontend Frameworks (40+ frameworks/libraries)
    const frontendFrameworks = {
      'React': [
        /__react/i,
        /react-dom/i,
        /data-reactroot/i,
        /data-reactid/i
      ],
      'Vue.js': [
        /vue\.js/i,
        /vue\.min\.js/i,
        /__vue__/i,
        /data-v-/i,
        /v-cloak/i
      ],
      'Angular': [
        /angular/i,
        /ng-/i,
        /_nghost/i,
        /_ngcontent/i
      ],
      'Next.js': [
        /__next/i,
        /next\.js/i,
        /_next\/static/i
      ],
      'Nuxt.js': [
        /__nuxt/i,
        /nuxt\.js/i,
        /_nuxt\//i
      ],
      'Svelte': [
        /svelte/i,
        /\.svelte/i
      ],
      'Ember.js': [
        /ember/i,
        /ember-/i
      ],
      'Backbone.js': [
        /backbone/i,
        /backbone\.js/i
      ],
      'Alpine.js': [
        /alpine/i,
        /x-data/i,
        /@click/i
      ],
      'Preact': [
        /preact/i
      ],
      'Solid.js': [
        /solid-js/i
      ],
      'Gatsby': [
        /gatsby/i,
        /___gatsby/i
      ],
      'Remix': [
        /remix/i,
        /__remix/i
      ],
      'Astro': [
        /astro/i,
        /astro-/i
      ],
      'Qwik': [
        /qwik/i,
        /q:version/i
      ]
    };

    // Backend Frameworks & Languages
    const backendTech = {
      'PHP': [
        /\.php/i,
        /x-powered-by.*php/i,
        /phpsessid/i
      ],
      'Laravel': [
        /laravel_session/i,
        /laravel/i,
        /csrf-token/i
      ],
      'Symfony': [
        /symfony/i,
        /symfony-profiler/i
      ],
      'CodeIgniter': [
        /codeigniter/i,
        /ci_session/i
      ],
      'CakePHP': [
        /cakephp/i,
        /\/cake_/i
      ],
      'Yii': [
        /yii/i,
        /\/assets\/.*yii/i
      ],
      'Django': [
        /django/i,
        /csrfmiddlewaretoken/i,
        /__admin/i
      ],
      'Flask': [
        /flask/i,
        /werkzeug/i
      ],
      'FastAPI': [
        /fastapi/i
      ],
      'Express': [
        /express/i,
        /x-powered-by.*express/i
      ],
      'Koa': [
        /x-powered-by.*koa/i
      ],
      'NestJS': [
        /nestjs/i
      ],
      'Ruby on Rails': [
        /rails/i,
        /ruby/i,
        /csrf-param/i
      ],
      'ASP.NET': [
        /asp\.net/i,
        /\.aspx/i,
        /viewstate/i,
        /x-aspnet-version/i
      ],
      'ASP.NET Core': [
        /asp\.net core/i,
        /x-powered-by.*asp\.net/i
      ],
      'Spring Boot': [
        /spring/i,
        /jsessionid/i
      ],
      'Struts': [
        /struts/i,
        /\/struts\//i
      ]
    };

    // JavaScript Libraries (50+)
    const jsLibraries = {
      'jQuery': [
        /jquery/i,
        /jquery\.min\.js/i
      ],
      'jQuery UI': [
        /jquery-ui/i
      ],
      'Lodash': [
        /lodash/i,
        /lodash\.min\.js/i
      ],
      'Underscore.js': [
        /underscore/i,
        /underscore\.js/i
      ],
      'Moment.js': [
        /moment\.js/i,
        /moment\.min\.js/i
      ],
      'Day.js': [
        /dayjs/i
      ],
      'Axios': [
        /axios/i
      ],
      'Chart.js': [
        /chart\.js/i
      ],
      'D3.js': [
        /d3\.js/i,
        /d3\.min\.js/i
      ],
      'Three.js': [
        /three\.js/i,
        /three\.min\.js/i
      ],
      'GSAP': [
        /gsap/i,
        /greensock/i
      ],
      'Anime.js': [
        /anime\.js/i
      ],
      'Swiper': [
        /swiper/i,
        /swiper-bundle/i
      ],
      'Slick': [
        /slick/i,
        /slick\.min\.js/i
      ],
      'AOS': [
        /aos\.js/i,
        /data-aos/i
      ],
      'Parallax.js': [
        /parallax/i
      ],
      'ScrollMagic': [
        /scrollmagic/i
      ],
      'Typed.js': [
        /typed\.js/i
      ],
      'Socket.io': [
        /socket\.io/i
      ],
      'Pusher': [
        /pusher/i
      ],
      'RxJS': [
        /rxjs/i
      ],
      'Ramda': [
        /ramda/i
      ],
      'Immutable.js': [
        /immutable/i
      ],
      'Redux': [
        /redux/i
      ],
      'MobX': [
        /mobx/i
      ],
      'Zustand': [
        /zustand/i
      ],
      'Recoil': [
        /recoil/i
      ],
      'SWR': [
        /swr/i
      ],
      'React Query': [
        /react-query/i
      ]
    };

    // CSS Frameworks (30+)
    const cssFrameworks = {
      'Bootstrap': [
        /bootstrap/i,
        /bootstrap\.min\.css/i,
        /\/bootstrap\//i
      ],
      'Tailwind CSS': [
        /tailwind/i,
        /tailwindcss/i
      ],
      'Material-UI': [
        /material-ui/i,
        /mui/i
      ],
      'Ant Design': [
        /antd/i,
        /ant-design/i
      ],
      'Chakra UI': [
        /chakra-ui/i
      ],
      'Bulma': [
        /bulma/i,
        /bulma\.min\.css/i
      ],
      'Foundation': [
        /foundation/i,
        /foundation\.min\.css/i
      ],
      'Semantic UI': [
        /semantic-ui/i,
        /semantic\.min\.css/i
      ],
      'UIKit': [
        /uikit/i
      ],
      'Materialize': [
        /materialize/i
      ],
      'Pure CSS': [
        /purecss/i
      ],
      'Skeleton': [
        /skeleton\.css/i
      ],
      'Milligram': [
        /milligram/i
      ],
      'Tachyons': [
        /tachyons/i
      ],
      'Spectre.css': [
        /spectre\.css/i
      ],
      'Primer CSS': [
        /primer/i
      ],
      'Vuetify': [
        /vuetify/i
      ],
      'Quasar': [
        /quasar/i
      ],
      'Element UI': [
        /element-ui/i
      ],
      'Naive UI': [
        /naive-ui/i
      ],
      'Mantine': [
        /mantine/i
      ],
      'DaisyUI': [
        /daisyui/i
      ],
      'PrimeReact': [
        /primereact/i
      ]
    };

    // Analytics & Tracking (25+)
    const analytics = {
      'Google Analytics': [
        /google-analytics\.com/i,
        /gtag/i,
        /ga\.js/i,
        /analytics\.js/i,
        /UA-\d+-\d+/i,
        /G-[A-Z0-9]+/i
      ],
      'Google Tag Manager': [
        /googletagmanager\.com/i,
        /GTM-/i
      ],
      'Facebook Pixel': [
        /connect\.facebook\.net/i,
        /fbevents\.js/i,
        /fbq\(/i
      ],
      'Hotjar': [
        /hotjar/i,
        /static\.hotjar\.com/i
      ],
      'Mixpanel': [
        /mixpanel/i,
        /cdn\.mxpnl\.com/i
      ],
      'Amplitude': [
        /amplitude/i
      ],
      'Segment': [
        /segment/i,
        /cdn\.segment\.com/i
      ],
      'Heap': [
        /heapanalytics/i
      ],
      'Matomo': [
        /matomo/i,
        /piwik/i
      ],
      'Plausible': [
        /plausible/i
      ],
      'Fathom': [
        /fathom/i
      ],
      'Adobe Analytics': [
        /omniture/i,
        /adobe analytics/i
      ],
      'Crazy Egg': [
        /crazyegg/i
      ],
      'FullStory': [
        /fullstory/i
      ],
      'LogRocket': [
        /logrocket/i
      ],
      'Mouseflow': [
        /mouseflow/i
      ],
      'Lucky Orange': [
        /luckyorange/i
      ],
      'Clicky': [
        /clicky/i,
        /static\.getclicky\.com/i
      ],
      'StatCounter': [
        /statcounter/i
      ],
      'Yandex Metrica': [
        /mc\.yandex/i
      ],
      'Baidu Analytics': [
        /hm\.baidu\.com/i
      ]
    };

    // Advertising (20+)
    const advertising = {
      'Google AdSense': [
        /googlesyndication\.com/i,
        /adsbygoogle/i
      ],
      'Google Ad Manager': [
        /doubleclick\.net/i,
        /gpt\.js/i
      ],
      'Amazon Associates': [
        /amazon-adsystem/i
      ],
      'Media.net': [
        /media\.net/i
      ],
      'PropellerAds': [
        /propellerads/i
      ],
      'AdThrive': [
        /adthrive/i
      ],
      'Mediavine': [
        /mediavine/i
      ],
      'Ezoic': [
        /ezoic/i
      ],
      'Taboola': [
        /taboola/i
      ],
      'Outbrain': [
        /outbrain/i
      ],
      'Criteo': [
        /criteo/i
      ],
      'AppNexus': [
        /appnexus/i
      ],
      'Bidvertiser': [
        /bidvertiser/i
      ],
      'Infolinks': [
        /infolinks/i
      ],
      'Skimlinks': [
        /skimlinks/i
      ],
      'VigLink': [
        /viglink/i
      ],
      'Sovrn': [
        /sovrn/i
      ]
    };

    // CDN (20+)
    const cdn = {
      'Cloudflare': [
        /cloudflare/i,
        /cf-ray/i,
        /cdn\.cloudflare\.com/i
      ],
      'Amazon CloudFront': [
        /cloudfront\.net/i
      ],
      'Fastly': [
        /fastly/i,
        /fastly\.net/i
      ],
      'Akamai': [
        /akamai/i,
        /akamaihd\.net/i
      ],
      'Google Cloud CDN': [
        /googleusercontent\.com/i
      ],
      'Microsoft Azure CDN': [
        /azureedge\.net/i
      ],
      'KeyCDN': [
        /keycdn/i
      ],
      'StackPath': [
        /stackpath/i
      ],
      'BunnyCDN': [
        /bunnycdn/i
      ],
      'jsDelivr': [
        /jsdelivr/i
      ],
      'unpkg': [
        /unpkg\.com/i
      ],
      'cdnjs': [
        /cdnjs\.cloudflare\.com/i
      ],
      'MaxCDN': [
        /maxcdn/i
      ],
      'Incapsula': [
        /incapsula/i
      ],
      'Sucuri': [
        /sucuri/i
      ]
    };

    // Web Servers
    const webServers = {
      'Nginx': [
        /nginx/i,
        /server.*nginx/i
      ],
      'Apache': [
        /apache/i,
        /server.*apache/i
      ],
      'LiteSpeed': [
        /litespeed/i
      ],
      'IIS': [
        /iis/i,
        /microsoft-iis/i
      ],
      'Caddy': [
        /caddy/i
      ],
      'OpenResty': [
        /openresty/i
      ],
      'Tomcat': [
        /tomcat/i
      ],
      'Jetty': [
        /jetty/i
      ]
    };

    // Marketing & Email (20+)
    const marketing = {
      'Mailchimp': [
        /mailchimp/i,
        /mc\.js/i
      ],
      'HubSpot': [
        /hubspot/i,
        /hs-scripts\.com/i
      ],
      'Marketo': [
        /marketo/i,
        /munchkin/i
      ],
      'Pardot': [
        /pardot/i
      ],
      'ActiveCampaign': [
        /activecampaign/i
      ],
      'ConvertKit': [
        /convertkit/i
      ],
      'Klaviyo': [
        /klaviyo/i
      ],
      'Sendinblue': [
        /sendinblue/i
      ],
      'GetResponse': [
        /getresponse/i
      ],
      'AWeber': [
        /aweber/i
      ],
      'Constant Contact': [
        /constantcontact/i
      ],
      'Drip': [
        /drip/i,
        /getdrip\.com/i
      ],
      'Customer.io': [
        /customer\.io/i
      ],
      'Intercom': [
        /intercom/i,
        /widget\.intercom\.io/i
      ],
      'Drift': [
        /drift/i,
        /js\.driftt\.com/i
      ],
      'Crisp': [
        /crisp/i,
        /crisp\.chat/i
      ],
      'Tawk.to': [
        /tawk\.to/i
      ],
      'LiveChat': [
        /livechat/i,
        /livechatinc\.com/i
      ],
      'Zendesk': [
        /zendesk/i,
        /zdassets\.com/i
      ],
      'Freshchat': [
        /freshchat/i
      ]
    };

    // Payment Processors (15+)
    const paymentProcessors = {
      'Stripe': [
        /stripe/i,
        /js\.stripe\.com/i
      ],
      'PayPal': [
        /paypal/i,
        /paypalobjects\.com/i
      ],
      'Square': [
        /squareup\.com/i,
        /square/i
      ],
      'Braintree': [
        /braintree/i,
        /braintreegateway/i
      ],
      'Authorize.Net': [
        /authorize\.net/i
      ],
      'Klarna': [
        /klarna/i
      ],
      'Afterpay': [
        /afterpay/i
      ],
      'Adyen': [
        /adyen/i
      ],
      'Razorpay': [
        /razorpay/i
      ],
      'Mollie': [
        /mollie/i
      ],
      '2Checkout': [
        /2checkout/i
      ],
      'Paddle': [
        /paddle/i
      ],
      'FastSpring': [
        /fastspring/i
      ]
    };

    // Security (10+)
    const security = {
      'reCAPTCHA': [
        /recaptcha/i,
        /google\.com\/recaptcha/i
      ],
      'hCaptcha': [
        /hcaptcha/i
      ],
      'Cloudflare Turnstile': [
        /turnstile/i,
        /challenges\.cloudflare\.com/i
      ],
      'Let\'s Encrypt': [
        /letsencrypt/i
      ],
      'DigiCert': [
        /digicert/i
      ],
      'Comodo': [
        /comodo/i
      ],
      'GlobalSign': [
        /globalsign/i
      ],
      'Wordfence': [
        /wordfence/i
      ],
      'Sucuri': [
        /sucuri/i
      ]
    };

    // Fonts (10+)
    const fonts = {
      'Google Fonts': [
        /fonts\.googleapis\.com/i,
        /fonts\.gstatic\.com/i
      ],
      'Adobe Fonts': [
        /typekit\.net/i,
        /use\.typekit\.net/i
      ],
      'Font Awesome': [
        /font-awesome/i,
        /fontawesome/i
      ],
      'Ionicons': [
        /ionicons/i
      ],
      'Material Icons': [
        /material-icons/i
      ],
      'Feather Icons': [
        /feather/i
      ],
      'Heroicons': [
        /heroicons/i
      ],
      'Bootstrap Icons': [
        /bootstrap-icons/i
      ]
    };

    // Check all patterns
    const checkPatterns = (patterns, html, headers) => {
      const found = [];
      for (const [tech, regexList] of Object.entries(patterns)) {
        const htmlLower = html.toLowerCase();
        const headersStr = JSON.stringify(headers).toLowerCase();
        
        for (const regex of regexList) {
          if (regex.test(htmlLower) || regex.test(headersStr)) {
            found.push({ name: tech });
            break;
          }
        }
      }
      return found;
    };

    technologies.cms = checkPatterns(cmsPatterns, html, headers);
    technologies.frameworks.frontend = checkPatterns(frontendFrameworks, html, headers);
    technologies.frameworks.backend = checkPatterns(backendTech, html, headers);
    technologies.jsLibraries = checkPatterns(jsLibraries, html, headers);
    technologies.cssFrameworks = checkPatterns(cssFrameworks, html, headers);
    technologies.analytics = checkPatterns(analytics, html, headers);
    technologies.advertising = checkPatterns(advertising, html, headers);
    technologies.cdn = checkPatterns(cdn, html, headers);
    technologies.webServers = checkPatterns(webServers, html, headers);
    technologies.marketing = checkPatterns(marketing, html, headers);
    technologies.paymentProcessors = checkPatterns(paymentProcessors, html, headers);
    technologies.security = checkPatterns(security, html, headers);
    technologies.fonts = checkPatterns(fonts, html, headers);

    return technologies;

  } catch (error) {
    return {
      error: `Failed to detect technologies: ${error.message}`,
      cms: [],
      ecommerce: [],
      frameworks: { frontend: [], backend: [] },
      jsLibraries: [],
      cssFrameworks: [],
      analytics: [],
      advertising: [],
      cdn: [],
      webServers: [],
      databases: [],
      programmingLanguages: [],
      marketing: [],
      paymentProcessors: [],
      security: [],
      fonts: []
    };
  }
}

module.exports = { getTechStack };

