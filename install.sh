#!/bin/bash

echo "=========================================="
echo "  WHOIS Enterprise Scanner - Installer"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js chưa được cài đặt!"
    echo "Vui lòng cài Node.js từ: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "⚠️  Node.js version quá cũ. Cần >= 14, hiện tại: $(node -v)"
    echo "Vui lòng update Node.js"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Navigate to backend
cd backend || exit 1

echo "📦 Đang cài đặt dependencies..."
echo ""

# Install packages one by one to avoid timeout
npm install express --save
npm install axios --save
npm install cors --save
npm install whois --save
npm install dns --save
npm install xml2js --save

echo ""
echo "✅ Cài đặt hoàn tất!"
echo ""
echo "=========================================="
echo "  Khởi động server:"
echo "  cd backend && node server.js"
echo "=========================================="

