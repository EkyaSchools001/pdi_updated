
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            fullName: true,
            role: true
        }
    });

    let markdown = "| Name | Email | Role | New ID |\n";
    markdown += "| :--- | :--- | :--- | :--- |\n";

    users.forEach(user => {
        markdown += `| ${user.fullName} | ${user.email} | ${user.role} | \`${user.id}\` |\n`;
    });

    fs.writeFileSync('user_ids_table.md', markdown);
    console.log('Table generated in user_ids_table.md');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
