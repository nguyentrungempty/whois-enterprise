const whois = require('whois');
const { exec } = require("child_process");

async function getWhoisInfo(domain) {
    return new Promise((resolve, reject) => {
        exec(`whois ${domain}`, { timeout: 5000 }, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            const parsed = parseWhoisData(data);
            resolve(parsed);
        });
    });

}

function parseWhoisData(data) {
    const lines = data.split('\n');
    const result = {
        raw: data,
        registrar: null,
        registrarUrl: null,
        creationDate: null,
        expirationDate: null,
        updatedDate: null,
        status: [],
        nameServers: [],
        dnssec: null,
        registrantOrg: null,
        registrantCountry: null,
        adminEmail: null,
        techEmail: null
    };

    lines.forEach(line => {
        const lower = line.toLowerCase();
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('%') || trimmedLine.startsWith('#')) {
            return;
        }

        // Registrar
        if ((lower.includes('registrar:') || lower.includes('sponsoring registrar:')) && !result.registrar) {
            result.registrar = line.split(':').slice(1).join(':').trim();
        }

        // Registrar URL
        if (lower.includes('registrar url:') && !result.registrarUrl) {
            result.registrarUrl = line.split(':').slice(1).join(':').trim();
        }

        // Creation Date
        if ((lower.includes('creation date:') || lower.includes('created:') || lower.includes('created on:') || lower.includes('registered on:')) && !result.creationDate) {
            result.creationDate = line.split(':').slice(1).join(':').trim();
        }

        // Expiration Date
        if ((lower.includes('expir') && lower.includes('date:')) || lower.includes('registry expiry date:') || lower.includes('paid-till:')) {
            if (!result.expirationDate) {
                result.expirationDate = line.split(':').slice(1).join(':').trim();
            }
        }

        // Updated Date
        if ((lower.includes('updated date:') || lower.includes('last updated:') || lower.includes('modified:') || lower.includes('changed:')) && !result.updatedDate) {
            result.updatedDate = line.split(':').slice(1).join(':').trim();
        }

        // Status
        if (lower.includes('domain status:') || (lower.includes('status:') && !lower.includes('dnssec'))) {
            const status = line.split(':').slice(1).join(':').trim();
            if (status && !result.status.includes(status) && status.length < 100) {
                result.status.push(status);
            }
        }

        // Name Servers
        if (lower.includes('name server:') || lower.includes('nserver:') || lower.includes('nameserver:')) {
            const ns = line.split(':').slice(1).join(':').trim().split(/\s+/)[0]; // Get first part (domain only)
            if (ns && !result.nameServers.includes(ns) && ns.includes('.')) {
                result.nameServers.push(ns);
            }
        }

        // DNSSEC
        if (lower.includes('dnssec:') && !result.dnssec) {
            result.dnssec = line.split(':').slice(1).join(':').trim();
        }

        // Registrant Organization
        if ((lower.includes('registrant organization:') || lower.includes('registrant:')) && !result.registrantOrg) {
            const org = line.split(':').slice(1).join(':').trim();
            if (org && org.toLowerCase() !== 'redacted for privacy') {
                result.registrantOrg = org;
            }
        }

        // Registrant Country
        if (lower.includes('registrant country:') && !result.registrantCountry) {
            result.registrantCountry = line.split(':').slice(1).join(':').trim();
        }

        // Admin Email
        if (lower.includes('admin email:') && !result.adminEmail) {
            result.adminEmail = line.split(':').slice(1).join(':').trim();
        }

        // Tech Email
        if (lower.includes('tech email:') && !result.techEmail) {
            result.techEmail = line.split(':').slice(1).join(':').trim();
        }
    });

    // Clean up data
    if (result.registrar && result.registrar.toLowerCase().includes('redacted')) {
        result.registrar = 'Privacy Protected';
    }

    return result;
}

module.exports = { getWhoisInfo };
