import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user with password "admin"
    const hashedPassword = await bcrypt.hash('admin', 10);

    const user = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
      },
    });

    console.log('\n✓ Database seeded successfully!');
    console.log('\nDefault user created:');
    console.log('  Username: admin');
    console.log('  Password: admin');
    console.log('\nPlease change the password after first login!\n');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
