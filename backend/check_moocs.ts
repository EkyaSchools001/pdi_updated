
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking MOOC Submissions...');

    const submissions = await prisma.moocSubmission.findMany({
        include: {
            user: true
        }
    });

    console.log(`Found ${submissions.length} submissions.`);

    for (const sub of submissions) {
        console.log('---');
        console.log(`ID: ${sub.id}`);
        console.log(`Course: ${sub.courseName}`);
        console.log(`User ID: ${sub.userId}`);
        console.log(`User Name (from User table): ${sub.user?.fullName}`);
        console.log(`Teacher Name (from Submission): ${sub.teacherName}`);
        console.log(`Status: ${sub.status}`);
        console.log(`Submitted At: ${sub.submittedAt}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
