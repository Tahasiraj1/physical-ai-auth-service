#!/bin/bash

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Run Better Auth migration
echo "Running Better Auth migration..."
echo "DATABASE_URL is set: ${DATABASE_URL:0:20}..."

npx @better-auth/cli migrate

