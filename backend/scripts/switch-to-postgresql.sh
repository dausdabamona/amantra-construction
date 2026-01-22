#!/bin/bash

# AMANTRA Construction - Switch to PostgreSQL/Supabase
# This script helps migrate from SQLite to PostgreSQL

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  AMANTRA Construction - Switch to PostgreSQL/Supabase"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if DATABASE_URL is set for PostgreSQL
if [[ -z "${DATABASE_URL}" ]]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    echo ""
    echo "Please set your PostgreSQL/Supabase connection string:"
    echo ""
    echo "  export DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\""
    echo ""
    exit 1
fi

# Check if it's a PostgreSQL URL
if [[ "${DATABASE_URL}" != postgresql* ]]; then
    echo "❌ ERROR: DATABASE_URL does not appear to be a PostgreSQL connection string!"
    echo ""
    echo "Current value: ${DATABASE_URL}"
    echo ""
    echo "Expected format: postgresql://user:password@host:port/database"
    exit 1
fi

echo "✓ DATABASE_URL is set to PostgreSQL"
echo ""

# Backup SQLite schema
echo "📦 Backing up SQLite schema..."
cp prisma/schema.prisma prisma/schema.sqlite.prisma.backup
echo "   Saved to: prisma/schema.sqlite.prisma.backup"
echo ""

# Copy PostgreSQL schema
echo "📝 Switching to PostgreSQL schema..."
cp prisma/schema.postgresql.prisma prisma/schema.prisma
echo "   Schema updated to use PostgreSQL"
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
echo ""

# Push schema to database
echo "🚀 Pushing schema to PostgreSQL..."
npx prisma db push
echo ""

# Ask about seeding
read -p "Do you want to seed the database with demo data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Migration to PostgreSQL completed successfully!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Next steps:"
echo "  1. Update your .env file with the PostgreSQL DATABASE_URL"
echo "  2. Test your application: npm run start:dev"
echo "  3. Verify data in Prisma Studio: npx prisma studio"
echo ""
