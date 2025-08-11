#!/bin/bash
TAG=${1:-smoke}
echo "🏷️  Running REAL tests with tag: @$TAG"
npx playwright test tests/real-working/ --grep "@$TAG"
