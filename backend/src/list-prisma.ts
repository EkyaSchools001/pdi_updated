import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
console.log('Available Prisma properties:');
const keys = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
console.log(keys.sort().join(', '));
prisma.$disconnect();
