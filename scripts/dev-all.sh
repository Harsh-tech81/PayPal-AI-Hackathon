#!/usr/bin/env bash
# PayShield AI - Launch all microservices & Next.js concurrently

echo "🚀 Starting PayShield AI Microservices Ecosystem..."

# Launch Microservices
npx tsx services/user-service/src/index.ts &
npx tsx services/transaction-service/src/index.ts &
npx tsx services/verification-agent/src/index.ts &
npx tsx services/risk-engine/src/index.ts &
npx tsx services/alert-service/src/index.ts &
npx tsx services/escalation-service/src/index.ts &

# Launch Next.js Web App
cd web-app && npm run dev
