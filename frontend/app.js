let allData = {};

const form = document.getElementById('searchForm');
const input = document.getElementById('domainInput');
const loading = document.getElementById('loading');
const resultsContainer = document.getElementById('resultsContainer');

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.result-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');
}

form.addEventListener('submit', async(e) => {
    e.preventDefault();
    let domain = input.value.trim();
    if (!domain) return;

    loading.classList.add('active');
    resultsContainer.classList.remove('active');

    // Show extracted domain if URL was provided
    const originalInput = domain;
    if (domain.includes('://') || domain.startsWith('www.') || domain.includes('/')) {
        // Extract domain for display
        let extracted = domain
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .split('/')[0]
            .split('?')[0]
            .split('#')[0]
            .split(':')[0];
    }

    try {
        // Fetch all data in parallel
        const [scanData, debugData, sitemapData, malwareData] = await Promise.allSettled([
            fetch(`/api/scan?domain=${encodeURIComponent(domain)}`).then(r => r.json()),
            fetch(`/api/debug?domain=${encodeURIComponent(domain)}`).then(r => r.json()),
            fetch(`/api/sitemap?domain=${encodeURIComponent(domain)}`).then(r => r.json()),
            fetch(`/api/malware?domain=${encodeURIComponent(domain)}`).then(r => r.json())
        ]);

        // Store all data with safe defaults
        allData = {
            scan: scanData.status === 'fulfilled' ? scanData.value : { error: 'Scan failed' },
            debug: debugData.status === 'fulfilled' ? debugData.value : { error: 'Debug failed' },
            sitemap: sitemapData.status === 'fulfilled' ? sitemapData.value : { error: 'Sitemap scan failed' },
            malware: malwareData.status === 'fulfilled' ? malwareData.value : { error: 'Malware scan failed' }
        };

        // Display all results
        displayScanResults(allData.scan, domain);
        displayDebugResults(allData.debug);
        displaySitemapResults(allData.sitemap);
        displayMalwareResults(allData.malware);

        resultsContainer.classList.add('active');
    } catch (error) {
        console.error('Scan error:', error);
        resultsContainer.innerHTML = `
            <div class="result-section">
                <div class="error" style="padding: 40px; text-align: center;">
                    ❌ <strong>Lỗi:</strong> ${error.message}
                </div>
            </div>`;
        resultsContainer.classList.add('active');
    } finally {
        loading.classList.remove('active');
    }

});

function hasData(obj) {
    if (!obj || obj.error) return false;
    const keys = Object.keys(obj).filter(k => k !== 'raw' && k !== 'error');
    return keys.some(key => {
        const val = obj[key];
        if (Array.isArray(val)) return val.length > 0;
        if (val && typeof val === 'object') return Object.keys(val).length > 0;
        return val !== null && val !== undefined && val !== '' && val !== 'Unknown';
    });
}

function getScoreColor(score) {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 70) return '#f59e0b'; // Orange
    if (score >= 50) return '#f97316'; // Dark orange
    return '#ef4444'; // Red
}

function animateGauge(score) {
    const circumference = 251.2;
    const offset = circumference - (score / 100) * circumference;

    setTimeout(() => {
        const arc = document.querySelector('.gauge-arc-fill');
        const scoreValue = document.querySelector('.gauge-score-value');
        const scoreStatus = document.querySelector('.score-status');

        if (arc && scoreValue && scoreStatus) {
            const color = getScoreColor(score);
            arc.style.strokeDashoffset = offset;
            arc.style.stroke = color;
            scoreValue.style.color = color;
            scoreValue.textContent = score;
            scoreStatus.style.color = color;
        }
    }, 100);
}


async function loadWebsitePreview(domain) {
    const res = await fetch(`/api/screenshot?domain=${domain}`);
    const data = await res.json();

    const container = document.getElementById("website-preview");

    if (!data.screenshot) {
        container.innerHTML = "<p>Không lấy được ảnh preview</p>";
        return;
    }

    let imageSrc = data.screenshot;

    // Nếu backend trả base64 thuần
    if (!imageSrc.startsWith("data:image")) {
        imageSrc = `data:image/png;base64,${imageSrc}`;
    }
    container.innerHTML = `
                <div style="text-align:center;padding:30px;color:#667eea;">
                    <div class="spinner"></div>
                    Đang tải ảnh website...
                </div>
            `;
    container.innerHTML = `
                <div style="margin-top:20px;">
                <h2 style="margin-bottom:10px;">🌐 Website Preview</h2>
                <img src="${imageSrc}" 
                    style="max-width:100%;height:auto;width:100%;
                        border-radius:16px;
                        box-shadow:0 20px 60px rgba(0,0,0,0.4);
                        border:1px solid #eee;
                        transition:transform .3s ease;
                    "
                >
                </div>
            `;
}

function displayScanResults(data, domain) {
    let html = '';

    // WHOIS Info
    if (data.whois) {
        html += `<div class="result-section"><h2>Thông Tin WHOIS</h2>`;

        const hasData = data.whois.registrar || data.whois.creationDate ||
            (data.whois.nameServers && data.whois.nameServers.length > 0);

        if (!hasData && data.whois.error) {
            html += `
                        <div class="error">
                            <strong>❌ ${data.whois.error}</strong><br>
                            ${data.whois.message || ''}
                            ${data.whois.manualCheck ? `
                                <br><br>
                                <a href="${data.whois.manualCheck}" target="_blank" style="color: #0066cc;">
                                    🔍 Truy vấn thủ công tại đây
                                </a>
                            ` : ''}
                        </div>
                    `;
                } else if (hasData) {            
                html += `<div class="info-grid">`;

                    if (data.whois.registrar) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Quản lý tại Nhà đăng ký</div>
                                <div class="info-value">${data.whois.registrar}</div>
                            </div>`;
                    }

                    if (data.whois.registrarUrl) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">URL Nhà Đăng Ký</div>
                                <div class="info-value"><a href="${data.whois.registrarUrl}" target="_blank">${data.whois.registrarUrl}</a></div>
                            </div>`;
                    }


                    // Creation Date - NEW ✅
                    if (data.whois.creationDateFormatted || data.whois.creationDate) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Ngày đăng ký</div>
                                <div class="info-value">${data.whois.creationDateFormatted || data.whois.creationDate}</div>
                            </div>`;
                    }

                    // Expiration Date - NEW ✅ (with days remaining)
                    if (data.whois.expirationDateFormatted || data.whois.expirationDate) {
                        const days = data.whois.expirationDaysRemaining;
                        let daysClass = 'days-good';
                        let daysText = '';
                        
                        if (days !== null && days !== undefined) {
                            if (days < 0) {
                                daysClass = 'days-danger';
                                daysText = `Đã hết hạn ${Math.abs(days)} ngày`;
                            } else if (days < 30) {
                                daysClass = 'days-danger';
                                daysText = `⚠️ Còn ${days} ngày`;
                            } else if (days < 90) {
                                daysClass = 'days-warning';
                                daysText = `Còn ${days} ngày`;
                            } else {
                                daysText = `Còn ${days} ngày`;
                            }
                        }
                        
                        html += `
                            <div class="info-item">
                                <div class="info-label">Ngày Hết Hạn</div>
                                <div class="info-value">
                                    ${data.whois.expirationDateFormatted || data.whois.expirationDate}
                                    ${daysText ? `<br><span class="days-remaining ${daysClass}">${daysText}</span>` : ''}
                                </div>
                            </div>
                        `;
                    }

                    // Updated Date - NEW ✅
                    if (data.whois.updatedDate) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Ngày Cập Nhật</div>
                                <div class="info-value">${data.whois.updatedDateFormatted || data.whois.updatedDate}</div>
                            </div>`;
                    }

                    if (data.whois.registrantOrg) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Chủ sở hữu tên miền</div>
                                <div class="info-value">${data.whois.registrantOrg}</div>
                            </div>`;
                    }

                    if (data.whois.registrantCountry) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Quốc Gia</div>
                                <div class="info-value">${data.whois.registrantCountry}</div>
                            </div>`;
                    }

                    if (data.whois.dnssec) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">DNSSEC</div>
                                <div class="info-value">${data.whois.dnssec}</div>
                            </div>`;
                    }

                    html += `</div>`;

                    if (data.whois.status && data.whois.status.length > 0) {
                        html += `
                            <div class="info-item" style="margin-top: 15px;">
                                <div class="info-label">Trạng Thái</div>
                                <div class="tag-list">
                                    ${data.whois.status.map(s => `<span class="tag">${s}</span>`).join('')}
                                </div>
                            </div>`;
                    }
                    
                    if (data.whois.nameServers && data.whois.nameServers.length > 0) {
                        html += `
                            <div class="info-item" style="margin-top: 15px;">
                                <div class="info-label">Name Servers</div>
                                <div class="tag-list">
                                    ${data.whois.nameServers.map(ns => `<span class="tag">${ns}</span>`).join('')}
                                </div>
                            </div>`;
                    }
                    
                    if (data.whois.raw) {
                        html += `
                            <button class="toggle-raw" onclick="toggleRawData('rawWhois')">
                                🔍 Xem Dữ Liệu WHOIS Gốc
                            </button>
                            <div id="rawWhois" class="raw-data" style="display: none;">${data.whois.raw}</div>
                        `;
                    }
                }
                
                html += `</div>`;
            }

            // DNS Records
            if (data.dns) {
                html += `<div class="result-section"><h2>Bản Ghi DNS</h2>`;
                
                if (data.dns.error) {
                    html += `<div class="error">❌ ${data.dns.error}</div>`;
                } else if (!hasData(data.dns)) {
                    html += `<div class="empty-state">Không có bản ghi DNS</div>`;
                } else {
                    html += `<div class="info-grid">`;
                    
                    if (data.dns.A && data.dns.A.length > 0) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Bản Ghi A (IPv4)</div>
                                <div class="tag-list">
                                    ${data.dns.A.map(ip => `<span class="tag">${ip}</span>`).join('')}
                                </div>
                            </div>`;
                    }
                    
                    if (data.dns.AAAA && data.dns.AAAA.length > 0) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Bản Ghi AAAA (IPv6)</div>
                                <div class="tag-list">
                                    ${data.dns.AAAA.map(ip => `<span class="tag">${ip}</span>`).join('')}
                                </div>
                            </div>`;
                    }
                    
                    if (data.dns.CNAME && data.dns.CNAME.length > 0) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Bản Ghi CNAME</div>
                                <div class="tag-list">
                                    ${data.dns.CNAME.map(cname => `<span class="tag">${cname}</span>`).join('')}
                                </div>
                            </div>`;
                    }
                    
                    if (data.dns.MX && data.dns.MX.length > 0) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Bản Ghi MX (Mail)</div>
                                <div class="tag-list">
                                    ${data.dns.MX.map(mx => `<span class="tag">${mx.exchange} (${mx.priority})</span>`).join('')}
                                </div>
                            </div>`;
                    }
                    
                    if (data.dns.NS && data.dns.NS.length > 0) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Bản Ghi NS (Name Server)</div>
                                <div class="tag-list">
                                    ${data.dns.NS.map(ns => `<span class="tag">${ns}</span>`).join('')}
                                </div>
                            </div>`;
                    }
                    
                    if (data.dns.PTR && data.dns.PTR.length > 0) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Bản Ghi PTR (Reverse DNS)</div>
                                ${data.dns.PTR.map(ptr => `
                                    <div style="margin: 5px 0;">
                                        <strong>${ptr.ip}</strong> → ${ptr.hostnames.join(', ')}
                                    </div>
                                `).join('')}
                            </div>`;
                    }
                    
                    if (data.dns.SRV && data.dns.SRV.length > 0) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Bản Ghi SRV (Service)</div>
                                ${data.dns.SRV.map(srv => `
                                    <div style="margin: 5px 0; font-size: 0.9em;">
                                        ${srv.name}:${srv.port} (Priority: ${srv.priority}, Weight: ${srv.weight})
                                    </div>
                                `).join('')}
                            </div>`;
                    }
                    
                    if (data.dns.CAA && data.dns.CAA.length > 0) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Bản Ghi CAA (Certificate Authority)</div>
                                ${data.dns.CAA.map(caa => `
                                    <div style="margin: 5px 0; font-size: 0.9em;">
                                        ${caa.issue || caa.issuewild || caa.iodef || 'N/A'}
                                    </div>
                                `).join('')}
                            </div>`;
                    }
                    
                    if (data.dns.TXT && data.dns.TXT.length > 0) {
                        html += `
                            <div class="info-item">
                                <div class="info-label">Bản Ghi TXT</div>
                                <div class="info-value" style="font-size: 0.9em;">
                                    ${data.dns.TXT.map(txt => `<div style="margin-bottom: 5px; word-break: break-all;">${txt}</div>`).join('')}
                                </div>
                            </div>`;
                    }
                    
                    html += `</div>`;
                    
                    // SOA Record (special display)
                    if (data.dns.SOA) {
                        const soa = data.dns.SOA;
                        html += `
                            <div class="info-item" style="margin-top: 15px;">
                                <div class="info-label">Bản Ghi SOA (Start of Authority)</div>
                                <div class="soa-grid">
                                    <div class="soa-item">
                                        <div class="soa-label">Primary NS</div>
                                        <div class="soa-value">${soa.nsname}</div>
                                    </div>
                                    <div class="soa-item">
                                        <div class="soa-label">Admin Email</div>
                                        <div class="soa-value">${soa.hostmaster}</div>
                                    </div>
                                    <div class="soa-item">
                                        <div class="soa-label">Serial</div>
                                        <div class="soa-value">${soa.serial}</div>
                                    </div>
                                    <div class="soa-item">
                                        <div class="soa-label">Refresh</div>
                                        <div class="soa-value">${soa.refresh}s</div>
                                    </div>
                                    <div class="soa-item">
                                        <div class="soa-label">Retry</div>
                                        <div class="soa-value">${soa.retry}s</div>
                                    </div>
                                    <div class="soa-item">
                                        <div class="soa-label">Expire</div>
                                        <div class="soa-value">${soa.expire}s</div>
                                    </div>
                                    <div class="soa-item">
                                        <div class="soa-label">Min TTL</div>
                                        <div class="soa-value">${soa.minttl}s</div>
                                    </div>
                                </div>
                            </div>`;
                    }
                }
                
                html += `</div>`;
            }

            // IP Information
            if (data.ip) {
                html += `<div class="result-section"><h2>Định Vị IP</h2>`;
                
                if (data.ip.error) {
                    html += `<div class="error">❌ ${data.ip.error}</div>`;
                } else {
                    html += `
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Địa Chỉ IP</div>
                                <div class="info-value">${data.ip.ip}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Quốc Gia</div>
                                <div class="info-value">${data.ip.country} (${data.ip.countryCode})</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Vùng</div>
                                <div class="info-value">${data.ip.region}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Thành Phố</div>
                                <div class="info-value">${data.ip.city}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Nhà Cung Cấp</div>
                                <div class="info-value">${data.ip.isp}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Tổ Chức</div>
                                <div class="info-value">${data.ip.org}</div>
                            </div>
                            ${data.ip.as ? `
                                <div class="info-item">
                                    <div class="info-label">Số AS</div>
                                    <div class="info-value">${data.ip.as}</div>
                                </div>
                            ` : ''}
                        </div>`;
                }
                
                html += `</div>`;
            }

            // SSL Certificate
            if (data.ssl) {
                html += `<div class="result-section"><h2>Chứng Chỉ SSL</h2>`;
                
                if (data.ssl.hasSSL) {
                    html += `
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Trạng Thái</div>
                                <div class="info-value">${data.ssl.isValid ? '✅ Hợp Lệ' : '❌ Không Hợp Lệ'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Nhà Phát Hành</div>
                                <div class="info-value">${data.ssl.issuer}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Chủ Thể</div>
                                <div class="info-value">${data.ssl.subject}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Có Hiệu Lực Từ</div>
                                <div class="info-value">${data.ssl.validFrom}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Hết Hạn Vào</div>
                                <div class="info-value">${data.ssl.validTo}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Số Ngày Còn Lại</div>
                                <div class="info-value">${data.ssl.daysRemaining}</div>
                            </div>
                            ${data.ssl.protocol ? `
                                <div class="info-item">
                                    <div class="info-label">Giao Thức</div>
                                    <div class="info-value">${data.ssl.protocol}</div>
                                </div>
                            ` : ''}
                        </div>`;
                } else {
                    html += `<div class="error">❌ Không phát hiện chứng chỉ SSL hoặc kết nối thất bại: ${data.ssl.error}</div>`;
                }
                
                html += `</div>`;
            }

            // Technology Stack
            if (data.tech) {
                html += `<div class="result-section"><h2>Công Nghệ Sử Dụng</h2>`;
                
                if (data.tech.error) {
                    html += `<div class="error">❌ ${data.tech.error}</div>`;
                } else {
                    // Tech categories with Vietnamese labels
                    const techCategories = [
                        { key: 'cms', label: 'Hệ Quản Trị', icon: '📝' },
                        { key: 'ecommerce', label: 'Ecommerce', icon: '🛒' },
                        { key: 'databases', label: 'Cơ Sở Dữ Liệu', icon: '🗄️' },
                        { key: 'pageBuilders', label: 'Page Builders', icon: '🏗️' },
                        { key: 'blogs', label: 'Blog', icon: '✍️' },
                        { key: 'liveChat', label: 'Live Chat', icon: '💬' },
                        { key: 'webServers', label: 'Web Servers', icon: '🖥️' },
                        { key: 'programmingLanguages', label: 'Ngôn Ngữ Lập Trình', icon: '💻' },
                        { key: 'jsFrameworks', label: 'Framework JavaScript', icon: '⚛️' },
                        { key: 'jsLibraries', label: 'Thư Viện JavaScript', icon: '📚' },
                        { key: 'cssFrameworks', label: 'Framework CSS', icon: '🎨' },
                        { key: 'analytics', label: 'Analytics', icon: '📊' },
                        { key: 'cdn', label: 'CDN', icon: '🌐' },
                        { key: 'seo', label: 'SEO', icon: '🔍' },
                        { key: 'security', label: 'Bảo Mật', icon: '🔒' },
                        { key: 'caching', label: 'Caching', icon: '⚡' },
                        { key: 'advertising', label: 'Quảng Cáo', icon: '📢' },
                        { key: 'marketing', label: 'Marketing', icon: '📈' },
                        { key: 'paymentProcessors', label: 'Trình Xử Lý Thanh Toán', icon: '💳' },
                        { key: 'videoPlayers', label: 'Video Players', icon: '▶️' },
                        { key: 'maps', label: 'Maps', icon: '🗺️' },
                        { key: 'fonts', label: 'Fonts', icon: '🔤' },
                        { key: 'hosting', label: 'Hosting', icon: '☁️' },
                        { key: 'containerization', label: 'Containerization', icon: '🐳' },
                        { key: 'reverseProxy', label: 'Reverse Proxy', icon: '🔄' },
                        { key: 'loadBalancers', label: 'Load Balancers', icon: '⚖️' }
                    ];

                    html += '<div class="tech-grid">';

                    techCategories.forEach(category => {
                        const items = data.tech[category.key];
                        if (items && items.length > 0) {
                            html += `
                                <div class="tech-category-box">
                                    <div class="tech-category-title">
                                        <span class="tech-icon">${category.icon}</span>
                                        <span class="tech-label">${category.label}</span>
                                    </div>
                                    <div class="tech-items-list">`;
                            
                            items.forEach(item => {
                                // Handle both string and object format
                                const name = typeof item === 'string' ? item : (item.name || JSON.stringify(item));
                                const version = typeof item === 'object' && item.version ? item.version : null;
                                
                                html += `
                                    <div class="tech-item-card">
                                        <span class="tech-name">${name}</span>
                                        ${version ? `<span class="tech-version">${version}</span>` : ''}
                                    </div>`;
                            });

                            html += `
                                    </div>
                                </div>`;
                        }
                    });

                    // Legacy fields - Server and Powered By
                    if (data.tech.server && data.tech.server !== 'Unknown') {
                        html += `
                            <div class="tech-category-box">
                                <div class="tech-category-title">
                                    <span class="tech-icon">🖥️</span>
                                    <span class="tech-label">Máy Chủ</span>
                                </div>
                                <div class="tech-items-list">
                                    <div class="tech-item-card">
                                        <span class="tech-name">${data.tech.server}</span>
                                    </div>
                                </div>
                            </div>`;
                    }

                    if (data.tech.poweredBy && data.tech.poweredBy !== 'Unknown') {
                        html += `
                            <div class="tech-category-box">
                                <div class="tech-category-title">
                                    <span class="tech-icon">⚡</span>
                                    <span class="tech-label">Powered By</span>
                                </div>
                                <div class="tech-items-list">
                                    <div class="tech-item-card">
                                        <span class="tech-name">${data.tech.poweredBy}</span>
                                    </div>
                                </div>
                            </div>`;
                    }

                    html += '</div>'; // Close tech-grid
                }
                
                html += `<div id="website-preview"></div></div>`; // Close result-section
            }

            // Security Analysis
            if (data.security) {
                const security = data.security;
                const color = getScoreColor(security.score);

                html += `
                    <div class="result-section">
                        <h2>Phân Tích Bảo Mật Website</h2>
                        <div class="security-score-container">
                            <div class="gauge-container">
                                <svg class="gauge-background" viewBox="0 0 100 100">
                                    <circle class="gauge-arc gauge-arc-bg" cx="50" cy="50" r="40"/>
                                    <circle class="gauge-arc gauge-arc-fill" cx="50" cy="50" r="40"/>
                                </svg>
                                <div class="gauge-score">
                                    <div class="gauge-score-value">0</div>
                                    <div class="gauge-score-label">Điểm bảo mật</div>
                                </div>
                            </div>
                            
                            <div class="score-status">${security.summary || 'Đang phân tích...'}</div>
                            <div class="score-description">
                                Phân tích dựa trên ${security.checks?.length || 0} tiêu chí bảo mật bao gồm HTTPS, 
                                security headers, cookie security, và các lỗ hổng phổ biến.
                            </div>
                            
                            ${security.checks && security.checks.length > 0 ? `
                                <div class="security-checks">
                                    ${security.checks.map(check => {
                                        const icons = {
                                            'pass': '✅',
                                            'fail': '❌',
                                            'warning': '⚠️',
                                            'error': '🔴'
                                        };
                                        return `
                                        <div class="check-item ${check.status}">
                                            <div class="check-icon">${icons[check.status] || '●'}</div>
                                            <div class="check-content">
                                                <div class="check-header">
                                                    <div class="check-name">${check.name}</div>
                                                    ${check.score !== 0 ? `
                                                        <div class="check-score ${check.score < 0 ? 'negative' : 'neutral'}">
                                                            ${check.score > 0 ? '+' : ''}${check.score}
                                                        </div>
                                                    ` : ''}
                                                </div>
                                                <div class="check-message">${check.message}</div>
                                                
                                            </div>
                                        </div>
                                    `}).join('')}
                                </div>
                            ` : `
                                <div style="text-align: center; padding: 20px; color: #666;">
                                    ${security.error || 'Không có dữ liệu bảo mật'}
                                </div>
                            `}
                        </div>
                    </div>
                `;

                setTimeout(() => animateGauge(security.score || 0), 100);
            }

            if (data.security.debug) {
                html += `
                    <div class="result-section debug-section" style="margin-top: 20px;">
                        <details>
                            <summary style="cursor: pointer; font-weight: 600; color: #666;">
                                🔍 Thông tin Debug (Click để xem)
                            </summary>
                            <div style="margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-family: monospace; font-size: 0.85em;">
                                ${data.security.debug.finalUrl ? `
                                    <div style="margin-bottom: 8px;">
                                        <strong>✅ URL thành công:</strong> ${data.security.debug.finalUrl}
                                    </div>
                                    <div style="margin-bottom: 8px;">
                                        <strong>⏱️ Response time:</strong> ${data.security.debug.responseTime}ms
                                    </div>
                                    <div style="margin-bottom: 8px;">
                                        <strong>📊 Status code:</strong> ${data.security.debug.statusCode}
                                    </div>
                                ` : ''}
                                
                                ${data.security.debug.attempts && data.security.debug.attempts.length > 0 ? `
                                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
                                        <strong>🔄 Connection Attempts:</strong>
                                        <div style="margin-top: 8px;">
                                            ${data.security.debug.attempts.map((attempt, idx) => `
                                                <div style="margin: 6px 0; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid ${attempt.status === 'success' ? '#10b981' : '#ef4444'};">
                                                    <div>${idx + 1}. ${attempt.url}</div>
                                                    <div style="font-size: 0.9em; color: #666; margin-top: 4px;">
                                                        Status: <span style="color: ${attempt.status === 'success' ? '#10b981' : '#ef4444'};">${attempt.status}</span>
                                                        ${attempt.statusCode ? `(${attempt.statusCode})` : ''}
                                                        ${attempt.error ? `<br>Error: ${attempt.error}` : ''}
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${data.security.details.errors && data.security.details.errors.length > 0 ? `
                                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
                                        <strong>⚠️ Errors:</strong>
                                        <div style="margin-top: 8px;">
                                            ${data.security.details.errors.map(error => `
                                                <div style="color: #dc2626; margin: 4px 0;">• ${error}</div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </details>
                    </div>
                `;
            }

            document.getElementById('scanTab').innerHTML = html;
            // Load screenshot sau khi render xong
            setTimeout(() => loadWebsitePreview(domain), 100);
        }

        function displayDebugResults(data) {
            let html = '<div class="result-section">';

            // Check if domain exists
            if (data.exists === false && data.error) {
                html = `
                    <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="font-size: 4em; margin-bottom: 20px;">❌</div>
                            <h2 style="color: #dc2626; margin-bottom: 10px;">${data.error.title}</h2>
                            <p style="color: #666; font-size: 1.1em;">${data.error.message}</p>
                        </div>
                        
                        <div style="background: #fef2f2; padding: 20px; border-radius: 10px; border-left: 4px solid #dc2626; margin: 20px 0;">
                            <h3 style="color: #991b1b; margin-bottom: 15px;">🔍 Nguyên nhân có thể:</h3>
                            ${data.error.possibleReasons.map(reason => `
                                <div style="margin: 8px 0; color: #7f1d1d; line-height: 1.6;">${reason}</div>
                            `).join('')}
                        </div>
                        
                        <div style="margin-top: 30px;">
                            <h3 style="color: #333; margin-bottom: 20px;">${data.error.solutions.title}</h3>
                            
                            ${data.error.solutions.checkIfRegistered ? `
                                <details open style="margin: 20px 0; border: 2px solid #3b82f6; border-radius: 10px; padding: 15px;">
                                    <summary style="font-weight: 600; color: #1e40af; cursor: pointer; font-size: 1.1em;">
                                        ${data.error.solutions.checkIfRegistered[0]}
                                    </summary>
                                    <div style="margin-top: 15px; padding-left: 10px;">
                                        ${data.error.solutions.checkIfRegistered.slice(1).map(step => `
                                            <div style="margin: 8px 0; line-height: 1.8; color: #444;">${escapeHtml(step)}</div>
                                        `).join('')}
                                    </div>
                                </details>
                            ` : ''}
                            
                            ${data.error.solutions.checkDNS ? `
                                <details style="margin: 20px 0; border: 2px solid #10b981; border-radius: 10px; padding: 15px;">
                                    <summary style="font-weight: 600; color: #047857; cursor: pointer; font-size: 1.1em;">
                                        ${data.error.solutions.checkDNS[0]}
                                    </summary>
                                    <div style="margin-top: 15px; padding-left: 10px;">
                                        ${data.error.solutions.checkDNS.slice(1).map(step => `
                                            <div style="margin: 8px 0; line-height: 1.8; color: #444;">${escapeHtml(step)}</div>
                                        `).join('')}
                                    </div>
                                </details>
                            ` : ''}
                            
                            ${data.error.solutions.setupDNS ? `
                                <details style="margin: 20px 0; border: 2px solid #f59e0b; border-radius: 10px; padding: 15px;">
                                    <summary style="font-weight: 600; color: #d97706; cursor: pointer; font-size: 1.1em;">
                                        ${data.error.solutions.setupDNS.title}
                                    </summary>
                                    <div style="margin-top: 15px;">
                                        ${data.error.solutions.setupDNS.cpanel ? `
                                            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 3px solid #3b82f6;">
                                                <div style="font-weight: 600; color: #1e40af; margin-bottom: 10px;">
                                                    ${data.error.solutions.setupDNS.cpanel[0]}
                                                </div>
                                                ${data.error.solutions.setupDNS.cpanel.slice(1).map(step => `
                                                    <div style="margin: 6px 0; line-height: 1.8; color: #444;">${escapeHtml(step)}</div>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                        
                                        ${data.error.solutions.setupDNS.cloudflare ? `
                                            <div style="background: #fff7ed; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 3px solid #f59e0b;">
                                                <div style="font-weight: 600; color: #d97706; margin-bottom: 10px;">
                                                    ${data.error.solutions.setupDNS.cloudflare[0]}
                                                </div>
                                                ${data.error.solutions.setupDNS.cloudflare.slice(1).map(step => `
                                                    <div style="margin: 6px 0; line-height: 1.8; color: #444;">${escapeHtml(step)}</div>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                        
                                        ${data.error.solutions.setupDNS.registrar ? `
                                            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 3px solid #10b981;">
                                                <div style="font-weight: 600; color: #047857; margin-bottom: 10px;">
                                                    ${data.error.solutions.setupDNS.registrar[0]}
                                                </div>
                                                ${data.error.solutions.setupDNS.registrar.slice(1).map(step => `
                                                    <div style="margin: 6px 0; line-height: 1.8; color: #444;">${escapeHtml(step)}</div>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                    </div>
                                </details>
                            ` : ''}
                            
                            ${data.error.solutions.waitTime ? `
                                <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                                    ${data.error.solutions.waitTime.map(line => `
                                        <div style="margin: 6px 0; line-height: 1.8; color: #78350f;">${escapeHtml(line)}</div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            ${data.error.solutions.commonMistakes ? `
                                <div style="background: #fef2f2; padding: 20px; border-radius: 10px; border-left: 4px solid #dc2626; margin: 20px 0;">
                                    ${data.error.solutions.commonMistakes.map(line => `
                                        <div style="margin: 6px 0; line-height: 1.8; color: #7f1d1d;">${escapeHtml(line)}</div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        
                        ${data.error.nextSteps ? `
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin-top: 30px;">
                                ${data.error.nextSteps.map(line => `
                                    <div style="margin: 8px 0; line-height: 1.8;">${escapeHtml(line)}</div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
                
                results.innerHTML = html;
                return;
            }

            // Normal debug results (existing code)
            html += `
                <div class="summary-box">
                    <h2>📊 Tổng Quan Debug</h2>
                    <div class="summary-grid">
                        <div class="summary-item critical-issues">
                            <div class="summary-number">${data.summary.criticalIssues}</div>
                            <div class="summary-label">Lỗi Nghiêm Trọng</div>
                        </div>
                        <div class="summary-item warnings">
                            <div class="summary-number">${data.summary.warnings}</div>
                            <div class="summary-label">Cảnh Báo</div>
                        </div>
                        <div class="summary-item passed-tests">
                            <div class="summary-number">${data.summary.passed}</div>
                            <div class="summary-label">Tests Passed</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-number">${data.summary.totalIssues}</div>
                            <div class="summary-label">Tổng Vấn Đề</div>
                        </div>
                    </div>
                </div>
            `;

            // Recommendations
            if (data.recommendations && data.recommendations.length > 0) {
                html += '<div class="recommendations"><h2>💡 Khuyến Nghị</h2>';
                data.recommendations.forEach(rec => {
                    html += `
                        <div class="recommendation-item">
                            <div class="recommendation-title">${rec.title}</div>
                            <div>${rec.description}</div>
                            <div style="margin-top: 10px; font-style: italic;">
                                → ${rec.action}
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            }

            // Categories
            const categoryIcons = {
                dns: '🌐',
                connectivity: '🔌',
                ssl: '🔒',
                http: '📡',
                performance: '⚡',
                configuration: '⚙️'
            };

            const categoryNames = {
                dns: 'DNS Resolution',
                connectivity: 'Connectivity',
                ssl: 'SSL/TLS',
                http: 'HTTP Response',
                performance: 'Performance',
                configuration: 'Configuration'
            };

            for (const [category, checks] of Object.entries(data.categories)) {
                if (checks.length === 0) continue;

                html += `
                    <div class="category-section">
                        <div class="category-header">
                            <span>${categoryIcons[category] || '📋'}</span>
                            <span>${categoryNames[category] || category}</span>
                        </div>
                `;

                checks.forEach((check, index) => {
                    const badgeClass = `badge-${check.status}`;
                    const statusIcon = {
                        'pass': '✅',
                        'fail': '❌',
                        'warning': '⚠️'
                    }[check.status] || '●';

                    html += `
                        <div class="check-item ${check.status}">
                            <div class="check-header">
                                <div class="check-title">${statusIcon} ${check.test}</div>
                                <span class="check-badge ${badgeClass}">
                                    ${check.status.toUpperCase()}
                                </span>
                            </div>
                            <div class="check-message">${check.message}</div>
                            ${check.details ? `
                                <div class="check-details">
                                    ${typeof check.details === 'object' ? 
                                        JSON.stringify(check.details, null, 2) : 
                                        check.details}
                                </div>
                            ` : ''}
                            ${check.solution ? `
                                <button class="toggle-solution" onclick="toggleSolution('sol-${category}-${index}')">
                                    📖 Xem Hướng Dẫn Khắc Phục Chi Tiết
                                </button>
                                <div id="sol-${category}-${index}" class="solution-box hidden">
                                    <div class="solution-title">✨ ${check.solution.title}</div>
                                    
                                    ${check.solution.forBeginners ? `
                                        <div style="background: #fef3c7; padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 0.9em;">
                                            👋 <strong>Dành cho người mới:</strong> Hướng dẫn dễ hiểu, không cần biết code!
                                        </div>
                                    ` : ''}
                                    
                                    ${check.solution.cpanel ? `
                                        <div style="margin: 15px 0;">
                                            <div style="font-weight: 600; color: #0066cc; margin-bottom: 10px;">
                                                📘 ${check.solution.cpanel[0] || 'Với cPanel:'}
                                            </div>
                                            <div style="background: #f0f9ff; padding: 15px; border-radius: 5px; border-left: 3px solid #0066cc;">
                                                ${check.solution.cpanel.slice(1).map(step => `
                                                    <div style="margin: 8px 0; line-height: 1.6;">${escapeHtml(step)}</div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${check.solution.cloudflare ? `
                                        <div style="margin: 15px 0;">
                                            <div style="font-weight: 600; color: #f48120; margin-bottom: 10px;">
                                                ☁️ ${check.solution.cloudflare[0] || 'Với Cloudflare:'}
                                            </div>
                                            <div style="background: #fff7ed; padding: 15px; border-radius: 5px; border-left: 3px solid #f48120;">
                                                ${check.solution.cloudflare.slice(1).map(step => `
                                                    <div style="margin: 8px 0; line-height: 1.6;">${escapeHtml(step)}</div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${check.solution.wordpress ? `
                                        <div style="margin: 15px 0;">
                                            <div style="font-weight: 600; color: #21759b; margin-bottom: 10px;">
                                                📝 ${check.solution.wordpress[0] || 'Với WordPress:'}
                                            </div>
                                            <div style="background: #f0f6fc; padding: 15px; border-radius: 5px; border-left: 3px solid #21759b;">
                                                ${check.solution.wordpress.slice(1).map(step => `
                                                    <div style="margin: 8px 0; line-height: 1.6;">${escapeHtml(step)}</div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${check.solution.howToFind ? `
                                        <div style="margin: 15px 0;">
                                            <div style="font-weight: 600; color: #7c3aed; margin-bottom: 10px;">
                                                ❓ ${check.solution.howToFind[0] || 'Thông tin bổ sung:'}
                                            </div>
                                            <div style="background: #faf5ff; padding: 15px; border-radius: 5px; border-left: 3px solid #7c3aed;">
                                                ${check.solution.howToFind.slice(1).map(step => `
                                                    <div style="margin: 8px 0; line-height: 1.6;">${escapeHtml(step)}</div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${check.solution.registrar ? `
                                        <div style="margin: 15px 0;">
                                            <div style="font-weight: 600; color: #059669; margin-bottom: 10px;">
                                                🏢 ${check.solution.registrar[0] || 'Với Registrar:'}
                                            </div>
                                            <div style="background: #f0fdf4; padding: 15px; border-radius: 5px; border-left: 3px solid #059669;">
                                                ${check.solution.registrar.slice(1).map(step => `
                                                    <div style="margin: 8px 0; line-height: 1.6;">${escapeHtml(step)}</div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${check.solution.checkList ? `
                                        <div style="margin: 15px 0;">
                                            <div style="font-weight: 600; color: #dc2626; margin-bottom: 10px;">
                                                ✅ ${check.solution.checkList[0] || 'Checklist:'}
                                            </div>
                                            <div style="background: #fef2f2; padding: 15px; border-radius: 5px; border-left: 3px solid #dc2626;">
                                                ${check.solution.checkList.slice(1).map(item => `
                                                    <div style="margin: 8px 0; line-height: 1.6;">${escapeHtml(item)}</div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${check.solution.steps ? `
                                        <ol class="solution-steps">
                                            ${check.solution.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
                                        </ol>
                                    ` : ''}
                                    
                                    ${check.solution.general ? `
                                        <div style="margin: 15px 0;">
                                            ${check.solution.general.map(line => `
                                                <div style="margin: 8px 0; line-height: 1.6;">${escapeHtml(line)}</div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                    
                                    ${check.solution.reference ? `
                                        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e0e0e0;">
                                            <strong style="color: #667eea;">📚 Video hướng dẫn:</strong><br>
                                            <a href="${check.solution.reference}" target="_blank" style="color: #667eea; text-decoration: underline;">
                                                ${check.solution.reference}
                                            </a>
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `;
                });

                html += '</div>';
            }

            html += '</div>';
            document.getElementById('debugTab').innerHTML = html;
        }

        function displaySitemapResults(data) {
            let html = '<div class="result-section">';

            // Resource Stats
            if (data.resourceStats) {
                html += `
                    <h2>📦 Thống Kê Resources</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${data.resourceStats.internal.total || 0}</div>
                            <div class="stat-label">Internal Resources</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${data.resourceStats.external.total || 0}</div>
                            <div class="stat-label">External Resources</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${data.resourceStats.external.domains || 0}</div>
                            <div class="stat-label">Third-Party Domains</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${data.totalUrls || 0}</div>
                            <div class="stat-label">Page URLs</div>
                        </div>
                    </div>
                `;
            }

            // Internal Resources
            if (data.resources) {
                html += `<h2>🔧 Internal Resources</h2><div class="tech-grid">`;
                
                const resourceTypes = [
                    { key: 'css', label: 'CSS Files', icon: '🎨' },
                    { key: 'js', label: 'JavaScript Files', icon: '⚙️' },
                    { key: 'images', label: 'Images', icon: '🖼️' },
                    { key: 'fonts', label: 'Fonts', icon: '🔤' },
                    { key: 'videos', label: 'Videos', icon: '🎬' },
                    { key: 'iframes', label: 'iFrames', icon: '📦' }
                ];
                
                resourceTypes.forEach(type => {
                    const items = data.resources[type.key] || [];
                    if (items.length > 0) {
                        html += `
                            <div class="tech-category">
                                <h3>${type.icon} ${type.label} (${items.length})</h3>
                                <ul class="tech-list" style="max-height: 200px; overflow-y: auto;">
                                    ${items.slice(0, 100).map(url => {
                                        const fileName = url.split('/').pop().split('?')[0];
                                        return `<li title="${url}">• <a href="${url}" target="_blank">${fileName || url}</a></li>`;
                                    }).join('')}
                                    ${items.length > 100 ? `<li><em>... và ${items.length - 100} file khác</em></li>` : ''}
                                </ul>
                            </div>
                        `;
                    }
                });
                
                html += '</div>';
            }

            // Third-Party Resources
            if (data.thirdParty) {
                html += `<h2>🌐 Third-Party Resources</h2>`;
                
                // CDNs
                if (data.thirdParty.cdn && data.thirdParty.cdn.length > 0) {
                    html += `
                        <div style="margin-bottom: 20px;">
                            <strong>📡 CDNs Detected:</strong><br>
                            ${data.thirdParty.cdn.map(cdn => `<span class="badge badge-page">${cdn}</span>`).join(' ')}
                        </div>
                    `;
                }

                html += '<div class="tech-grid">';
                
                // External Scripts
                if (data.thirdParty.scripts && data.thirdParty.scripts.length > 0) {
                    html += `
                        <div class="tech-category">
                            <h3>📜 External Scripts (${data.thirdParty.scripts.length})</h3>
                            <ul class="tech-list" style="max-height: 200px; overflow-y: auto;">
                                ${data.thirdParty.scripts.slice(0, 100).map(script => 
                                    `<li><strong>${script.domain}</strong><br><a href="${script.url}" target="_blank" style="color: #666;">${script.url}</a></li>`
                                ).join('')}
                                ${data.thirdParty.scripts.length > 100 ? `<li><em>... và ${data.thirdParty.scripts.length - 100} script khác</em></li>` : ''}
                            </ul>
                        </div>
                    `;
                }

                // External Stylesheets
                if (data.thirdParty.stylesheets && data.thirdParty.stylesheets.length > 0) {
                    html += `
                        <div class="tech-category">
                            <h3>🎨 External CSS (${data.thirdParty.stylesheets.length})</h3>
                            <ul class="tech-list" style="max-height: 200px; overflow-y: auto;">
                                ${data.thirdParty.stylesheets.slice(0, 100).map(css => 
                                    `<li><strong>${css.domain}</strong><br><a href="${css.url}" target="_blank" style="color: #666;">${css.url}</a></li>`
                                ).join('')}
                                ${data.thirdParty.stylesheets.length > 100 ? `<li><em>... và ${data.thirdParty.stylesheets.length - 100} file khác</em></li>` : ''}
                            </ul>
                        </div>
                    `;
                }

                // Third-Party Domains
                if (data.thirdParty.domains && data.thirdParty.domains.length > 0) {
                    html += `
                        <div class="tech-category" style="grid-column: 1/-1;">
                            <h3>🌍 All Third-Party Domains (${data.thirdParty.domains.length})</h3>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                                ${data.thirdParty.domains.map(domain => 
                                    `<span class="badge badge-blog">${domain}</span>`
                                ).join('')}
                            </div>
                        </div>
                    `;
                }

                // APIs
                if (data.thirdParty.apis && data.thirdParty.apis.length > 0) {
                    html += `
                        <div class="tech-category" style="grid-column: 1/-1;">
                            <h3>🔌 API Endpoints Detected (${data.thirdParty.apis.length})</h3>
                            <ul class="tech-list" style="max-height: 150px; overflow-y: auto;">
                                ${data.thirdParty.apis.slice(0, 50).map(api => 
                                    `<li><code style="font-size: 0.85em;">${api}</code></li>`
                                ).join('')}
                                ${data.thirdParty.apis.length > 50 ? `<li><em>... và ${data.thirdParty.apis.length - 50} API khác</em></li>` : ''}
                            </ul>
                        </div>
                    `;
                }
                
                html += '</div>';
            }

            // Page URLs
            html += `
                <h2>🔗 Page URLs (${data.totalUrls || 0})</h2>
                <button class="export-btn" onclick="exportAllResources()">📥 Export All Resources (CSV)</button>
                <button class="export-btn" style="background: #3b82f6;" onclick="exportPageUrls()">📥 Export Page URLs (CSV)</button>
                <div class="url-list">
                    ${renderUrls(data.urls || [])}
                </div>
            `;

            html += '</div>';
            document.getElementById('sitemapTab').innerHTML = html;
            
            // Store data for export
            window.currentSitemapData = data;
        }

        function displayMalwareResults(data) {
            let html = '<div class="result-section">';

            if (data.error) {
                html += '<p style="padding: 40px; text-align: center; color: #666;">Không thể quét mã độc</p>';
            } else {
                // Overall Status
                const statusColors = {
                    'clean': '#10b981',
                    'low': '#3b82f6',
                    'medium': '#f59e0b',
                    'high': '#ef4444',
                    'critical': '#dc2626'
                };

                const statusLabels = {
                    'clean': '✅ Sạch sẽ',
                    'low': '🟢 Rủi ro thấp',
                    'medium': '🟡 Rủi ro trung bình',
                    'high': '🟠 Rủi ro cao',
                    'critical': '🔴 Nguy hiểm'
                };

                html += `
                    <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, ${statusColors[data.overallStatus]}22 0%, ${statusColors[data.overallStatus]}44 100%); border-radius: 15px; margin-bottom: 30px;">
                        <div style="font-size: 4em; margin-bottom: 20px;">
                            ${data.overallStatus === 'clean' ? '✅' : data.overallStatus === 'critical' ? '🔴' : '⚠️'}
                        </div>
                        <h2 style="color: ${statusColors[data.overallStatus]}; margin-bottom: 10px;">
                            ${statusLabels[data.overallStatus]}
                        </h2>
                        <div style="font-size: 3em; font-weight: bold; color: ${statusColors[data.overallStatus]};">
                            ${data.riskScore}/100
                        </div>
                        <div style="color: #666;">Risk Score</div>
                    </div>
                `;

                // Summary
                html += `
                    <h2>📊 Tổng Quan</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number" style="color: #dc2626;">${data.summary.critical}</div>
                            <div class="stat-label">Critical</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" style="color: #ef4444;">${data.summary.high}</div>
                            <div class="stat-label">High</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" style="color: #f59e0b;">${data.summary.medium}</div>
                            <div class="stat-label">Medium</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" style="color: #3b82f6;">${data.summary.low}</div>
                            <div class="stat-label">Low</div>
                        </div>
                    </div>
                `;

                // Threats Found
                if (data.threats && data.threats.length > 0) {
                    html += `
                        <h2>⚠️ Threats Detected (${data.threats.length})</h2>
                        <div style="background: #fee2e2; padding: 20px; border-radius: 10px; border-left: 4px solid #dc2626; margin-bottom: 20px;">
                            ${data.threats.map(threat => `<div style="padding: 5px 0;">🔴 ${threat}</div>`).join('')}
                        </div>
                    `;
                }

                // Detailed Checks
                html += '<h2>🔍 Chi Tiết Kiểm Tra</h2>';

                const checkCategories = [
                    { key: 'suspiciousScripts', label: 'Suspicious Scripts', icon: '📜' },
                    { key: 'obfuscatedCode', label: 'Obfuscated Code', icon: '🔐' },
                    { key: 'iframeInjection', label: 'iframe Injection', icon: '📦' },
                    { key: 'base64Encoded', label: 'Base64 Encoded', icon: '🔤' },
                    { key: 'cryptoMiners', label: 'Crypto Miners', icon: '⛏️' },
                    { key: 'phishingIndicators', label: 'Phishing', icon: '🎣' },
                    { key: 'knownMaliciousDomains', label: 'Malicious Domains', icon: '☠️' },
                    { key: 'suspiciousPatterns', label: 'Suspicious Patterns', icon: '🔍' },
                    { key: 'redirects', label: 'Redirects', icon: '↪️' },
                    { key: 'evalUsage', label: 'eval() Usage', icon: '⚡' }
                ];

                checkCategories.forEach(cat => {
                    const checks = data.checks[cat.key];
                    if (checks && checks.length > 0) {
                        html += `
                            <div style="margin-bottom: 30px; border: 2px solid #ef4444; border-radius: 10px; overflow: hidden;">
                                <div style="background: #ef4444; color: white; padding: 15px; font-weight: bold;">
                                    ${cat.icon} ${cat.label.toUpperCase()} (${checks.length})
                                </div>
                                <div style="background: white; padding: 20px;">
                                    ${checks.map((check, idx) => `
                                        <div style="margin-bottom: 25px; padding: 20px; background: #f8f9fa; border-left: 4px solid ${getSeverityColor(check.severity)}; border-radius: 5px;">
                                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                                <span style="background: ${getSeverityColor(check.severity)}; color: white; padding: 5px 12px; border-radius: 5px; font-weight: bold; font-size: 0.85em;">
                                                    ${check.severity.toUpperCase()}
                                                </span>
                                                <span style="color: #666; font-size: 0.9em;">#${idx + 1}</span>
                                            </div>
                                            
                                            <div style="margin-bottom: 15px;">
                                                <strong style="color: #333; font-size: 1.1em;">🔍 Vấn đề:</strong>
                                                <div style="color: #555; margin-top: 5px; line-height: 1.6;">
                                                    ${check.description}
                                                </div>
                                            </div>

                                            ${check.code ? `
                                                <div style="margin-bottom: 15px;">
                                                    <strong style="color: #333;">📝 Code bị nghi ngờ:</strong>
                                                    <pre style="background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 5px; overflow-x: auto; margin-top: 8px; font-size: 0.9em; line-height: 1.4;"><code>${escapeHtml(check.code)}</code></pre>
                                                </div>
                                            ` : ''}

                                            ${check.decoded ? `
                                                <div style="margin-bottom: 15px;">
                                                    <strong style="color: #333;">🔓 Decoded content:</strong>
                                                    <pre style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; overflow-x: auto; margin-top: 8px; font-size: 0.9em; line-height: 1.4;"><code>${escapeHtml(check.decoded)}</code></pre>
                                                </div>
                                            ` : ''}

                                            ${check.domains && check.domains.length > 0 ? `
                                                <div style="margin-bottom: 15px;">
                                                    <strong style="color: #333;">🌐 Domains liên quan:</strong>
                                                    <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;">
                                                        ${check.domains.map(d => `
                                                            <span style="background: #fee2e2; color: #991b1b; padding: 5px 12px; border-radius: 5px; font-size: 0.9em;">${d}</span>
                                                        `).join('')}
                                                    </div>
                                                </div>
                                            ` : ''}

                                            <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 15px; border-radius: 5px;">
                                                <strong style="color: #059669;">💡 Cách xử lý:</strong>
                                                <div style="color: #065f46; margin-top: 8px; line-height: 1.6;">
                                                    ${check.recommendation}
                                                </div>
                                                ${getActionSteps(cat.key, check)}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }
                });

                // If clean
                if (data.summary.critical === 0 && data.summary.high === 0 && data.summary.medium === 0) {
                    html += `
                        <div style="text-align: center; padding: 60px; background: #ecfdf5; border-radius: 15px; border: 2px solid #10b981;">
                            <div style="font-size: 5em; margin-bottom: 20px;">✅</div>
                            <h2 style="color: #059669; margin-bottom: 15px;">Website sạch sẽ!</h2>
                            <p style="color: #065f46; font-size: 1.1em;">Không phát hiện mã độc hoặc code đáng ngờ.</p>
                        </div>
                    `;
                }
            }

            html += '</div>';
            document.getElementById('malwareTab').innerHTML = html;
        }

        function renderUrls(urls) {
            if (!urls || urls.length === 0) {
                return '<p style="text-align: center; padding: 40px; color: #666;">Không tìm thấy URLs</p>';
            }

            return urls.slice(0, 100).map(url => {
                const type = getUrlType(url.loc);
                return `
                    <div class="url-item">
                        <a href="${url.loc}" target="_blank" class="url-link">${url.loc}</a>
                        <span class="badge badge-${type}">${type}</span>
                    </div>
                `;
            }).join('');
        }

        function getUrlType(url) {
            const path = url.toLowerCase();
            if (path.includes('/blog/') || path.includes('/post/')) return 'blog';
            if (path.includes('/product/') || path.includes('/shop/')) return 'product';
            return 'page';
        }

        function exportCSV() {
            if (!currentUrls || currentUrls.length === 0) {
                alert('Không có URLs để export');
                return;
            }

            const csv = ['URL,Type'];
            currentUrls.forEach(url => {
                const type = getUrlType(url.loc);
                csv.push([url.loc, type].join(','));
            });

            const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
            const urlBlob = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = urlBlob;
            a.download = `sitemap-${new Date().getTime()}.csv`;
            a.click();
        }
        
        function toggleSolution(id) {
            const element = document.getElementById(id);
            element.classList.toggle('hidden');
        }

        // function escapeHtml(text) {
        //     const div = document.createElement('div');
        //     div.textContent = text;
        //     return div.innerHTML;
        // }

        function getSeverityColor(severity) {
            const colors = {
                'critical': '#dc2626',
                'high': '#ef4444',
                'medium': '#f59e0b',
                'low': '#3b82f6',
                'info': '#6b7280'
            };
            return colors[severity] || '#6b7280';
        }

        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        }

function getActionSteps(category, check) {
            const steps = {
                'phpBackdoors': `
                    <div style="margin-top: 12px; padding: 15px; background: #fff3cd; border-left: 4px solid #f59e0b; border-radius: 5px;">
                        <div style="margin-bottom: 12px;"><strong style="color: #dc2626;">⚠️ ĐÂY LÀ MÃ ĐỘC NGUY HIỂM - CẦN XỬ LÝ NGAY!</strong></div>
                        
                        <div style="margin-bottom: 8px;"><strong>📍 Bước 1: TÌM FILE CHỨA CODE ĐỘC</strong></div>
                        <div style="margin-left: 15px; margin-bottom: 15px; line-height: 1.8;">
                            <strong>Cách 1 - Dùng cPanel File Manager:</strong><br>
                            1. Đăng nhập cPanel<br>
                            2. Vào "File Manager"<br>
                            3. Click "Settings" (góc trên bên phải)<br>
                            4. Tick "Show Hidden Files" → Save<br>
                            5. Click "Search" (thanh công cụ)<br>
                            6. Trong ô search, paste code bị nghi ngờ (VD: <code>eval(base64_decode</code>)<br>
                            7. Click "Search"<br>
                            <br>
                            <strong>Cách 2 - Dùng FTP (FileZilla):</strong><br>
                            1. Download toàn bộ website về máy<br>
                            2. Dùng Notepad++ hoặc VSCode<br>
                            3. Nhấn Ctrl+Shift+F (Find in Files)<br>
                            4. Paste code nghi ngờ vào ô tìm kiếm<br>
                            5. Chọn folder website → Find All<br>
                        </div>

                        <div style="margin-bottom: 8px;"><strong>📍 Bước 2: XÓA CODE ĐỘC</strong></div>
                        <div style="margin-left: 15px; margin-bottom: 15px; line-height: 1.8;">
                            <strong>Trong cPanel:</strong><br>
                            1. Click chuột phải vào file → Edit<br>
                            2. Tìm dòng code độc (đã highlight)<br>
                            3. Xóa TOÀN BỘ dòng đó<br>
                            4. Click "Save Changes"<br>
                            <br>
                            <strong>Trong FTP:</strong><br>
                            1. Mở file bằng editor<br>
                            2. Xóa dòng code độc<br>
                            3. Save lại<br>
                            4. Upload file đã clean lên server (ghi đè)<br>
                        </div>

                        <div style="margin-bottom: 8px;"><strong>📍 Bước 3: SCAN TOÀN BỘ WEBSITE</strong></div>
                        <div style="margin-left: 15px; margin-bottom: 15px; line-height: 1.8;">
                            <strong>Plugin miễn phí (WordPress):</strong><br>
                            • Wordfence Security<br>
                            • Sucuri Security<br>
                            • Anti-Malware Security<br>
                            <br>
                            <strong>Tool online:</strong><br>
                            • <a href="https://sitecheck.sucuri.net" target="_blank">Sucuri SiteCheck</a><br>
                            • <a href="https://www.virustotal.com" target="_blank">VirusTotal</a><br>
                        </div>

                        <div style="margin-bottom: 8px;"><strong>📍 Bước 4: BẢO MẬT LẠI</strong></div>
                        <div style="margin-left: 15px; line-height: 1.8;">
                            1. Đổi password: cPanel, FTP, Database, WordPress Admin<br>
                            2. Cập nhật WordPress, themes, plugins lên bản mới nhất<br>
                            3. Xóa themes/plugins không dùng<br>
                            4. Cài plugin bảo mật (Wordfence hoặc Sucuri)<br>
                            5. Enable 2FA (Two-Factor Authentication)<br>
                        </div>
                    </div>
                `,
                'base64Encoded': `
                    <div style="margin-top: 12px; padding: 15px; background: #fff3cd; border-left: 4px solid #f59e0b; border-radius: 5px;">
                        <div style="margin-bottom: 12px;"><strong style="color: #f59e0b;">⚠️ CODE BỊ MÃ HÓA - CẦN KIỂM TRA</strong></div>
                        
                        <div style="margin-bottom: 8px;"><strong>📍 Cách decode để xem nội dung:</strong></div>
                        <div style="margin-left: 15px; margin-bottom: 15px; line-height: 1.8;">
                            1. Copy chuỗi base64 (phần trong ngoặc kép)<br>
                            2. Vào <a href="https://www.base64decode.org" target="_blank">base64decode.org</a><br>
                            3. Paste vào → Click "Decode"<br>
                            4. Đọc kết quả:<br>
                            &nbsp;&nbsp;&nbsp;• Nếu thấy <code>eval</code>, <code>shell_exec</code>, <code>system</code> → ĐỘC HẠI, xóa ngay<br>
                            &nbsp;&nbsp;&nbsp;• Nếu là text bình thường → An toàn<br>
                        </div>

                        <div style="margin-bottom: 8px;"><strong>📍 Nếu là mã độc - Cách xóa:</strong></div>
                        <div style="margin-left: 15px; line-height: 1.8;">
                            1. Tìm file chứa code (dùng cPanel Search hoặc Notepad++)<br>
                            2. Xóa TOÀN BỘ dòng chứa base64<br>
                            3. Save file<br>
                            4. Scan lại website bằng Wordfence<br>
                        </div>
                    </div>
                `,
                'suspiciousScripts': `
                    <div style="margin-top: 12px; padding: 15px; background: #fff3cd; border-left: 4px solid #f59e0b; border-radius: 5px;">
                        <div style="margin-bottom: 12px;"><strong>📍 SCRIPT TỪ NGUỒN KHÔNG RÕ - CẦN XÓA</strong></div>
                        
                        <div style="margin-bottom: 8px;"><strong>Bước 1: Tìm script trong code HTML</strong></div>
                        <div style="margin-left: 15px; margin-bottom: 15px; line-height: 1.8;">
                            <strong>WordPress:</strong><br>
                            • Vào Appearance → Theme Editor<br>
                            • Kiểm tra file: header.php, footer.php<br>
                            • Tìm thẻ <code>&lt;script src="..."&gt;</code><br>
                            <br>
                            <strong>HTML thuần:</strong><br>
                            • Mở file index.html<br>
                            • Nhấn Ctrl+F, tìm domain bị nghi ngờ (VD: <code>.tk</code>, <code>.ml</code>)<br>
                        </div>

                        <div style="margin-bottom: 8px;"><strong>Bước 2: Xóa script</strong></div>
                        <div style="margin-left: 15px; margin-bottom: 15px; line-height: 1.8;">
                            Xóa TOÀN BỘ dòng:<br>
                            <code>&lt;script src="http://example.tk/malware.js"&gt;&lt;/script&gt;</code><br>
                            <br>
                            Hoặc cả block:<br>
                            <code>&lt;script&gt;...code đáng ngờ...&lt;/script&gt;</code>
                        </div>

                        <div style="margin-bottom: 8px;"><strong>Bước 3: Clear cache</strong></div>
                        <div style="margin-left: 15px; line-height: 1.8;">
                            • Clear cache website (plugin cache nếu dùng)<br>
                            • Clear cache Cloudflare (nếu có)<br>
                            • Test lại website<br>
                        </div>
                    </div>
                `,
                'iframeInjection': `
                    <div style="margin-top: 12px; padding: 15px; background: #fee2e2; border-left: 4px solid #dc2626; border-radius: 5px;">
                        <div style="margin-bottom: 12px;"><strong style="color: #dc2626;">🚨 IFRAME ẨN - DẤU HIỆU BỊ HACK!</strong></div>
                        
                        <div style="margin-bottom: 8px;"><strong>📍 Làm NGAY:</strong></div>
                        <div style="margin-left: 15px; margin-bottom: 15px; line-height: 1.8;">
                            1. <strong>Backup website</strong> (xuất database + download files)<br>
                            2. <strong>Tìm iframe:</strong><br>
                            &nbsp;&nbsp;&nbsp;• Vào cPanel → File Manager<br>
                            &nbsp;&nbsp;&nbsp;• Search toàn bộ: <code>&lt;iframe</code><br>
                            &nbsp;&nbsp;&nbsp;• Tìm các file chứa iframe ẩn<br>
                            3. <strong>Xóa iframe:</strong><br>
                            &nbsp;&nbsp;&nbsp;• Edit file<br>
                            &nbsp;&nbsp;&nbsp;• Xóa dòng <code>&lt;iframe...&gt;&lt;/iframe&gt;</code><br>
                            &nbsp;&nbsp;&nbsp;• Save<br>
                        </div>

                        <div style="margin-bottom: 8px;"><strong>📍 File thường bị inject:</strong></div>
                        <div style="margin-left: 15px; margin-bottom: 15px; line-height: 1.8;">
                            WordPress:<br>
                            • wp-content/themes/[theme]/header.php<br>
                            • wp-content/themes/[theme]/footer.php<br>
                            • wp-config.php<br>
                            • .htaccess<br>
                        </div>

                        <div style="margin-bottom: 8px;"><strong>📍 Sau khi xóa:</strong></div>
                        <div style="margin-left: 15px; line-height: 1.8;">
                            1. Đổi TẤT CẢ password<br>
                            2. Scan malware bằng Wordfence<br>
                            3. Cập nhật WordPress + plugins<br>
                            4. Cài Wordfence hoặc Sucuri để bảo vệ<br>
                        </div>
                    </div>
                `,
                'cryptoMiners': `
                    <div style="margin-top: 12px; padding: 15px; background: #fee2e2; border-left: 4px solid #dc2626; border-radius: 5px;">
                        <div style="margin-bottom: 12px;"><strong style="color: #dc2626;">🚨 CRYPTO MINER - ĐANG BỊ ĐÀO COIN TRÁI PHÉP!</strong></div>
                        
                        <div style="margin-bottom: 8px;"><strong>📍 Triệu chứng:</strong></div>
                        <div style="margin-left: 15px; margin-bottom: 15px; line-height: 1.8;">
                            • CPU server lên 100%<br>
                            • Website chạy chậm<br>
                            • Máy khách truy cập bị giật lag<br>
                        </div>

                        <div style="margin-bottom: 8px;"><strong>📍 XÓA NGAY:</strong></div>
                        <div style="margin-left: 15px; margin-bottom: 15px; line-height: 1.8;">
                            1. Tìm script miner trong code:<br>
                            &nbsp;&nbsp;&nbsp;• Search: <code>coinhive</code>, <code>cryptoloot</code>, <code>jsecoin</code><br>
                            2. Xóa script chứa miner<br>
                            3. Kiểm tra tất cả file .js trong website<br>
                            4. Scan database tìm script inject<br>
                        </div>

                        <div style="margin-bottom: 8px;"><strong>📍 Prevent:</strong></div>
                        <div style="margin-left: 15px; line-height: 1.8;">
                            • Cài plugin: MinerBlock hoặc NoCoin<br>
                            • Block domain miner trong .htaccess<br>
                            • Enable CSP (Content Security Policy)<br>
                        </div>
                    </div>
                `,
                'shellInjection': `
                    <div style="margin-top: 12px; padding: 15px; background: #fee2e2; border-left: 4px solid #dc2626; border-radius: 5px;">
                        <div style="margin-bottom: 12px;"><strong style="color: #dc2626;">🚨 SHELL INJECTION - CỰC KỲ NGUY HIỂM!</strong></div>
                        
                        <div style="margin-bottom: 8px;"><strong>📍 Code này cho phép hacker:</strong></div>
                        <div style="margin-left: 15px; margin-bottom: 15px; line-height: 1.8;">
                            • Thực thi lệnh trên server<br>
                            • Xóa toàn bộ website<br>
                            • Đọc/sửa database<br>
                            • Upload backdoor mới<br>
                        </div>

                        <div style="margin-bottom: 8px;"><strong>📍 Cách xử lý KHẨN CẤP:</strong></div>
                        <div style="margin-left: 15px; margin-bottom: 15px; line-height: 1.8;">
                            1. <strong>TẮT WEBSITE NGAY</strong> (maintenance mode)<br>
                            2. <strong>Backup hiện tại</strong> (để điều tra)<br>
                            3. <strong>Restore từ backup sạch</strong> (trước ngày bị hack)<br>
                            4. Nếu không có backup:<br>
                            &nbsp;&nbsp;&nbsp;• Tìm file chứa shell injection<br>
                            &nbsp;&nbsp;&nbsp;• Xóa TOÀN BỘ đoạn code nguy hiểm<br>
                            &nbsp;&nbsp;&nbsp;• Validate tất cả input từ user<br>
                            5. <strong>Đổi TẤT CẢ password</strong><br>
                            6. <strong>Báo hosting provider</strong><br>
                            7. <strong>Kiểm tra log</strong> xem hacker đã làm gì<br>
                        </div>

                        <div style="margin-bottom: 8px;"><strong>📍 Sau khi clean:</strong></div>
                        <div style="margin-left: 15px; line-height: 1.8;">
                            • Cập nhật tất cả code<br>
                            • Cài Web Application Firewall (WAF)<br>
                            • Enable logging và monitoring<br>
                            • Thuê security audit nếu có thể<br>
                        </div>
                    </div>
                `,
                'jsRedirects': `
                    <div style="margin-top: 12px; padding: 15px; background: #fff3cd; border-left: 4px solid #f59e0b; border-radius: 5px;">
                        <div style="margin-bottom: 12px;"><strong>⚠️ REDIRECT TỰ ĐỘNG - CÓ THỂ LÀ PHISHING</strong></div>
                        
                        <div style="margin-bottom: 8px;"><strong>📍 Kiểm tra redirect có hợp lệ:</strong></div>
                        <div style="margin-left: 15px; margin-bottom: 15px; line-height: 1.8;">
                            • Redirect đến domain của bạn? → OK<br>
                            • Redirect đến domain lạ? → XÓA NGAY<br>
                        </div>

                        <div style="margin-bottom: 8px;"><strong>📍 Cách tìm và xóa:</strong></div>
                        <div style="margin-left: 15px; line-height: 1.8;">
                            1. Search trong code: <code>window.location</code>, <code>location.href</code><br>
                            2. Kiểm tra URL đích<br>
                            3. Nếu là URL lạ → Xóa dòng code<br>
                            4. Test lại website<br>
                        </div>
                    </div>
                `
            };
            return steps[category] || '';
        }
/* Back to top */
const btn = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    btn.classList.add("show");
  } else {
    btn.classList.remove("show");
  }
});

btn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});
