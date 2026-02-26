const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const adminId = 'f7e70d9e-839d-4ae4-aae2-0bfaebc97606'; // Avani Admin
    const assessmentTitle = 'Ekya Academic Orientation';

    // Check if it already exists
    const existing = await prisma.assessment.findFirst({ where: { title: assessmentTitle } });
    if (existing) {
        console.log('Assessment already exists, skipping creation.');
        await prisma.$disconnect();
        return;
    }

    const assessment = await prisma.assessment.create({
        data: {
            title: assessmentTitle,
            description: 'Comprehensive orientation on Ekya Academic Standards, Pedagogy, and Tools.',
            type: 'ACADEMIC_ORIENTATION',
            isTimed: false,
            maxAttempts: 3,
            createdById: adminId,
            questions: {
                create: [
                    { prompt: 'What is the purpose of a Master Plan?', options: JSON.stringify(['To map long-term content standards', 'To share the collection of learning experiences in a Unit', 'To plan out the hour by hour instruction in the classroom', 'To design assessments for the Unit']), correctAnswer: 'To share the collection of learning experiences in a Unit', points: 2 },
                    { prompt: 'How does a Microplan support lesson delivery?', options: JSON.stringify(['It gives scripted lesson scripts for teachers to follow', 'It offers day-wise instructional guidance', 'It shows daily assessments and worksheets in a lesson', 'It tracks student progress over the unit']), correctAnswer: 'It shows daily assessments and worksheets in a lesson', points: 2 },
                    { prompt: 'What is the primary purpose of assessments at Ekya?', options: JSON.stringify(['To rank students', 'To support learning and growth', 'To assign punishments', 'To complete paperwork']), correctAnswer: 'To support learning and growth', points: 2 },
                    { prompt: 'Which of the following would you categorize as an Authentic Task?', options: JSON.stringify(['Solving 10 algebra equations on a worksheet', 'Memorizing definitions of literary devices', 'Writing a persuasive letter to the local government about a community issue', 'Matching vocabulary words with their meanings in a quiz']), correctAnswer: 'Writing a persuasive letter to the local government about a community issue', points: 2 },
                    { prompt: 'How should teachers identify which instructional tool/strategy to use?', options: JSON.stringify(['By choosing the one that is most popular among students', 'By selecting a tool that aligns with the learning objective and student needs', 'By using the same tool for all lessons to ensure consistency', 'By picking the tool that requires the least preparation time']), correctAnswer: 'By selecting a tool that aligns with the learning objective and student needs', points: 2 },
                    { prompt: 'Which of the following scenarios effectively describe a flipped classroom?', options: JSON.stringify(['The teacher delivers a lecture on Newton’s Laws during class, and students are assigned textbook questions to complete as homework.', 'Students read an article and complete a short quiz on supply and demand at home. In class, they participate in a market simulation to apply the concepts and reflect on pricing strategies.']), correctAnswer: 'Students read an article and complete a short quiz on supply and demand at home. In class, they participate in a market simulation to apply the concepts and reflect on pricing strategies.', points: 2 },
                    { prompt: 'Why should a teacher differentiate instruction? (Select all that apply)', options: JSON.stringify(['To address the diverse learning needs, interests, and readiness levels of students', 'To ensure all students have equal opportunities to access and engage with the content', 'To make lesson planning easier and faster for the teacher', 'To support students in progressing at their own pace and achieving mastery']), correctAnswer: JSON.stringify(['To address the diverse learning needs, interests, and readiness levels of students', 'To ensure all students have equal opportunities to access and engage with the content', 'To support students in progressing at their own pace and achieving mastery']), points: 3, type: 'MULTI_SELECT' },
                    { prompt: 'Which of the following scenarios showcase an effective use of student data to make a classroom decision?', options: JSON.stringify(['A teacher gives the same homework to all students, regardless of their quiz performance.', 'After reviewing assessment results, a teacher forms small groups for reteaching specific concepts.', 'A teacher designs a lesson based only on the textbook sequence, without reviewing past student performance.', 'A teacher notices some students are struggling but decides to wait until the end-of-term exam to take action.']), correctAnswer: 'After reviewing assessment results, a teacher forms small groups for reteaching specific concepts.', points: 2 },
                    { prompt: 'Which of the following would be considered data-informed instructional next steps for a quiz with mixed results? (Select all that apply)', options: JSON.stringify(['Pair high-scoring students with low-scoring students for peer tutoring next lesson', 'Identify question types that the lower-scoring students struggled with and reteach using a different strategy', 'Create targeted small-group sessions for low-scoring students while tracking participation in the next lesson', 'Assume the low scores are due to poor effort and plan to move forward with the curriculum']), correctAnswer: JSON.stringify(['Pair high-scoring students with low-scoring students for peer tutoring next lesson', 'Identify question types that the lower-scoring students struggled with and reteach using a different strategy', 'Create targeted small-group sessions for low-scoring students while tracking participation in the next lesson']), points: 3, type: 'MULTI_SELECT' },
                    { prompt: 'Which of the following would be considered qualitative or observational data that a teacher can use to inform instruction? (Select all that apply)', options: JSON.stringify(['Quiz scores', 'Exit ticket responses', 'Anecdotal notes about student behaviour during group work', 'A student’s attendance record', 'Peer feedback from a class activity']), correctAnswer: JSON.stringify(['Exit ticket responses', 'Anecdotal notes about student behaviour during group work', 'Peer feedback from a class activity']), points: 3, type: 'MULTI_SELECT' },
                    { prompt: 'Why should teachers use graphic organizers in the classroom?', options: JSON.stringify(['To decorate classroom displays', 'To help students memorize large chunks of information', 'To support students in organizing and visualizing their thinking', 'To reduce the amount of content teachers need to cover']), correctAnswer: 'To support students in organizing and visualizing their thinking', points: 2 },
                    { prompt: 'Which type of graphic organizer would best support student understanding of Water Cycle stages?', options: JSON.stringify(['Venn Diagram', 'Cause and Effect Chart', 'A Cycle Diagram', 'T-Chart']), correctAnswer: 'A Cycle Diagram', points: 2 },
                    { prompt: 'Which graphic organizer would best help students analyze and compare characters?', options: JSON.stringify(['Concept Map', 'Flowchart', 'Timeline', 'Venn Diagram']), correctAnswer: 'Venn Diagram', points: 2 },
                    { prompt: 'Before starting a new unit, which strategy helps best understand students’ prior knowledge and identify misconceptions?', options: JSON.stringify(['See Think Wonder', 'Entry Ticket', 'Think-Pair-Share', 'Do Now']), correctAnswer: 'Entry Ticket', points: 2 },
                    { prompt: 'Which strategy should be used to pose the question: “How do human activities contribute to global warming?”', options: JSON.stringify(['Think-Pair-Share', 'KWL Chart', 'Entry Ticket', 'I Used to Think / Now I Know']), correctAnswer: 'Think-Pair-Share', points: 2 },
                    // New questions from user request
                    { prompt: 'Which of the following would be included in a Wrap Up/Closing of a lesson? (Select all that apply)', options: JSON.stringify(['Reviewing learning objectives', 'Student peer feedback', 'Exit ticket completion', 'Beginning a new unit immediately']), correctAnswer: JSON.stringify(['Reviewing learning objectives', 'Student peer feedback', 'Exit ticket completion']), points: 3, type: 'MULTI_SELECT' },
                    { prompt: 'Select the pedagogy that is most appropriate for Inquiry-Based Learning.', options: JSON.stringify(['Socratic Seminar', 'Direct Lecture only', 'Memorization of facts', 'Teacher-led dictation']), correctAnswer: 'Socratic Seminar', points: 2 },
                    { prompt: 'Which learning area specific tool would you use for interactive science simulations?', options: JSON.stringify(['PhET Simulations', 'Google Docs', 'Zoom', 'Calculator']), correctAnswer: 'PhET Simulations', points: 2 },
                    { prompt: 'How does the Curriculum Platform support teacher planning?', options: JSON.stringify(['By providing centralized access to Master Plans and Microplans', 'By tracking staff payroll', 'By managing student cafeteria orders', 'By scheduling school holidays']), correctAnswer: 'By providing centralized access to Master Plans and Microplans', points: 2 },
                    { prompt: 'Which ELC (Ekya Learning Center) resource is best for research skills?', options: JSON.stringify(['E-library databases', 'Sports equipment', 'Art supplies', 'Musical instruments']), correctAnswer: 'E-library databases', points: 2 }
                ]
            }
        }
    });

    console.log('Successfully created Ekya Academic Orientation Assessment template #', assessment.id);
    await prisma.$disconnect();
}

main().catch(console.error);
