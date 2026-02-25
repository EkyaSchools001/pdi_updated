#!/usr/bin/env bash
# exit on error
set -o errexit

# Frontend Build
echo "Building Frontend..."
npm install
npx vite build

# Backend Build
echo "Building Backend..."
cd backend
npm install
npx prisma generate
npm run build

echo "Build Completed successfully!"
