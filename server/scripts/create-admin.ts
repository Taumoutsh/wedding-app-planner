import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const username = 'admin';
    const password = 'admin';

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.log(`User "${username}" already exists`);
      console.log(`ID: ${existingUser.id}`);
      await prisma.$disconnect();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    console.log(`\nUser created successfully!`);
    console.log(`Username: ${user.username}`);
    console.log(`Password: ${password}`);
    console.log(`ID: ${user.id}`);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
