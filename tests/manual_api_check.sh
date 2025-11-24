#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000"
LICENSE_KEY="YOUR_LICENSE_KEY_HERE" # Will be replaced dynamically or manually
echo "Starting API Tests against $BASE_URL..."

# Helper function
check_status() {
    if [ $1 -eq $2 ]; then
        echo "✅ Test Passed: $3"
    else
        echo "❌ Test Failed: $3 (Expected $2, got $1)"
    fi
}

# 1. Get a valid license key from the database (via API if possible, or hardcoded from seed)
# For this test, we'll use the seed data if available, or fetch from a known endpoint if auth was easy.
# Since auth is complex in bash, let's try to hit the public config endpoint with a known key from seed.
# From seed.ts, we don't know the exact key as it's random. 
# BUT, we can try to fetch all widgets if we had a token.
# Instead, let's assume the user will provide one or we skip this if we can't find one.
# ACTUALLY, I can query the DB directly using the project's tools? No, I'm in bash.
# Let's try to use a placeholder and fail if not set, or try to extract from logs?
# Better: I will use the browser test to get the key.
# For now, let's test the "Invalid License" case which doesn't need a valid key.

echo "--- Test C5: Invalid License Key ---"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/widget/invalid-key-123/config")
check_status $STATUS 404 "Invalid License Key returns 404"

echo "--- Test C4: CORS Headers on Error ---"
HEADERS=$(curl -s -I -H "Origin: http://evil.com" "$BASE_URL/api/widget/invalid-key-123/config")
if echo "$HEADERS" | grep -i -q "Access-Control-Allow-Origin"; then
    echo "✅ Test Passed: CORS headers present on error"
else
    echo "❌ Test Failed: CORS headers missing on error"
fi

# To test C1 and C2 properly, we need a REAL license key.
# I will print instructions to run this with a key.
echo ""
echo "To run C1 (Valid Domain) and C2 (Invalid Domain), run:"
echo "  export LICENSE_KEY=your_key"
echo "  ./tests/manual_api_check.sh"
echo ""

if [ -n "$LICENSE_KEY" ] && [ "$LICENSE_KEY" != "YOUR_LICENSE_KEY_HERE" ]; then
    echo "--- Test C1: Fetch Config (Valid Domain) ---"
    # Assuming localhost is allowed
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Origin: http://localhost:3000" "$BASE_URL/api/widget/$LICENSE_KEY/config")
    check_status $STATUS 200 "Valid Domain returns 200"

    echo "--- Test C2: Fetch Config (Invalid Domain) ---"
    # Assuming evil.com is NOT allowed
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Origin: http://evil.com" "$BASE_URL/api/widget/$LICENSE_KEY/config")
    check_status $STATUS 403 "Invalid Domain returns 403"
fi
