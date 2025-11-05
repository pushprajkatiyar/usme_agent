#!/bin/bash

# Setup script for environment variables
# Run this to quickly create .env.local file

echo "🔧 Setting up environment variables for Retell AI Chatbot"
echo ""
echo "This will create a .env.local file with your Retell AI credentials."
echo ""

# Check if .env.local already exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled. Keeping existing .env.local"
        exit 0
    fi
fi

# Get API key
echo "📝 Please enter your Retell AI credentials:"
echo ""
read -p "Retell API Key: " RETELL_API_KEY
read -p "Retell Agent ID: " RETELL_AGENT_ID

# Create .env.local file
cat > .env.local << EOF
# Retell AI Configuration
# DO NOT commit this file to git!

RETELL_API_KEY=$RETELL_API_KEY
RETELL_AGENT_ID=$RETELL_AGENT_ID
EOF

echo ""
echo "✅ .env.local file created successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Run 'npm install' to install dependencies"
echo "   2. Run 'vercel dev' to test locally"
echo "   3. Run 'vercel --prod' to deploy to production"
echo ""
echo "📚 For more details, see VERCEL_DEPLOYMENT.md"

