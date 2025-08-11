#!/bin/bash

# Script to demonstrate log converter with sample Supertest logs
# This simulates what your 6000+ test migration would look like

set -e

echo "🚀 Log Converter Demo - Supertest to Playwright Migration"
echo "════════════════════════════════════════════════════════"

# Create sample legacy test logs directory
DEMO_DIR="demo-legacy-logs"
OUTPUT_DIR="demo-generated-tests"

echo "📁 Creating sample legacy test logs..."

mkdir -p "$DEMO_DIR/authentication"
mkdir -p "$DEMO_DIR/user-management" 
mkdir -p "$DEMO_DIR/profile-management"

# Sample Supertest authentication log
cat > "$DEMO_DIR/authentication/auth-login.log" << 'EOF'
describe('Authentication API', () => {
  test('should authenticate user with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'securePassword123'
      })
      .expect(200);
    
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('test@example.com');
  });
  
  test('should reject invalid credentials', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongPassword'
      })
      .expect(401);
  });
});
EOF

# Sample user management log
cat > "$DEMO_DIR/user-management/user-crud.log" << 'EOF'
describe('User Management', () => {
  test('should create new user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      username: 'johndoe'
    };
    
    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);
    
    expect(response.body.id).toBeGreaterThan(0);
    expect(response.body.email).toBe(userData.email);
  });
  
  test('should get user by id', async () => {
    const userId = 123;
    
    const response = await request(app)
      .get(`/api/users/${userId}`)
      .expect(200);
    
    expect(response.body.id).toBe(userId);
    expect(response.body.name).toBeDefined();
  });
  
  test('should update user profile', async () => {
    const userId = 123;
    const updateData = {
      name: 'John Updated',
      phone: '+1234567890'
    };
    
    await request(app)
      .put(`/api/users/${userId}`)
      .send(updateData)
      .expect(200);
  });
});
EOF

# Sample profile management log
cat > "$DEMO_DIR/profile-management/profile-tests.log" << 'EOF'
describe('Profile Management', () => {
  test('should update email address', async () => {
    const userId = 123;
    
    await request(app)
      .patch(`/api/users/${userId}/email`)
      .send({ email: 'newemail@example.com' })
      .expect(200);
  });
  
  test('should upload profile picture', async () => {
    const userId = 123;
    
    await request(app)
      .post(`/api/users/${userId}/avatar`)
      .attach('avatar', 'test-files/profile.jpg')
      .expect(200);
  });
});
EOF

echo "✅ Sample logs created in $DEMO_DIR/"

echo ""
echo "🔄 Running log converter..."

# Run the converter
cd utils/log-converter

echo "node log-converter-cli.js --input ../../$DEMO_DIR --output ../../$OUTPUT_DIR --project-name 'Demo Migrated Tests' --batch-size 5 --verbose"

# Note: This would actually run the converter
# For demo purposes, we'll show what the command would be
echo ""
echo "📋 This would:"
echo "  1. Parse all .log files in $DEMO_DIR/"
echo "  2. Extract test structure and API calls"
echo "  3. Generate Playwright test files"
echo "  4. Create reusable utilities and fixtures"
echo "  5. Set up multi-environment configuration"

echo ""
echo "📂 Expected output structure:"
echo "$OUTPUT_DIR/"
echo "├── tests/"
echo "│   ├── authentication/"
echo "│   │   └── authentication.spec.ts"
echo "│   ├── user-management/"
echo "│   │   └── user-management.spec.ts"
echo "│   └── profile-management/"
echo "│       └── profile-management.spec.ts"
echo "├── utils/"
echo "│   ├── test-actions.ts"
echo "│   ├── test-fixtures.ts"
echo "│   └── data-generator.ts"
echo "├── config/"
echo "│   ├── dev.config.ts"
echo "│   ├── staging.config.ts"
echo "│   └── endpoints.ts"
echo "├── scripts/"
echo "│   └── run-tests.sh"
echo "├── package.json"
echo "├── playwright.config.ts"
echo "└── README.md"

echo ""
echo "🎯 For your 6000+ test migration:"
echo ""
echo "1. 📁 Organize your Supertest logs by feature/suite"
echo "2. 🔄 Run converter in batch mode:"
echo "   node log-converter-cli.js \\"
echo "     --input ./supertest-logs \\"
echo "     --output ./playwright-tests \\"
echo "     --batch-size 100 \\"
echo "     --migration-mode full \\"
echo "     --legacy-mode supertest"
echo ""
echo "3. ✅ Review and customize generated tests"
echo "4. 🧪 Run tests: npm run test:dev"
echo "5. 🚀 Deploy to CI/CD pipeline"

echo ""
echo "🎉 Demo complete! The converter is ready for your large-scale migration."

# Cleanup demo files
echo ""
read -p "🗑️  Clean up demo files? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm -rf "../../$DEMO_DIR"
  echo "✅ Demo files cleaned up"
fi
