const axios = require('axios');
const https = require('https');
const dns = require('dns').promises;

// Create axios instance with SSL bypass
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});

async function debugWebsite(domain) {
    const report = {
        domain: domain,
        timestamp: new Date().toISOString(),
        summary: {
            totalIssues: 0,
            criticalIssues: 0,
            warnings: 0,
            passed: 0
        },
        categories: {
            connectivity: [],
            dns: [],
            ssl: [],
            http: [],
            performance: [],
            configuration: []
        },
        recommendations: []
    };

    console.log(`[DEBUG] Starting comprehensive debug for: ${domain}`);

    // Check if domain exists first
    console.log(`[DEBUG] Checking if domain exists...`);
    try {
        await dns.resolve4(domain).catch(async() => {
            // Try AAAA if A fails
            await dns.resolve6(domain);
        });
        console.log(`[DEBUG] Domain exists, proceeding with debug...`);
    } catch (error) {
        console.log(`[DEBUG] Domain does not exist or DNS not configured`);

        // Return special error response for non-existent domain
        return {
            domain: domain,
            timestamp: new Date().toISOString(),
            exists: false,
            error: {
                type: 'DOMAIN_NOT_FOUND',
                title: '❌ Tên miền không tồn tại hoặc chưa được cấu hình DNS',
                message: `Domain "${domain}" không tồn tại hoặc chưa có DNS records.`,
                possibleReasons: [
                    '🔴 Domain chưa được đăng ký',
                    '🔴 Domain đã hết hạn (expired)',
                    '🔴 DNS chưa được cấu hình',
                    '🔴 DNS đang trong quá trình propagation (cần đợi thêm)',
                    '🔴 Gõ sai tên domain'
                ],
                solutions: {
                    title: '✅ Cách kiểm tra và xử lý',

                    checkIfRegistered: [
                        '1️⃣ Kiểm tra domain đã được đăng ký chưa:',
                        '',
                        '• Vào https://whois.inet.vn/whois',
                        '• Nhập domain của bạn',
                        '• Nếu thấy "No match" hoặc "Not found":',
                        '  → Domain chưa được đăng ký',
                        '  → Bạn cần mua domain trước',
                        '',
                        '• Nếu thấy thông tin đăng ký:',
                        '  → Domain đã tồn tại',
                        '  → Check expiration date (ngày hết hạn)',
                        '  → Nếu đã hết hạn → Renew ngay'
                    ],

                    checkDNS: [
                        '2️⃣ Kiểm tra DNS đã cấu hình chưa:',
                        '',
                        '• Vào https://whatsmydns.net',
                        '• Nhập domain',
                        '• Chọn "A" record',
                        '• Click "Search"',
                        '',
                        '❌ Nếu không thấy kết quả:',
                        '  → DNS chưa được cấu hình',
                        '  → Xem hướng dẫn bên dưới',
                        '',
                        '✅ Nếu thấy một số kết quả:',
                        '  → DNS đang propagation',
                        '  → Đợi thêm 1-24 giờ',
                        '',
                        '✅ Nếu thấy nhiều kết quả xanh lá:',
                        '  → DNS đã OK',
                        '  → Có thể domain bị chặn hoặc lỗi khác'
                    ],

                    setupDNS: {
                        title: '3️⃣ Cấu hình DNS (nếu chưa có)',

                        cpanel: [
                            '📘 Với cPanel:',
                            '',
                            '1. Đăng nhập cPanel',
                            '2. Domains → Zone Editor',
                            '3. Click "Manage" bên cạnh domain',
                            '4. Click "+ Add Record"',
                            '5. Chọn Type: A',
                            '6. Điền:',
                            '   • Name: @ (domain gốc)',
                            '   • Address: IP hosting của bạn',
                            '   • TTL: 14400',
                            '7. Click "Add Record"',
                            '8. Đợi 5-60 phút',
                            '',
                            '💡 Không biết IP hosting?',
                            '→ Hỏi support: "Cho em IP của hosting ạ"'
                        ],

                        cloudflare: [
                            '☁️ Với Cloudflare:',
                            '',
                            '1. Đăng nhập https://dash.cloudflare.com',
                            '2. Click domain (nếu đã add)',
                            '3. Vào tab DNS',
                            '4. Click "Add record"',
                            '5. Điền:',
                            '   • Type: A',
                            '   • Name: @',
                            '   • IPv4: IP hosting',
                            '   • Proxy: Bật (màu cam)',
                            '6. Save',
                            '',
                            'Nếu chưa add domain vào Cloudflare:',
                            '1. Click "Add a Site"',
                            '2. Nhập domain → Continue',
                            '3. Chọn Free Plan',
                            '4. Cloudflare sẽ cho 2 nameservers',
                            '5. Copy 2 nameservers',
                            '6. Vào registrar (nơi mua domain)',
                            '7. Đổi nameservers thành của Cloudflare',
                            '8. Đợi 1-24 giờ'
                        ],

                        registrar: [
                            '🏢 Với Registrar (GoDaddy, Namecheap...):',
                            '',
                            '1. Đăng nhập trang mua domain',
                            '2. Vào "My Domains" hoặc "Domain List"',
                            '3. Click "Manage" hoặc "DNS"',
                            '4. Tìm phần DNS Records',
                            '5. Add new record:',
                            '   • Type: A',
                            '   • Host: @ hoặc để trống',
                            '   • Points to: IP hosting',
                            '   • TTL: Automatic',
                            '6. Save',
                            '7. Đợi propagation (1-48 giờ)'
                        ]
                    },

                    waitTime: [
                        '⏰ Thời gian chờ DNS propagation:',
                        '',
                        '• Thường: 5-60 phút',
                        '• Trung bình: 1-4 giờ',
                        '• Tối đa: 24-48 giờ',
                        '',
                        'Trong lúc chờ:',
                        '✅ Kiểm tra trên whatsmydns.net',
                        '✅ Test bằng 4G/5G (không dùng WiFi)',
                        '✅ Thử trình duyệt ẩn danh',
                        '✅ Clear DNS cache:',
                        '   Windows: ipconfig /flushdns',
                        '   Mac: sudo dscacheutil -flushcache'
                    ],

                    commonMistakes: [
                        '⚠️ Những lỗi thường gặp:',
                        '',
                        '❌ Gõ sai tên domain',
                        '   → Kiểm tra lại chính tả',
                        '',
                        '❌ Quên thêm "www"',
                        '   → Thử cả example.com VÀ www.example.com',
                        '',
                        '❌ Nhầm .com với .net hoặc .vn',
                        '   → Verify lại tên domain chính xác',
                        '',
                        '❌ Domain mới mua, chưa trỏ DNS',
                        '   → Phải cấu hình DNS trước',
                        '',
                        '❌ Domain hết hạn',
                        '   → Renew domain ngay',
                        '',
                        '❌ Đang đợi DNS propagation',
                        '   → Kiên nhẫn đợi thêm'
                    ]
                },

                nextSteps: [
                    '📋 Các bước tiếp theo:',
                    '',
                    '1. Verify domain đã đăng ký (whois.com)',
                    '2. Check DNS records (whatsmydns.net)',
                    '3. Nếu chưa có DNS → Cấu hình DNS',
                    '4. Đợi DNS propagation (1-24h)',
                    '5. Quay lại debug sau khi DNS đã OK',
                    '',
                    '💬 Cần trợ giúp?',
                    '→ Liên hệ hosting support:',
                    '"Domain em không có DNS records,',
                    ' nhờ team hướng dẫn cấu hình DNS với ạ!"'
                ]
            }
        };
    }

    // 1. DNS Resolution Check
    await checkDNS(domain, report);

    // 2. Connectivity Check
    await checkConnectivity(domain, report);

    // 3. SSL/TLS Check
    await checkSSL(domain, report);

    // 4. HTTP Response Check
    await checkHTTP(domain, report);

    // 5. Performance Check
    await checkPerformance(domain, report);

    // 6. Configuration Check
    await checkConfiguration(domain, report);

    // Calculate summary
    calculateSummary(report);

    // Generate recommendations
    generateRecommendations(report);

    return report;
}

async function checkDNS(domain, report) {
    const category = 'dns';
    console.log(`[DEBUG] Checking DNS for ${domain}...`);

    try {
        // A Records
        try {
            const addresses = await dns.resolve4(domain);
            report.categories[category].push({
                test: 'A Record Resolution',
                status: 'pass',
                severity: 'info',
                message: `Tìm thấy ${addresses.length} IPv4 address(es)`,
                details: addresses,
                solution: null
            });
        } catch (error) {
            report.categories[category].push({
                test: 'A Record Resolution',
                status: 'fail',
                severity: 'critical',
                message: 'Không thể resolve IPv4 address - Domain không trỏ đến server',
                details: error.message,
                solution: {
                    title: 'Cách sửa: Thêm A Record',
                    forBeginners: true,

                    cpanel: [
                        '🔷 Với cPanel:',
                        '1. Đăng nhập cPanel (thường là: domain.com/cpanel)',
                        '2. Tìm mục "Domains" → Click "Zone Editor"',
                        '3. Tìm domain của bạn, click "Manage"',
                        '4. Click "+ Add Record" → Chọn "A"',
                        '5. Điền thông tin:',
                        '   • Name: @ (hoặc để trống)',
                        '   • Address: Nhập IP của hosting (hỏi support nếu không biết)',
                        '   • TTL: 14400 (mặc định)',
                        '6. Click "Add Record"',
                        '7. Đợi 5-60 phút để DNS cập nhật',
                        '',
                        '💡 Mẹo: Hỏi hosting support "IP address của hosting tôi là gì?"'
                    ],

                    cloudflare: [
                        '☁️ Với Cloudflare:',
                        '1. Đăng nhập https://dash.cloudflare.com',
                        '2. Chọn domain của bạn',
                        '3. Click tab "DNS" ở menu bên trái',
                        '4. Click "Add record"',
                        '5. Điền:',
                        '   • Type: A',
                        '   • Name: @ (cho domain gốc) hoặc www',
                        '   • IPv4 address: IP server của bạn',
                        '   • Proxy status: Bật (màu cam) để bảo vệ',
                        '6. Click "Save"',
                        '7. Đợi vài phút'
                    ],

                    registrar: [
                        '🏢 Với Registrar (Namecheap, GoDaddy, etc.):',
                        '1. Đăng nhập trang registrar mua domain',
                        '2. Vào mục "Manage Domain" hoặc "DNS Management"',
                        '3. Tìm phần "DNS Records" hoặc "Advanced DNS"',
                        '4. Thêm record mới:',
                        '   • Type: A Record',
                        '   • Host: @ hoặc www',
                        '   • Points to: IP address hosting',
                        '   • TTL: Automatic',
                        '5. Save',
                        '6. Đợi propagation (có thể mất vài giờ)'
                    ],

                    howToFind: [
                        '❓ Làm sao biết IP hosting của mình?',
                        '',
                        '• Cách 1: Hỏi hosting support',
                        '  → Email/chat: "IP address của hosting tôi là gì?"',
                        '',
                        '• Cách 2: Xem trong cPanel',
                        '  → Đăng nhập cPanel',
                        '  → Phần bên phải có "Shared IP Address"',
                        '  → Đó là IP bạn cần',
                        '',
                        '• Cách 3: Xem trong email welcome',
                        '  → Khi mua hosting, bạn nhận email',
                        '  → Tìm dòng "Server IP" hoặc "IP Address"'
                    ],

                    reference: 'https://www.youtube.com/results?search_query=how+to+add+A+record+cpanel'
                }
            });
        }

        // AAAA Records
        try {
            const addresses = await dns.resolve6(domain);
            report.categories[category].push({
                test: 'AAAA Record Resolution',
                status: 'pass',
                severity: 'info',
                message: `Tìm thấy ${addresses.length} IPv6 address(es)`,
                details: addresses,
                solution: null
            });
        } catch (error) {
            report.categories[category].push({
                test: 'AAAA Record Resolution',
                status: 'warning',
                severity: 'low',
                message: 'Không có IPv6 address',
                details: 'Website không hỗ trợ IPv6',
                solution: {
                    title: 'Thêm IPv6 Support (Optional)',
                    steps: [
                        '1. Đảm bảo server có IPv6 address',
                        '2. Thêm AAAA record trong DNS:',
                        '   - Name: @ hoặc www',
                        '   - Type: AAAA',
                        '   - Value: IPv6 address của server',
                        '3. Test: dig ' + domain + ' AAAA'
                    ],
                    reference: 'https://www.cloudflare.com/learning/dns/dns-records/dns-aaaa-record/'
                }
            });
        }

        // MX Records
        try {
            const mxRecords = await dns.resolveMx(domain);
            if (mxRecords.length === 0) {
                report.categories[category].push({
                    test: 'MX Records',
                    status: 'warning',
                    severity: 'low',
                    message: 'Không có MX records',
                    details: 'Email không thể gửi đến domain này',
                    solution: {
                        title: 'Cấu hình Email',
                        steps: [
                            '1. Chọn email provider (Gmail, Outlook, etc.)',
                            '2. Thêm MX records theo hướng dẫn provider',
                            '3. Ví dụ Google Workspace:',
                            '   - MX: ASPMX.L.GOOGLE.COM (priority: 1)',
                            '   - MX: ALT1.ASPMX.L.GOOGLE.COM (priority: 5)',
                            '4. Test: dig ' + domain + ' MX'
                        ],
                        reference: 'https://support.google.com/a/answer/140034'
                    }
                });
            } else {
                report.categories[category].push({
                    test: 'MX Records',
                    status: 'pass',
                    severity: 'info',
                    message: `Tìm thấy ${mxRecords.length} MX record(s)`,
                    details: mxRecords,
                    solution: null
                });
            }
        } catch (error) {
            // MX records are optional
        }

        // Nameservers
        try {
            const nameservers = await dns.resolveNs(domain);
            report.categories[category].push({
                test: 'Nameserver Resolution',
                status: 'pass',
                severity: 'info',
                message: `Tìm thấy ${nameservers.length} nameserver(s)`,
                details: nameservers,
                solution: null
            });
        } catch (error) {
            report.categories[category].push({
                test: 'Nameserver Resolution',
                status: 'fail',
                severity: 'critical',
                message: 'Không thể tìm nameservers',
                details: error.message,
                solution: {
                    title: 'Cấu hình Nameservers',
                    steps: [
                        '1. Đăng nhập vào domain registrar',
                        '2. Cập nhật nameservers:',
                        '   - Cloudflare: ns1.cloudflare.com, ns2.cloudflare.com',
                        '   - AWS: ns-xxx.awsdns-xx.com',
                        '   - Tùy theo DNS provider của bạn',
                        '3. Đợi propagation (24-48 giờ)',
                        '4. Test: dig ' + domain + ' NS'
                    ],
                    reference: 'https://www.cloudflare.com/learning/dns/dns-server-types/'
                }
            });
        }

    } catch (error) {
        report.categories[category].push({
            test: 'DNS Check',
            status: 'fail',
            severity: 'critical',
            message: 'DNS check thất bại hoàn toàn',
            details: error.message,
            solution: {
                title: 'Kiểm tra DNS Configuration',
                steps: [
                    '1. Verify domain còn active (chưa expire)',
                    '2. Check nameservers tại registrar',
                    '3. Verify DNS records tại DNS provider',
                    '4. Clear local DNS cache: ipconfig /flushdns (Windows) hoặc sudo dscacheutil -flushcache (Mac)',
                    '5. Test với public DNS: 8.8.8.8 (Google) hoặc 1.1.1.1 (Cloudflare)'
                ],
                reference: 'https://www.whatsmydns.net/'
            }
        });
    }
}

async function checkConnectivity(domain, report) {
    const category = 'connectivity';
    console.log(`[DEBUG] Checking connectivity for ${domain}...`);

    const urlsToTest = [
        { url: `https://${domain}`, protocol: 'HTTPS', priority: 'high' },
        // { url: `https://www.${domain}`, protocol: 'HTTPS with WWW', priority: 'medium' },
        { url: `http://${domain}`, protocol: 'HTTP', priority: 'low' },
        // { url: `http://www.${domain}`, protocol: 'HTTP with WWW', priority: 'low' }
    ];

    let successCount = 0;
    const results = [];

    for (const test of urlsToTest) {
        try {
            const startTime = Date.now();
            const response = await axiosInstance.get(test.url, {
                timeout: 10000,
                maxRedirects: 0,
                validateStatus: () => true
            });
            const responseTime = Date.now() - startTime;

            if (response.status < 400) {
                successCount++;
                results.push({
                    test: `${test.protocol} Connection`,
                    status: 'pass',
                    severity: 'info',
                    message: `Kết nối thành công (${responseTime}ms)`,
                    details: {
                        url: test.url,
                        statusCode: response.status,
                        responseTime: responseTime
                    },
                    solution: null
                });
            } else {
                results.push({
                    test: `${test.protocol} Connection`,
                    status: 'fail',
                    severity: test.priority === 'high' ? 'critical' : 'medium',
                    message: `HTTP ${response.status} - ${getStatusMessage(response.status)}`,
                    details: {
                        url: test.url,
                        statusCode: response.status
                    },
                    solution: getHTTPErrorSolution(response.status, domain)
                });
            }
        } catch (error) {
            results.push({
                test: `${test.protocol} Connection`,
                status: 'fail',
                severity: test.priority === 'high' ? 'critical' : 'low',
                message: `Không thể kết nối: ${error.code || error.message}`,
                details: {
                    url: test.url,
                    error: error.message
                },
                solution: getConnectionErrorSolution(error, domain)
            });
        }
    }

    if (successCount === 0) {
        report.categories[category].push({
            test: 'Overall Connectivity',
            status: 'fail',
            severity: 'critical',
            message: 'KHÔNG THỂ KẾT NỐI VỚI WEBSITE QUA TẤT CẢ CÁC PHƯƠNG THỨC',
            details: 'Đã thử HTTPS, HTTP, với và không có www',
            solution: {
                title: 'Khắc phục website không kết nối được',
                forBeginners: true,

                cpanel: [
                    '🔧 Các bước kiểm tra:',
                    '',
                    '1. Kiểm tra hosting còn hoạt động không:',
                    '   • Đăng nhập hosting panel',
                    '   • Xem status: Active hay Suspended?',
                    '   • Check email có thông báo gì không',
                    '',
                    '2. Kiểm tra DNS đã trỏ đúng chưa:',
                    '   • Vào whatsmydns.net',
                    '   • Nhập domain của bạn',
                    '   • Xem có IP không? IP có đúng không?',
                    '   • Nếu không có IP → Xem hướng dẫn "Thêm A Record"',
                    '',
                    '3. Đợi DNS propagation:',
                    '   • Nếu mới đổi DNS, đợi 1-24 giờ',
                    '   • Test bằng 4G thay vì WiFi',
                    '',
                    '4. Liên hệ hosting support:',
                    '   Website em không kết nối được.',
                    '   Em đã check DNS rồi.',
                    '   Nhờ team kiểm tra server giúp em với ạ!'
                ],

                checkList: [
                    '✅ Checklist:',
                    '',
                    '☐ Hosting đã thanh toán? (check email/hosting panel)',
                    '☐ Domain chưa hết hạn? (check registrar)',
                    '☐ DNS đã trỏ đúng? (whatsmydns.net)',
                    '☐ Thử từ mạng khác? (4G/5G)',
                    '☐ Đã đợi đủ lâu? (nếu mới setup)'
                ],

                reference: 'https://downforeveryoneorjustme.com'
            }
        });
    }

    report.categories[category].push(...results);
}

async function checkSSL(domain, report) {
    const category = 'ssl';
    console.log(`[DEBUG] Checking SSL for ${domain}...`);

    try {
        const response = await axiosInstance.get(`https://${domain}`, {
            timeout: 10000,
            maxRedirects: 5
        });

        report.categories[category].push({
            test: 'SSL/TLS Connection',
            status: 'pass',
            severity: 'info',
            message: 'SSL certificate hoạt động (có thể self-signed)',
            details: 'HTTPS connection successful',
            solution: null
        });

        // Check HSTS
        if (response.headers['strict-transport-security']) {
            report.categories[category].push({
                test: 'HSTS Header',
                status: 'pass',
                severity: 'info',
                message: 'HSTS được cấu hình',
                details: response.headers['strict-transport-security'],
                solution: null
            });
        } else {
            report.categories[category].push({
                test: 'HSTS Header',
                status: 'warning',
                severity: 'medium',
                message: 'Thiếu HSTS header',
                details: 'Website không force HTTPS',
                solution: {
                    title: 'Enable HSTS',
                    steps: [
                        '1. Nginx: Thêm vào server block:',
                        '   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
                        '2. Apache: Thêm vào .htaccess hoặc VirtualHost:',
                        '   Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"',
                        '3. Cloudflare: SSL/TLS → Edge Certificates → Enable HSTS',
                        '4. Test: curl -I https://' + domain + ' | grep Strict'
                    ],
                    reference: 'https://hstspreload.org/'
                }
            });
        }

    } catch (error) {
        if (error.code === 'EPROTO' || error.message.includes('SSL') || error.message.includes('CERT')) {
            report.categories[category].push({
                test: 'SSL/TLS Connection',
                status: 'fail',
                severity: 'critical',
                message: 'SSL certificate không hợp lệ',
                details: error.message,
                solution: {
                    title: 'Cài đặt SSL Certificate',
                    steps: [
                        '1. Sử dụng Let\'s Encrypt (FREE):',
                        '   sudo apt install certbot python3-certbot-nginx',
                        '   sudo certbot --nginx -d ' + domain + ' -d www.' + domain,
                        '2. Hoặc mua SSL từ:',
                        '   - Cloudflare (Free)',
                        '   - DigiCert',
                        '   - GlobalSign',
                        '3. Verify certificate:',
                        '   openssl s_client -connect ' + domain + ':443',
                        '4. Set auto-renewal:',
                        '   sudo certbot renew --dry-run'
                    ],
                    reference: 'https://letsencrypt.org/getting-started/'
                }
            });
        } else {
            report.categories[category].push({
                test: 'SSL/TLS Connection',
                status: 'fail',
                severity: 'high',
                message: 'Không thể kết nối HTTPS',
                details: error.message,
                solution: {
                    title: 'Enable HTTPS',
                    steps: [
                        '1. Cài đặt SSL certificate (xem hướng dẫn trên)',
                        '2. Configure web server cho HTTPS:',
                        '   Nginx: listen 443 ssl;',
                        '   Apache: <VirtualHost *:443>',
                        '3. Redirect HTTP sang HTTPS:',
                        '   Nginx: return 301 https://$server_name$request_uri;',
                        '   Apache: RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]',
                        '4. Open port 443 on firewall',
                        '5. Test: curl -I https://' + domain
                    ],
                    reference: 'https://certbot.eff.org/'
                }
            });
        }
    }
}

async function checkHTTP(domain, report) {
    const category = 'http';
    console.log(`[DEBUG] Checking HTTP response for ${domain}...`);

    try {
        const response = await axiosInstance.get(`https://${domain}`, {
            timeout: 15000,
            maxRedirects: 10,
            validateStatus: () => true
        });

        // Status code check
        if (response.status >= 200 && response.status < 300) {
            report.categories[category].push({
                test: 'HTTP Status Code',
                status: 'pass',
                severity: 'info',
                message: `Status ${response.status} - OK`,
                details: response.statusText,
                solution: null
            });
        } else if (response.status >= 300 && response.status < 400) {
            report.categories[category].push({
                test: 'HTTP Status Code',
                status: 'warning',
                severity: 'medium',
                message: `Status ${response.status} - Redirect`,
                details: `Location: ${response.headers.location || 'N/A'}`,
                solution: null
            });
        } else if (response.status >= 400 && response.status < 500) {
            report.categories[category].push({
                test: 'HTTP Status Code',
                status: 'fail',
                severity: 'high',
                message: `Status ${response.status} - Client Error`,
                details: getStatusMessage(response.status),
                solution: getHTTPErrorSolution(response.status, domain)
            });
        } else {
            report.categories[category].push({
                test: 'HTTP Status Code',
                status: 'fail',
                severity: 'critical',
                message: `Status ${response.status} - Server Error`,
                details: getStatusMessage(response.status),
                solution: getHTTPErrorSolution(response.status, domain)
            });
        }

        // Content-Type check
        const contentType = response.headers['content-type'];
        if (contentType) {
            report.categories[category].push({
                test: 'Content-Type Header',
                status: 'pass',
                severity: 'info',
                message: 'Content-Type được set',
                details: contentType,
                solution: null
            });
        } else {
            report.categories[category].push({
                test: 'Content-Type Header',
                status: 'warning',
                severity: 'low',
                message: 'Thiếu Content-Type header',
                details: 'Browser có thể hiển thị sai',
                solution: {
                    title: 'Set Content-Type',
                    steps: [
                        'Nginx: default_type text/html;',
                        'Apache: AddDefaultCharset UTF-8',
                        'PHP: header("Content-Type: text/html; charset=UTF-8");'
                    ]
                }
            });
        }

    } catch (error) {
        report.categories[category].push({
            test: 'HTTP Response',
            status: 'fail',
            severity: 'critical',
            message: 'Không nhận được HTTP response',
            details: error.message,
            solution: getConnectionErrorSolution(error, domain)
        });
    }
}

async function checkPerformance(domain, report) {
    const category = 'performance';
    console.log(`[DEBUG] Checking performance for ${domain}...`);

    try {
        const startTime = Date.now();
        const response = await axiosInstance.get(`https://${domain}`, {
            timeout: 30000,
            maxRedirects: 5
        });
        const totalTime = Date.now() - startTime;

        // Response time
        if (totalTime < 1000) {
            report.categories[category].push({
                test: 'Response Time',
                status: 'pass',
                severity: 'info',
                message: `Rất nhanh: ${totalTime}ms`,
                details: 'Website phản hồi dưới 1 giây',
                solution: null
            });
        } else if (totalTime < 3000) {
            report.categories[category].push({
                test: 'Response Time',
                status: 'warning',
                severity: 'low',
                message: `Chấp nhận được: ${totalTime}ms`,
                details: 'Có thể cải thiện performance',
                solution: {
                    title: 'Tối ưu Performance',
                    steps: [
                        '1. Enable caching:',
                        '   - Browser caching',
                        '   - Server-side caching (Redis, Memcached)',
                        '2. Use CDN (Cloudflare, CloudFront)',
                        '3. Optimize images (WebP format)',
                        '4. Minify CSS/JS',
                        '5. Enable Gzip compression'
                    ],
                    reference: 'https://web.dev/fast/'
                }
            });
        } else {
            report.categories[category].push({
                test: 'Response Time',
                status: 'fail',
                severity: 'medium',
                message: `Quá chậm: ${totalTime}ms`,
                details: 'Website cần tối ưu performance',
                solution: {
                    title: 'Cải thiện Performance Khẩn cấp',
                    steps: [
                        '1. Check server resources:',
                        '   - CPU usage',
                        '   - RAM usage',
                        '   - Disk I/O',
                        '2. Optimize database queries',
                        '3. Enable caching layers',
                        '4. Use CDN',
                        '5. Upgrade server nếu cần',
                        '6. Consider load balancing'
                    ],
                    reference: 'https://gtmetrix.com/'
                }
            });
        }

        // Content size
        const contentLength = response.headers['content-length'];
        if (contentLength) {
            const sizeInKB = parseInt(contentLength) / 1024;
            if (sizeInKB < 100) {
                report.categories[category].push({
                    test: 'Page Size',
                    status: 'pass',
                    severity: 'info',
                    message: `Tối ưu: ${sizeInKB.toFixed(2)} KB`,
                    details: 'Kích thước trang nhỏ gọn',
                    solution: null
                });
            } else if (sizeInKB < 500) {
                report.categories[category].push({
                    test: 'Page Size',
                    status: 'warning',
                    severity: 'low',
                    message: `Trung bình: ${sizeInKB.toFixed(2)} KB`,
                    details: 'Có thể giảm kích thước',
                    solution: {
                        title: 'Giảm Page Size',
                        steps: [
                            '1. Optimize images',
                            '2. Minify CSS/JS',
                            '3. Remove unused code',
                            '4. Lazy load images'
                        ]
                    }
                });
            } else {
                report.categories[category].push({
                    test: 'Page Size',
                    status: 'fail',
                    severity: 'medium',
                    message: `Quá lớn: ${sizeInKB.toFixed(2)} KB`,
                    details: 'Trang nặng, load chậm',
                    solution: {
                        title: 'Optimize Page Size',
                        steps: [
                            '1. Compress images aggressively',
                            '2. Split code bundles',
                            '3. Use lazy loading',
                            '4. Remove unnecessary libraries',
                            '5. Use modern image formats (WebP, AVIF)'
                        ]
                    }
                });
            }
        }

    } catch (error) {
        // Performance check failed - already logged in connectivity
    }
}

async function checkConfiguration(domain, report) {
    const category = 'configuration';
    console.log(`[DEBUG] Checking configuration for ${domain}...`);

    try {
        const response = await axiosInstance.get(`https://${domain}`, {
            timeout: 10000,
            maxRedirects: 5
        });

        // Server header
        const server = response.headers['server'];
        if (server) {
            if (server.includes('/') || /\d+\.\d+/.test(server)) {
                report.categories[category].push({
                    test: 'Server Header',
                    status: 'warning',
                    severity: 'low',
                    message: 'Server header tiết lộ version',
                    details: server,
                    solution: {
                        title: 'Ẩn Server Version',
                        steps: [
                            'Nginx: server_tokens off; trong nginx.conf',
                            'Apache: ServerTokens Prod trong httpd.conf',
                            'Restart web server'
                        ]
                    }
                });
            }
        }

        // X-Powered-By header
        if (response.headers['x-powered-by']) {
            report.categories[category].push({
                test: 'X-Powered-By Header',
                status: 'warning',
                severity: 'low',
                message: 'Tiết lộ technology stack',
                details: response.headers['x-powered-by'],
                solution: {
                    title: 'Remove X-Powered-By',
                    steps: [
                        'PHP: expose_php = Off trong php.ini',
                        'Express: app.disable("x-powered-by");',
                        'ASP.NET: <httpProtocol><customHeaders><remove name="X-Powered-By" /></customHeaders></httpProtocol>'
                    ]
                }
            });
        }

    } catch (error) {
        // Config check failed
    }
}

function calculateSummary(report) {
    for (const category in report.categories) {
        report.categories[category].forEach(check => {
            if (check.status === 'fail') {
                report.summary.totalIssues++;
                if (check.severity === 'critical') {
                    report.summary.criticalIssues++;
                }
            } else if (check.status === 'warning') {
                report.summary.totalIssues++;
                report.summary.warnings++;
            } else if (check.status === 'pass') {
                report.summary.passed++;
            }
        });
    }
}

function generateRecommendations(report) {
    if (report.summary.criticalIssues > 0) {
        report.recommendations.push({
            priority: 'critical',
            title: 'KHẮC PHỤC LỖI NGHIÊM TRỌNG NGAY',
            description: `Website có ${report.summary.criticalIssues} lỗi nghiêm trọng cần xử lý ưu tiên.`,
            action: 'Xem chi tiết trong các categories bên dưới và làm theo hướng dẫn Solution.'
        });
    }

    if (report.summary.warnings > 3) {
        report.recommendations.push({
            priority: 'high',
            title: 'Cải thiện Configuration',
            description: `Website có ${report.summary.warnings} cảnh báo về configuration và security.`,
            action: 'Review tất cả warnings và implement các best practices được đề xuất.'
        });
    }

    if (report.summary.passed > 0 && report.summary.totalIssues === 0) {
        report.recommendations.push({
            priority: 'low',
            title: 'Website hoạt động tốt!',
            description: 'Tất cả kiểm tra đều passed.',
            action: 'Duy trì monitoring và regular updates.'
        });
    }
}

// Helper functions
function getStatusMessage(statusCode) {
    const messages = {
        400: 'Bad Request - Yêu cầu không hợp lệ',
        401: 'Unauthorized - Cần authentication',
        403: 'Forbidden - Không có quyền truy cập',
        404: 'Not Found - Không tìm thấy trang',
        500: 'Internal Server Error - Lỗi server',
        502: 'Bad Gateway - Gateway lỗi',
        503: 'Service Unavailable - Service không khả dụng',
        504: 'Gateway Timeout - Gateway timeout'
    };
    return messages[statusCode] || `HTTP ${statusCode}`;
}

function getHTTPErrorSolution(statusCode, domain) {
    const solutions = {
        404: {
            title: 'Sửa lỗi 404 - Không tìm thấy trang',
            forBeginners: true,

            cpanel: [
                '📘 Cách sửa trong cPanel:',
                '',
                '1. Đăng nhập cPanel (domain.com/cpanel)',
                '2. Click "File Manager" (mục Files)',
                '3. Mở thư mục "public_html"',
                '4. Kiểm tra xem có file index.html hoặc index.php không',
                '',
                '❌ Nếu KHÔNG có file:',
                '   → Website bạn chưa upload',
                '   → Click "Upload" và upload file website',
                '',
                '✅ Nếu CÓ file nhưng vẫn lỗi:',
                '   → Click chuột phải file → Permissions',
                '   → Đặt là 644 → Save',
                '',
                '💡 Mẹo: File chính phải tên là index.php hoặc index.html'
            ],

            wordpress: [
                '📝 Nếu dùng WordPress:',
                '',
                '1. Vào WordPress Admin (/wp-admin)',
                '2. Vào Settings → Permalinks',
                '3. Click "Save Changes" (không cần đổi gì)',
                '4. Refresh website',
                '',
                'Hoặc:',
                '1. Vào cPanel → File Manager',
                '2. Tìm file .htaccess trong public_html',
                '3. Xóa file .htaccess',
                '4. Vào WordPress Admin → Settings → Permalinks',
                '5. Click Save Changes (sẽ tạo .htaccess mới)'
            ],

            checkFirst: [
                '🔍 Kiểm tra trước khi sửa:',
                '',
                '• URL có đúng không? (kiểm tra chính tả)',
                '• Đang truy cập http hay https?',
                '• Có dấu / ở cuối không? (thử thêm/bớt dấu /)'
            ],

            reference: 'https://www.youtube.com/results?search_query=cpanel+fix+404+error'
        },
        403: {
            title: 'Sửa lỗi 403 - Không có quyền truy cập',
            forBeginners: true,

            cpanel: [
                '🔓 Cách mở quyền truy cập:',
                '',
                '1. Đăng nhập cPanel',
                '2. File Manager → public_html',
                '3. Click chuột phải vào file index.php/html',
                '4. Chọn "Permissions" hoặc "Change Permissions"',
                '5. Nhập số 644 → Click Change',
                '',
                'Với thư mục:',
                '1. Click chuột phải vào thư mục',
                '2. Permissions → Nhập 755',
                '',
                '💡 Giải thích:',
                '   644 = File có thể đọc',
                '   755 = Thư mục có thể mở'
            ],

            htaccess: [
                '📄 Kiểm tra file .htaccess:',
                '',
                '1. Vào File Manager trong cPanel',
                '2. Bật "Show Hidden Files" (góc trên)',
                '3. Tìm file .htaccess',
                '4. Click chuột phải → Rename',
                '5. Đổi thành .htaccess.bak',
                '6. Refresh website',
                '',
                'Nếu website chạy:',
                '→ File .htaccess có vấn đề',
                '→ Tạo file .htaccess mới hoặc restore backup'
            ],

            quickFix: [
                '⚡ Sửa nhanh:',
                '',
                'Cách 1: Reset permissions tất cả',
                '1. File Manager → chọn public_html',
                '2. Click chuột phải → Change Permissions',
                '3. Bật "Recurse into subdirectories"',
                '4. Files: 644, Folders: 755',
                '',
                'Cách 2: Xóa file .htaccess xem website chạy không'
            ],

            reference: 'https://www.youtube.com/results?search_query=fix+403+forbidden+cpanel'
        },
        500: {
            title: 'Sửa lỗi 500 - Lỗi Server',
            forBeginners: true,

            cpanel: [
                '🔧 Các bước xử lý:',
                '',
                'Bước 1: Xem Error Log',
                '1. cPanel → Metrics → Errors',
                '2. Cuộn xuống dưới xem lỗi gần nhất',
                '3. Chụp màn hình lỗi',
                '',
                'Bước 2: Kiểm tra .htaccess',
                '1. File Manager → public_html',
                '2. Bật "Show Hidden Files"',
                '3. Đổi tên .htaccess → .htaccess.bak',
                '4. Refresh website',
                '   ✅ Chạy → .htaccess bị lỗi',
                '   ❌ Vẫn lỗi → Tiếp bước 3',
                '',
                'Bước 3: Check PHP version',
                '1. cPanel → Software → Select PHP Version',
                '2. Đổi sang PHP 7.4 hoặc 8.0',
                '3. Save → Refresh website'
            ],

            wordpress: [
                '📝 Nếu dùng WordPress:',
                '',
                '1. Tắt tất cả plugins:',
                '   • File Manager → wp-content',
                '   • Đổi tên thư mục "plugins" → "plugins.bak"',
                '   • Refresh website',
                '   • Nếu chạy → 1 plugin nào đó gây lỗi',
                '   • Đổi lại tên "plugins"',
                '   • Tắt từng plugin để tìm plugin lỗi',
                '',
                '2. Đổi theme:',
                '   • File Manager → wp-content/themes',
                '   • Đổi tên theme hiện tại',
                '   • Website sẽ dùng theme mặc định',
                '   • Nếu chạy → Theme gây lỗi'
            ],

            lastResort: [
                '🆘 Nếu vẫn không xong:',
                '',
                '1. Restore backup (nếu có):',
                '   • cPanel → Files → Backup',
                '   • Download backup gần nhất',
                '   • Restore',
                '',
                '2. Tăng PHP Memory:',
                '   • cPanel → Software → MultiPHP INI Editor',
                '   • Tìm "memory_limit"',
                '   • Đổi thành 256M hoặc 512M',
                '',
                '3. Liên hệ Support:',
                '   "Website em bị lỗi 500, em đã thử tất cả cách nhưng không được. Nhờ team hỗ trợ với ạ!"',
                '   (Kèm screenshot error log)'
            ],

            reference: 'https://www.youtube.com/results?search_query=fix+500+internal+server+error+cpanel'
        },
        502: {
            title: 'Sửa lỗi 502 - Bad Gateway',
            forBeginners: true,

            cpanel: [
                '🔌 Lỗi 502 thường do:',
                '• PHP-FPM bị tắt hoặc lỗi',
                '• Website quá tải',
                '• Timeout',
                '',
                'Cách sửa:',
                '',
                '1. Đợi 2-3 phút rồi refresh',
                '   (Đôi khi tự hết)',
                '',
                '2. Restart PHP:',
                '   • Liên hệ support:',
                '   "Website em bị lỗi 502, có thể restart PHP-FPM giúp em được không ạ?"',
                '',
                '3. Nếu dùng WordPress:',
                '   • Tắt plugin cache',
                '   • Clear cache browser',
                '   • Thử lại'
            ],

            prevent: [
                '🛡️ Phòng tránh:',
                '',
                '• Tắt plugin không dùng',
                '• Không cài quá nhiều plugin',
                '• Dùng CDN (Cloudflare)',
                '• Nâng cấp hosting nếu traffic cao'
            ],

            reference: 'https://www.youtube.com/results?search_query=fix+502+bad+gateway'
        },
        503: {
            title: 'Sửa lỗi 503 - Service Unavailable',
            forBeginners: true,

            reasons: [
                '❓ Tại sao bị 503?',
                '',
                '• Website đang bảo trì',
                '• Hosting quá tải',
                '• Vượt giới hạn resources',
                '• Server tạm thời offline'
            ],

            cpanel: [
                '🔧 Cách kiểm tra:',
                '',
                '1. Check hosting status:',
                '   • Đăng nhập hosting panel',
                '   • Xem có thông báo nào không',
                '   • Check email có cảnh báo gì',
                '',
                '2. Check resource usage:',
                '   • cPanel → Metrics → CPU and Concurrent Connection Usage',
                '   • Nếu vượt quá 100% → Quá tải',
                '',
                '3. Disable maintenance mode:',
                '   • File Manager → tìm file .maintenance',
                '   • Xóa file này',
                '   • Refresh website'
            ],

            quickFix: [
                '⚡ Sửa nhanh:',
                '',
                '1. Đợi 5-10 phút (thường tự hết)',
                '',
                '2. Clear cache:',
                '   • Tắt plugin cache (WP)',
                '   • Clear browser cache',
                '',
                '3. Liên hệ hosting support:',
                '   "Website em bị lỗi 503, có phải server đang bảo trì không ạ?"'
            ],

            upgrade: [
                '📈 Nếu thường xuyên bị 503:',
                '',
                '→ Hosting không đủ mạnh',
                '→ Cần nâng cấp gói hosting',
                '→ Hoặc chuyển sang VPS/Cloud'
            ],

            reference: 'https://www.youtube.com/results?search_query=fix+503+service+unavailable'
        }
    };

    return solutions[statusCode] || {
        title: `Lỗi HTTP ${statusCode}`,
        forBeginners: true,
        general: [
            '📞 Cách xử lý chung:',
            '',
            '1. Chụp màn hình lỗi',
            '2. Google: "HTTP ' + statusCode + ' error" để hiểu thêm',
            '3. Liên hệ hosting support với screenshot',
            '4. Hoặc liên hệ developer nếu bạn có',
            '',
            '💬 Gửi support:',
            '"Website em bị lỗi ' + statusCode + ', em đính kèm screenshot. Nhờ team hỗ trợ với ạ!"'
        ],
        reference: 'https://httpstatuses.com/' + statusCode
    };
}

function getConnectionErrorSolution(error, domain) {
    const errorCode = error.code || error.message;

    if (errorCode.includes('ECONNREFUSED')) {
        return {
            title: 'Connection Refused - Server từ chối kết nối',
            forBeginners: true,

            cpanel: [
                '🔌 Nguyên nhân & Cách sửa:',
                '',
                '1. Web server không chạy:',
                '   → Liên hệ hosting support:',
                '   "Web server có đang chạy không ạ? Website em không kết nối được."',
                '',
                '2. Port bị block:',
                '   → Hỏi support: "Port 80 và 443 đã mở chưa ạ?"',
                '',
                '3. DNS chưa trỏ đúng:',
                '   → Xem hướng dẫn "Thêm A Record" ở trên',
                '',
                '4. Firewall block:',
                '   → Support sẽ kiểm tra giúp bạn'
            ],

            quickCheck: [
                '✅ Kiểm tra nhanh:',
                '',
                '1. Vào downforeveryoneorjustme.com',
                '2. Nhập domain của bạn',
                '3. Xem kết quả:',
                '   • "Just you" → Vấn đề ở mạng/máy bạn',
                '   • "Everyone" → Website thực sự down'
            ],

            reference: 'https://www.youtube.com/results?search_query=website+connection+refused+fix'
        };
    }

    if (errorCode.includes('ETIMEDOUT')) {
        return {
            title: 'Connection Timeout - Kết nối quá lâu',
            forBeginners: true,

            reasons: [
                '❓ Tại sao timeout?',
                '',
                '• Server quá chậm',
                '• Hosting down',
                '• Firewall block',
                '• Network issue'
            ],

            cpanel: [
                '🔧 Cách xử lý:',
                '',
                '1. Đợi 5 phút rồi thử lại',
                '',
                '2. Check hosting status:',
                '   → Đăng nhập hosting panel',
                '   → Xem có thông báo maintenance không',
                '',
                '3. Liên hệ support:',
                '   "Website em timeout, có phải server đang quá tải không ạ?"',
                '',
                '4. Check từ nơi khác:',
                '   → Thử 4G/5G thay vì WiFi',
                '   → Hoặc dùng VPN'
            ],

            reference: 'https://downforeveryoneorjustme.com'
        };
    }

    if (errorCode.includes('ENOTFOUND')) {
        return {
            title: 'DNS Not Found - Không tìm thấy DNS',
            forBeginners: true,

            cpanel: [
                '🌐 Domain chưa có DNS:',
                '',
                '→ Xem hướng dẫn "Thêm A Record" phía trên',
                '',
                'Hoặc:',
                '1. Vào whatsmydns.net',
                '2. Nhập domain',
                '3. Xem có IP không',
                '   • Không có IP → Thêm A Record',
                '   • Có IP → Đợi thêm vài phút (DNS propagation)'
            ],

            reference: 'https://whatsmydns.net'
        };
    }

    return {
        title: 'Lỗi kết nối',
        forBeginners: true,

        general: [
            '📞 Liên hệ Support:',
            '',
            '"Website em không kết nối được, lỗi: ' + errorCode + '.',
            'Nhờ team kiểm tra giúp em với ạ!"',
            '',
            '(Kèm screenshot nếu có)'
        ]
    };
}

module.exports = { debugWebsite };
