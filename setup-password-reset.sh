#!/bin/bash

# Password Reset Setup Script
# Run this script to set up the password reset feature

echo "============================================"
echo "🔐 Password Reset Feature Setup"
echo "============================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "Step 1: Installing nodemailer..."
npm install nodemailer
npm install --save-dev @types/nodemailer
echo "✅ Nodemailer installed"
echo ""

echo "Step 2: Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

echo "Step 3: Creating database migration..."
npx prisma migrate dev --name add_password_reset_tokens
echo "✅ Migration created and applied"
echo ""

echo "============================================"
echo "✅ Setup Complete!"
echo "============================================"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Configure SMTP in .env file:"
echo "   SMTP_HOST=\"smtp.gmail.com\""
echo "   SMTP_PORT=\"587\""
echo "   SMTP_USER=\"your-email@gmail.com\""
echo "   SMTP_PASS=\"your-app-password\""
echo ""
echo "2. For Gmail, generate an App Password:"
echo "   https://myaccount.google.com/apppasswords"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "4. Test the feature:"
echo "   http://localhost:3000/forgot-password"
echo ""
echo "📖 Full documentation: PASSWORD-RESET-IMPLEMENTATION.md"
echo ""
