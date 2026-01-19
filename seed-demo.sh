#!/bin/bash

# Quick Demo Data Seeding Script
# Run this to populate your database with realistic demo data

echo "============================================"
echo "🌱 Demo Data Seeding"
echo "============================================"
echo ""
echo "This will create demo data for:"
echo "  - User: koushik.saha.517@my.csun.edu"
echo "  - 5 Blog posts"
echo "  - 5 Conferences"
echo "  - 3 Conference registrations"
echo "  - 1 Premium membership"
echo "  - 8 Notifications"
echo "  - 5 Reviews"
echo ""

# Check if user wants to clear existing data
read -p "Clear existing demo data first? (y/N): " clear_first

if [[ $clear_first =~ ^[Yy]$ ]]; then
    echo ""
    echo "⚠️  This will delete all blogs, conferences, and user-specific data!"
    read -p "Are you sure? (y/N): " confirm

    if [[ $confirm =~ ^[Yy]$ ]]; then
        echo ""
        echo "Running with --clear-first..."
        npx ts-node scripts/seed-demo-data.ts --clear-first
    else
        echo ""
        echo "❌ Aborted"
        exit 0
    fi
else
    echo ""
    echo "Running seed script (keeping existing data)..."
    npx ts-node scripts/seed-demo-data.ts
fi

echo ""
echo "============================================"
echo "✅ Done!"
echo "============================================"
echo ""
echo "📝 Login Details:"
echo "   URL: http://localhost:3000/login"
echo "   Email: koushik.saha.517@my.csun.edu"
echo "   Password: password123"
echo ""
echo "🔍 Check your data:"
echo "   Dashboard: http://localhost:3000/dashboard"
echo "   Notifications: http://localhost:3000/dashboard/notifications"
echo "   Reviews: http://localhost:3000/dashboard/reviews"
echo "   Conferences: http://localhost:3000/conferences"
echo "   Blogs: http://localhost:3000 (homepage)"
echo ""
