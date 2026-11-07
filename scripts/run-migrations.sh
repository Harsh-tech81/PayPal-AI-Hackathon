#!/usr/bin/env bash
# PayShield AI - Run Prisma & MongoDB migrations

echo "📦 Running Prisma migrations..."
npx prisma db push --schema=database/prisma/schema.prisma

echo "🌱 Seeding demo data..."
npx tsx database/seeds/seed-demo-data.ts

echo "✅ Migrations & seed completed successfully!"
