// scripts/setup.js
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Setting up the database...');

try {
  // Check if .env.local exists
  if (!fs.existsSync('.env.local')) {
    console.log('⚠️  Creating .env.local from .env.example...');
    if (fs.existsSync('.env.example')) {
      fs.copyFileSync('.env.example', '.env.local');
      console.log('✅ .env.local created! Please add your OPENAI_API_KEY and NEXTAUTH_SECRET');
    } else {
      console.log('❌ .env.example not found');
    }
  }

  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Push database schema
  console.log('🗄️  Creating database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('✅ Database setup complete!');
  console.log('💡 Next steps:');
  console.log('   1. Add your OPENAI_API_KEY to .env.local');
  console.log('   2. Add your NEXTAUTH_SECRET to .env.local');
  console.log('   3. Run: npm run dev');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}