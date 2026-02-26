import prisma from '../../infrastructure/database/prisma';



const DASHBOARD_TO_ROUTE: Record<string, string> = {
    'Teacher Dashboard': '/teacher',
    'Leader Dashboard': '/leader',
    'Admin Dashboard': '/admin',
    'Management Dashboard': '/management',
    'Growth Dashboard': '/growth',
};

export interface WorkflowRouting {
    redirectTo: string;
    displayLocation: string;
    route: string;
}

/**
 * Determines where a form submission should be routed based on FormWorkflow configurations.
 * 
 * @param templateName The name of the form template
 * @param senderRole The role of the person who submitted the form
 * @param campus The campus/school of the sender or target
 * @param subject (Optional) The subject associated with the submission (for teachers)
 * @returns Routing instructions or null if no specific workflow matches
 */
export async function getFormRouting(
    templateName: string,
    senderRole: string,
    campus?: string,
    subject?: string
): Promise<WorkflowRouting | null> {
    try {
        // Fetch all active workflows for this template
        const workflows = await prisma.formWorkflow.findMany({
            where: {
                isActive: true,
                OR: [
                    { formTemplate: { name: templateName } },
                    { formTemplateId: 'ALL' }
                ]
            }
        });

        if (workflows.length === 0) return null;

        let bestMatch = null;
        let highestScore = -1;

        for (const wf of workflows) {
            let score = 0;

            // Role match (Mandatory)
            const wfRole = wf.sentByRole.toUpperCase().replace(/\s+/g, '_');
            const sRole = senderRole.toUpperCase().replace(/\s+/g, '_');

            if (wfRole !== sRole && wfRole !== 'ALL') {
                continue;
            }
            score += 10;

            // School match
            if (wf.targetSchool === campus) {
                score += 5;
            } else if (wf.targetSchool === 'ALL' || !wf.targetSchool) {
                score += 1;
            } else {
                continue; // School doesn't match and not ALL
            }

            // Subject Type and Specific Subject match
            if (wf.subjectType === 'ALL' || !wf.subjectType) {
                score += 1;
            } else if (subject) {
                // Check if specific subjects are listed
                if (wf.specificSubjects) {
                    const subjects = wf.specificSubjects.split(',').map((s: string) => s.trim().toLowerCase());

                    if (subjects.includes(subject.toLowerCase())) {
                        score += 3;
                    } else {
                        continue;
                    }
                } else {
                    const coreSubjects = ["Mathematics", "Science", "English", "Social Science", "Physics", "Chemistry", "Biology"];
                    const isCore = coreSubjects.some(s => s.toLowerCase() === subject.toLowerCase());

                    if (wf.subjectType === 'CORE' && isCore) {
                        score += 2;
                    } else if (wf.subjectType === 'NON_CORE' && !isCore) {
                        score += 2;
                    } else {
                        continue;
                    }
                }
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = wf;
            }
        }

        if (bestMatch) {
            return {
                redirectTo: bestMatch.redirectTo,
                displayLocation: bestMatch.displayLocation,
                route: DASHBOARD_TO_ROUTE[bestMatch.redirectTo] || '/dashboard'
            };
        }

        return null;
    } catch (error) {
        console.error('Error in getFormRouting:', error);
        return null;
    }
}
