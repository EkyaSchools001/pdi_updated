const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const keys = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
console.log('Runtime Prisma Properties:', keys.sort().join(', '));
prisma.$disconnect();
