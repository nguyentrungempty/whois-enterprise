const BEGINNER_SOLUTIONS = {

    DNS_A_RECORD_MISSING: {
        problem: 'Website không trỏ đến server (thiếu A Record)',
        explain: 'Domain của bạn chưa được "kết nối" với hosting. Giống như bạn có số điện thoại nhưng chưa gắn SIM vậy.',

        cpanel: {
            title: '📘 Hướng dẫn với cPanel',
            screenshots: true,
            steps: [{
                    step: 1,
                    title: 'Đăng nhập cPanel',
                    detail: 'Vào địa chỉ: domain-cua-ban.com/cpanel',
                    tips: 'Không nhớ link? Kiểm tra email "Welcome" từ hosting hoặc hỏi support'
                },
                {
                    step: 2,
                    title: 'Tìm Zone Editor',
                    detail: 'Cuộn xuống → tìm mục "Domains" → Click "Zone Editor"',
                    tips: 'Không thấy? Gõ "Zone Editor" vào ô tìm kiếm ở góc trên'
                },
                {
                    step: 3,
                    title: 'Quản lý DNS',
                    detail: 'Tìm domain của bạn trong danh sách → Click nút "Manage"',
                    tips: 'Nếu có nhiều domain, chọn đúng domain bạn muốn sửa'
                },
                {
                    step: 4,
                    title: 'Thêm A Record',
                    detail: 'Click "+ Add Record" → Chọn Type là "A"',
                    inputs: [{
                            label: 'Name',
                            value: '@ (hoặc để trống)',
                            meaning: '@ nghĩa là domain gốc (example.com)'
                        },
                        {
                            label: 'Address',
                            value: 'IP của hosting',
                            meaning: 'Ví dụ: 103.166.183.220 - Hỏi support nếu không biết'
                        },
                        {
                            label: 'TTL',
                            value: '14400 (để mặc định)',
                            meaning: 'Thời gian DNS cache, không cần đổi'
                        }
                    ]
                },
                {
                    step: 5,
                    title: 'Lưu lại',
                    detail: 'Click "Add Record" → Đợi 5-60 phút để DNS cập nhật',
                    tips: 'Test sau 10 phút: vào whatsmydns.net gõ domain xem đã có IP chưa'
                }
            ],
            video: 'https://www.youtube.com/results?search_query=cpanel+add+A+record+tutorial'
        },

        cloudflare: {
            title: '☁️ Hướng dẫn với Cloudflare',
            steps: [{
                    step: 1,
                    title: 'Đăng nhập Cloudflare',
                    detail: 'Vào https://dash.cloudflare.com và đăng nhập'
                },
                {
                    step: 2,
                    title: 'Chọn Domain',
                    detail: 'Click vào domain bạn muốn cấu hình từ danh sách'
                },
                {
                    step: 3,
                    title: 'Vào DNS Settings',
                    detail: 'Click tab "DNS" ở menu bên trái',
                    tips: 'Bạn sẽ thấy danh sách các DNS records'
                },
                {
                    step: 4,
                    title: 'Thêm Record',
                    detail: 'Click "Add record"',
                    inputs: [{
                            label: 'Type',
                            value: 'A',
                            meaning: 'Chọn A từ dropdown'
                        },
                        {
                            label: 'Name',
                            value: '@ hoặc www',
                            meaning: '@ = domain.com, www = www.domain.com'
                        },
                        {
                            label: 'IPv4 address',
                            value: 'IP hosting của bạn',
                            meaning: 'Ví dụ: 103.166.183.220'
                        },
                        {
                            label: 'Proxy status',
                            value: 'Bật (màu cam)',
                            meaning: 'Bật để Cloudflare bảo vệ website'
                        }
                    ]
                },
                {
                    step: 5,
                    title: 'Lưu',
                    detail: 'Click "Save" → Website sẽ hoạt động sau vài phút'
                }
            ],
            video: 'https://www.youtube.com/results?search_query=cloudflare+add+dns+record'
        },

        namecheap: {
            title: '🏢 Hướng dẫn với Namecheap',
            steps: [{
                    step: 1,
                    title: 'Đăng nhập',
                    detail: 'Vào namecheap.com → Sign In'
                },
                {
                    step: 2,
                    title: 'Domain List',
                    detail: 'Click "Domain List" ở menu trên'
                },
                {
                    step: 3,
                    title: 'Manage Domain',
                    detail: 'Click nút "Manage" bên cạnh domain của bạn'
                },
                {
                    step: 4,
                    title: 'Advanced DNS',
                    detail: 'Click tab "Advanced DNS"'
                },
                {
                    step: 5,
                    title: 'Add Record',
                    detail: 'Click "ADD NEW RECORD"',
                    inputs: [{
                            label: 'Type',
                            value: 'A Record'
                        },
                        {
                            label: 'Host',
                            value: '@ (cho domain gốc) hoặc www'
                        },
                        {
                            label: 'Value',
                            value: 'IP hosting'
                        },
                        {
                            label: 'TTL',
                            value: 'Automatic'
                        }
                    ]
                },
                {
                    step: 6,
                    title: 'Save',
                    detail: 'Click dấu ✓ xanh để save'
                }
            ]
        },

        findIP: {
            title: '❓ Tìm IP hosting ở đâu?',
            methods: [{
                    method: 'Hỏi Support (Dễ nhất)',
                    steps: [
                        '1. Mở chat/ticket support của hosting',
                        '2. Gõ: "Cho em xin IP address của hosting ạ"',
                        '3. Copy IP họ gửi (dạng: 103.166.183.220)'
                    ],
                    emoji: '💬'
                },
                {
                    method: 'Xem trong cPanel',
                    steps: [
                        '1. Đăng nhập cPanel',
                        '2. Nhìn cột bên phải',
                        '3. Tìm dòng "Shared IP Address" hoặc "Dedicated IP"',
                        '4. Đó là IP bạn cần'
                    ],
                    emoji: '🖥️'
                },
                {
                    method: 'Kiểm tra Email Welcome',
                    steps: [
                        '1. Mở email từ hosting (khi mới đăng ký)',
                        '2. Tìm chữ "Server IP" hoặc "IP Address"',
                        '3. IP thường có dạng: 103.166.183.220'
                    ],
                    emoji: '📧'
                },
                {
                    method: 'Xem trong Hosting Panel',
                    steps: [
                        '1. Đăng nhập hosting control panel',
                        '2. Vào mục "Account Details" hoặc "Server Information"',
                        '3. Tìm "IP Address"'
                    ],
                    emoji: '⚙️'
                }
            ]
        }
    },

    SSL_CERTIFICATE_ERROR: {
        problem: 'Website không có SSL hoặc SSL lỗi',
        explain: 'SSL giống như "khóa bảo mật" cho website. Không có SSL thì trình duyệt hiện "Not Secure", người dùng không tin tưởng.',

        cpanel: {
            title: '🔒 Cài SSL miễn phí với cPanel',
            note: 'Hầu hết hosting hiện nay đều có SSL miễn phí từ Let\'s Encrypt',
            steps: [{
                    step: 1,
                    title: 'Đăng nhập cPanel',
                    detail: 'Vào domain.com/cpanel'
                },
                {
                    step: 2,
                    title: 'Tìm SSL/TLS',
                    detail: 'Cuộn xuống → mục "Security" → Click "SSL/TLS Status"',
                    tips: 'Hoặc gõ "SSL" vào ô tìm kiếm'
                },
                {
                    step: 3,
                    title: 'Auto Install SSL',
                    detail: 'Tìm domain của bạn → Click "Run AutoSSL"',
                    tips: 'AutoSSL sẽ tự động cài Let\'s Encrypt (miễn phí)'
                },
                {
                    step: 4,
                    title: 'Đợi cài đặt',
                    detail: 'Chờ 1-2 phút → Xong! Website đã có HTTPS',
                    tips: 'Test bằng cách vào https://domain.com'
                }
            ],
            troubleshoot: [{
                    issue: 'Không thấy nút "Run AutoSSL"',
                    solution: 'Liên hệ support hosting: "Em muốn cài SSL miễn phí cho domain xxx"'
                },
                {
                    issue: 'AutoSSL báo lỗi',
                    solution: 'Kiểm tra DNS đã trỏ đúng chưa (xem phần A Record ở trên)'
                },
                {
                    issue: 'Website vẫn hiện Not Secure',
                    solution: [
                        '1. Đợi thêm 5-10 phút',
                        '2. Clear cache browser (Ctrl+Shift+Delete)',
                        '3. Thử trình duyệt ẩn danh (Incognito)'
                    ]
                }
            ],
            video: 'https://www.youtube.com/results?search_query=cpanel+install+free+ssl+certificate'
        },

        cloudflare: {
            title: '☁️ Bật SSL với Cloudflare',
            note: 'Cloudflare cung cấp SSL miễn phí tự động!',
            steps: [{
                    step: 1,
                    title: 'Đăng nhập Cloudflare',
                    detail: 'Vào dash.cloudflare.com'
                },
                {
                    step: 2,
                    title: 'Chọn Domain',
                    detail: 'Click domain trong danh sách'
                },
                {
                    step: 3,
                    title: 'SSL/TLS Settings',
                    detail: 'Click tab "SSL/TLS" ở menu trái'
                },
                {
                    step: 4,
                    title: 'Chọn Mode',
                    detail: 'Chọn "Full" hoặc "Full (strict)"',
                    explain: {
                        'Off': '❌ Không SSL (không dùng)',
                        'Flexible': '⚠️ Chỉ SSL từ user đến Cloudflare (không an toàn)',
                        'Full': '✅ SSL cả 2 chiều (dùng cái này nếu hosting có SSL)',
                        'Full (strict)': '✅✅ SSL nghiêm ngặt (tốt nhất, nhưng cần hosting có valid SSL)'
                    }
                },
                {
                    step: 5,
                    title: 'Bật Always Use HTTPS',
                    detail: 'Vào tab "Edge Certificates" → Bật "Always Use HTTPS"',
                    meaning: 'Tự động chuyển HTTP sang HTTPS'
                }
            ],
            tips: [
                'Nếu website vẫn lỗi, chọn mode "Flexible" tạm thời',
                'Sau đó cài SSL ở hosting, rồi chuyển sang "Full"'
            ],
            video: 'https://www.youtube.com/results?search_query=cloudflare+enable+ssl'
        },

        manualInstall: {
            title: '📝 Nếu hosting không có Auto SSL',
            steps: [{
                    step: 1,
                    title: 'Liên hệ Support',
                    detail: 'Gửi ticket/chat: "Em muốn cài SSL miễn phí cho domain xxx, hosting có hỗ trợ không ạ?"'
                },
                {
                    step: 2,
                    title: 'Họ sẽ cài giúp',
                    detail: 'Hầu hết hosting đều cài SSL miễn phí trong vài phút'
                },
                {
                    step: 3,
                    title: 'Nếu họ không hỗ trợ',
                    options: [
                        'Chuyển sang Cloudflare (miễn phí)',
                        'Mua SSL từ hosting ($5-10/năm)',
                        'Đổi sang hosting khác có SSL miễn phí'
                    ]
                }
            ]
        }
    },

    WEBSITE_DOWN: {
        problem: 'Website không thể truy cập',
        explain: 'Có nhiều nguyên nhân: hosting down, code lỗi, tài khoản bị khóa, domain expire...',

        checkList: {
            title: '✅ Checklist xử lý website down',
            items: [{
                    check: 'Hosting còn active không?',
                    how: [
                        '1. Đăng nhập trang hosting',
                        '2. Xem trạng thái: Active hay Suspended?',
                        '3. Kiểm tra hạn thanh toán đã hết chưa'
                    ],
                    fix: 'Nếu hết hạn → Gia hạn hosting'
                },
                {
                    check: 'Domain còn hoạt động không?',
                    how: [
                        '1. Đăng nhập registrar (nơi mua domain)',
                        '2. Xem expiration date',
                        '3. Kiểm tra trạng thái domain'
                    ],
                    fix: 'Nếu expired → Renew domain ngay (có thể mất domain nếu trễ)'
                },
                {
                    check: 'DNS có trỏ đúng không?',
                    how: [
                        '1. Vào whatsmydns.net',
                        '2. Nhập domain',
                        '3. Xem có IP không? IP có đúng không?'
                    ],
                    fix: 'Không có IP → Xem hướng dẫn thêm A Record ở trên'
                },
                {
                    check: 'Hosting có down không?',
                    how: [
                        '1. Vào downforeveryoneorjustme.com',
                        '2. Nhập domain',
                        '3. Xem kết quả'
                    ],
                    fix: 'Nếu down for everyone → Liên hệ hosting support ngay'
                },
                {
                    check: 'Có thông báo lỗi gì không?',
                    errors: {
                        '404 Not Found': 'File bị xóa hoặc đường dẫn sai',
                        '403 Forbidden': 'Không có quyền truy cập',
                        '500 Internal Error': 'Code lỗi hoặc thiếu thư viện',
                        '502 Bad Gateway': 'Server quá tải hoặc PHP-FPM lỗi',
                        '503 Service Unavailable': 'Website đang maintenance'
                    },
                    fix: 'Chụp màn hình lỗi → Gửi cho support hosting'
                }
            ]
        },

        cpanel: {
            title: '🔧 Các công cụ check trong cPanel',
            tools: [{
                    tool: 'Error Log',
                    where: 'cPanel → Metrics → Errors',
                    what: 'Xem log lỗi của website',
                    how: 'Kéo xuống dưới cùng → Xem lỗi gần đây nhất → Chụp màn hình gửi developer'
                },
                {
                    tool: 'File Manager',
                    where: 'cPanel → Files → File Manager',
                    what: 'Kiểm tra file còn đó không',
                    how: 'Vào public_html → Kiểm tra có index.php hoặc index.html không'
                },
                {
                    tool: 'Bandwidth',
                    where: 'cPanel → Metrics → Bandwidth',
                    what: 'Xem có bị quá tải không',
                    how: 'Nếu bandwidth vượt limit → Nâng cấp gói hosting'
                }
            ]
        },

        quickFix: {
            title: '⚡ Sửa nhanh một số lỗi thường gặp',
            fixes: [{
                    error: '404 - File not found',
                    solution: [
                        '1. Vào File Manager trong cPanel',
                        '2. Vào thư mục public_html',
                        '3. Kiểm tra có index.html hoặc index.php không',
                        '4. Nếu không có → Upload lại file website',
                        '5. Nếu có → Check file có bị lỗi không (click chuột phải → View)'
                    ]
                },
                {
                    error: '500 - Internal Server Error',
                    solution: [
                        '1. Vào cPanel → File Manager',
                        '2. Tìm file .htaccess trong public_html',
                        '3. Click chuột phải .htaccess → Rename → Đổi tên thành .htaccess.bak',
                        '4. Refresh website xem đã chạy chưa',
                        '5. Nếu vẫn lỗi → Xem Error Log hoặc liên hệ developer'
                    ]
                },
                {
                    error: '403 - Forbidden',
                    solution: [
                        '1. Vào File Manager → public_html',
                        '2. Click chuột phải vào file index.php/html → Permissions',
                        '3. Đặt permissions là 644',
                        '4. Với thư mục: permissions 755',
                        '5. Click "Change Permissions"'
                    ]
                }
            ]
        },

        contactSupport: {
            title: '📞 Khi nào nên liên hệ Support?',
            when: [
                '✅ Đã check tất cả các bước trên mà vẫn lỗi',
                '✅ Website down đột ngột mà bạn không thay đổi gì',
                '✅ Thấy lỗi 502, 503, 504 (server errors)',
                '✅ Hosting/Domain đã thanh toán nhưng vẫn không hoạt động',
                '✅ Không tự tin fix vì sợ làm hỏng thêm'
            ],
            whatToSay: [
                '📝 Template gửi support:',
                '',
                'Chào team support,',
                '',
                'Website của em đang gặp vấn đề:',
                '• Domain: example.com',
                '• Lỗi: [Mô tả lỗi hoặc chụp màn hình]',
                '• Thời gian bắt đầu lỗi: [Khoảng mấy giờ hôm nay]',
                '• Em đã thử: [Các bước đã làm]',
                '',
                'Em không rành kỹ thuật lắm, nhờ team hỗ trợ giúp em với ạ!',
                '',
                'Cảm ơn team!'
            ]
        }
    },

    SLOW_WEBSITE: {
        problem: 'Website load chậm',
        explain: 'Website chậm làm người dùng chán, Google xếp hạng thấp. Có nhiều nguyên nhân: ảnh nặng, plugin nhiều, hosting yếu...',

        cpanel: {
            title: '⚡ Tối ưu Website trong cPanel',
            easy: [{
                    tool: 'Enable Gzip Compression',
                    where: 'cPanel → Software → Optimize Website',
                    steps: [
                        '1. Click "Optimize Website"',
                        '2. Chọn "Compress All Content"',
                        '3. Click "Update Settings"'
                    ],
                    benefit: 'Giảm kích thước file 60-80%, website load nhanh hơn nhiều'
                },
                {
                    tool: 'Enable Caching',
                    where: 'cPanel → Advanced → Cron Jobs (nếu dùng WordPress)',
                    steps: [
                        '1. Cài plugin caching (WP Super Cache hoặc W3 Total Cache)',
                        '2. Bật plugin',
                        '3. Enable tất cả cache options'
                    ],
                    benefit: 'Website load từ cache thay vì tạo mới mỗi lần'
                },
                {
                    tool: 'Optimize Images',
                    where: 'Trước khi upload ảnh',
                    steps: [
                        '1. Vào tinypng.com (miễn phí)',
                        '2. Upload ảnh',
                        '3. Download ảnh đã nén',
                        '4. Upload lên website'
                    ],
                    benefit: 'Ảnh nhẹ hơn 50-80% mà vẫn đẹp'
                }
            ],

            wordpress: [{
                title: '🔌 Plugin cần thiết cho WordPress',
                plugins: [{
                        name: 'WP Super Cache',
                        purpose: 'Cache trang web',
                        free: true,
                        mustHave: true
                    },
                    {
                        name: 'Smush',
                        purpose: 'Tự động nén ảnh',
                        free: true,
                        mustHave: true
                    },
                    {
                        name: 'Autoptimize',
                        purpose: 'Minify CSS/JS',
                        free: true,
                        mustHave: false
                    }
                ],
                install: [
                    '1. Đăng nhập WordPress Admin',
                    '2. Vào Plugins → Add New',
                    '3. Tìm tên plugin',
                    '4. Click "Install Now" → "Activate"'
                ]
            }]
        },

        cloudflare: {
            title: '☁️ Dùng Cloudflare (CDN miễn phí)',
            why: 'Cloudflare cache website ở nhiều server toàn cầu, người dùng truy cập server gần nhất → Nhanh hơn nhiều',
            steps: [{
                    step: 1,
                    title: 'Đăng ký Cloudflare',
                    detail: 'Vào cloudflare.com → Sign Up (miễn phí)'
                },
                {
                    step: 2,
                    title: 'Add Website',
                    detail: 'Click "Add a Site" → Nhập domain → Continue'
                },
                {
                    step: 3,
                    title: 'Chọn Plan',
                    detail: 'Chọn "Free Plan" → Continue'
                },
                {
                    step: 4,
                    title: 'Review DNS',
                    detail: 'Cloudflare tự động import DNS records → Continue'
                },
                {
                    step: 5,
                    title: 'Update Nameservers',
                    detail: [
                        'Cloudflare cho 2 nameservers (dạng: xxx.ns.cloudflare.com)',
                        'Copy 2 nameservers này',
                        'Vào registrar (nơi mua domain)',
                        'Đổi nameservers thành 2 cái của Cloudflare',
                        'Save → Đợi 1-24 giờ'
                    ]
                },
                {
                    step: 6,
                    title: 'Bật tối ưu',
                    detail: [
                        'Vào tab Speed → Optimization',
                        'Bật "Auto Minify" (CSS, JavaScript, HTML)',
                        'Bật "Brotli"',
                        'Bật "Rocket Loader"'
                    ]
                }
            ],
            benefit: 'Website nhanh hơn 2-3 lần, tiết kiệm bandwidth, bảo vệ DDoS'
        },

        checkSpeed: {
            title: '📊 Công cụ check tốc độ',
            tools: [{
                    name: 'GTmetrix',
                    url: 'gtmetrix.com',
                    why: 'Phân tích chi tiết, cho điểm, gợi ý cụ thể'
                },
                {
                    name: 'PageSpeed Insights',
                    url: 'pagespeed.web.dev',
                    why: 'Công cụ của Google, chuẩn SEO'
                },
                {
                    name: 'Pingdom',
                    url: 'pingdom.com',
                    why: 'Check tốc độ từ nhiều vị trí khác nhau'
                }
            ],
            howToUse: [
                '1. Vào tool',
                '2. Nhập domain',
                '3. Click Test',
                '4. Xem kết quả + recommendations',
                '5. Làm theo gợi ý (ưu tiên những cái đánh dấu đỏ)'
            ]
        },

        upgradeHosting: {
            title: '📈 Khi nào nên nâng cấp Hosting?',
            signs: [
                '❌ Website vẫn chậm sau khi đã optimize hết',
                '❌ Hosting thông báo vượt CPU/RAM limit',
                '❌ Website có > 1000 visitors/ngày',
                '❌ Dùng shared hosting cho web bán hàng/quan trọng'
            ],
            options: [{
                    type: 'VPS',
                    when: '1000-10000 visitors/ngày',
                    price: '$5-20/tháng',
                    note: 'Cần biết chút kỹ thuật để quản lý'
                },
                {
                    type: 'Cloud Hosting',
                    when: 'Web quan trọng, cần 99.9% uptime',
                    price: '$10-50/tháng',
                    note: 'Dễ quản lý hơn VPS, auto scale'
                },
                {
                    type: 'Managed WordPress',
                    when: 'Web WordPress, cần performance cao',
                    price: '$15-50/tháng',
                    note: 'Tối ưu sẵn cho WordPress, có support'
                }
            ]
        }
    }
};

module.exports = BEGINNER_SOLUTIONS;
