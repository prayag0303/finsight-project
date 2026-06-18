const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@finsight.dev' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@finsight.dev',
      password: passwordHash,
    },
  });

  // Wipe all transaction-related data for the demo user
  await prisma.chatHistory.deleteMany({ where: { userId: user.id } });
  await prisma.fraudAlert.deleteMany({ where: { userId: user.id } });
  await prisma.subscription.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.merchantLearning.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.deleteMany({ where: { userId: user.id } });

  console.log('✓ Seed complete');
  console.log('  Email:    demo@finsight.dev');
  console.log('  Password: Demo@1234');
  console.log('  Transactions: 0');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
