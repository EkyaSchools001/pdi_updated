const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const goals = await prisma.goal.findMany({
    where: {
      OR: [
        { teacherEmail: { contains: 'teacher3' } },
        { teacher: { contains: 'Teacher 3' } }
      ]
    },
    include: {
      teacher: true
    }
  });

  console.log(JSON.stringify(goals, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
