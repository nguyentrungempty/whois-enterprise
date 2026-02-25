# WHOIS Enterprise Scanner

Comprehensive domain intelligence and security analysis tool.

## Features

- **WHOIS Information**: Domain registration details, registrar, dates, status
- **DNS Records**: A, AAAA, MX, TXT, NS, CNAME records
- **IP Geolocation**: Location, ISP, organization information
- **SSL Certificate**: Validity, issuer, expiration dates
- **Technology Detection**: Server, CMS, frameworks, analytics
- **Risk Assessment**: Automated security risk scoring

## Installation

```bash
cd backend
npm install
```

## Usage

```bash
node server.js
```

Server runs on http://localhost:3000

## API

**Endpoint**: `GET /api/scan?domain=example.com`

**Response**:
```json
{
  "whois": {},
  "dns": {},
  "ip": {},
  "ssl": {},
  "tech": {},
  "riskScore": {
    "score": 0,
    "level": "low",
    "risks": []
  }
}
```

## Requirements

- Node.js v18+
- npm

## License

MIT
