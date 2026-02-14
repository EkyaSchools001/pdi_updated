import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Course Verification...');

    // 1. Create a Course
    const course = await prisma.course.create({
        data: {
            title: 'Test Course 101',
            category: 'Testing',
            hours: 1,
            instructor: 'Test Instructor',
            status: 'Active',
            description: 'A test course for verification.',
        },
    });
    console.log('✅ Created Course:', course.id);

    // 2. Find a User (or create one if empty)
    let user = await prisma.user.findFirst();
    if (!user) {
        console.log('No user found, creating a dummy user...');
        user = await prisma.user.create({
            data: {
                email: 'test@example.com',
                passwordHash: 'password123',
                fullName: 'Test User',
                role: 'TEACHER',
                campusId: 'test-campus',
                department: 'Test Dept'
            }
        });
    }
    console.log('ℹ️ Using User:', user.id);

    // 3. Enroll User
    const enrollment = await prisma.courseEnrollment.create({
        data: {
            courseId: course.id,
            userId: user.id,
            status: 'IN_PROGRESS',
        },
    });
    console.log('✅ Enrolled User:', enrollment.id);

    // 4. Verify Enrollment
    const fetchedEnrollment = await prisma.courseEnrollment.findUnique({
        where: {
            courseId_userId: {
                courseId: course.id,
                userId: user.id,
            },
        },
        include: {
            course: true,
            user: true
        }
    });

    if (fetchedEnrollment && fetchedEnrollment.course.id === course.id && fetchedEnrollment.user.id === user.id) {
        console.log('✅ Enrollment verification successful!');
    } else {
        console.error('❌ Enrollment verification failed!');
    }

    // 5. Cleanup
    await prisma.courseEnrollment.delete({
        where: { id: enrollment.id }
    });
    await prisma.course.delete({
        where: { id: course.id }
    });
    if (user.email === 'test@example.com') {
        await prisma.user.delete({ where: { id: user.id } });
    }

    console.log('✅ Cleanup complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
