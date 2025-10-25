#!/bin/bash

# IP Tracker - Installation Script
# This script installs all dependencies and verifies the setup

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         IP Tracker - Installation & Setup                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi
echo ""

# Verify file structure
echo "🔍 Verifying project structure..."
errors=0

files=(
    "server/index.js"
    "client/src/App.jsx"
    "client/src/main.jsx"
    "client/src/components/Dashboard.jsx"
    "client/src/components/TrackingDetails.jsx"
    "package.json"
    "client/package.json"
    ".env"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ Missing: $file"
        errors=$((errors + 1))
    fi
done
echo ""

if [ $errors -eq 0 ]; then
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              ✅ Installation Complete!                     ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🚀 Next Steps:"
    echo ""
    echo "1. For localhost testing:"
    echo "   npm run dev"
    echo ""
    echo "2. For public access (other networks):"
    echo "   See START_HERE.md or run: npm run setup"
    echo ""
    echo "3. Access the dashboard:"
    echo "   http://localhost:5173"
    echo ""
    echo "📚 Documentation:"
    echo "   - START_HERE.md        → Quick start guide"
    echo "   - QUICK_START.md       → 5-minute setup"
    echo "   - SETUP_PUBLIC_ACCESS.md → Network access guide"
    echo "   - HOW_IT_WORKS.md      → Technical details"
    echo ""
    echo "Happy tracking! 🎯"
else
    echo "❌ Installation completed with $errors error(s)"
    echo "   Please check the missing files above"
    exit 1
fi
