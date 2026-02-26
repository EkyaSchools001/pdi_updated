import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const adminId = 'f7e70d9e-839d-4ae4-aae2-0bfaebc97606'; // Avani Admin
    const assessmentTitle = 'Ekya End Orientation Assessment (Senior)';

    // Check if it already exists
    const existing = await prisma.assessment.findFirst({ where: { title: assessmentTitle } });
    if (existing) {
        console.log('Assessment already exists, skipping creation. ID:', existing.id);
        await prisma.$disconnect();
        return;
    }

    const assessment = await prisma.assessment.create({
        data: {
            title: assessmentTitle,
            description: 'End of orientation assessment covering C&I platform usage, pedagogy, assessment design, instructional strategies, classroom culture, differentiation, and professional standards.',
            type: 'POST_ORIENTATION',
            isTimed: false,
            maxAttempts: 3,
            createdById: adminId,
            questions: {
                create: [
                    // ── Section: C&I Platform ────────────────────────────────────────────
                    {
                        prompt: 'What is the purpose of a Master Plan?',
                        options: JSON.stringify([
                            'To map long-term content standards',
                            'To share the collection of learning experiences in a Unit',
                            'To plan out the hour by hour instruction in the classroom',
                            'To design assessments for the Unit',
                        ]),
                        correctAnswer: 'To share the collection of learning experiences in a Unit',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'Once a microplan is created, how can an educator receive feedback from their coordinator on C&I?',
                        options: JSON.stringify([
                            'Email the plan as a PDF to the coordinator',
                            'Share a Google Doc link in the staff group',
                            'The coordinator accesses the microplan directly and provides feedback on the platform',
                            'Print the plan and submit it during team meetings',
                        ]),
                        correctAnswer: 'The coordinator accesses the microplan directly and provides feedback on the platform',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'While reviewing their week planner, an educator realises the unit content is not populating correctly into the microplan. Which of the following is the most likely reason?',
                        options: JSON.stringify([
                            'The unit plan was not shared by the coordinator',
                            'The microplan was written in a different subject area',
                            'The educator did not link the Learning Area (LA) and unit correctly while setting up the microplan',
                            'There is a platform error that requires reinstallation of C&I',
                        ]),
                        correctAnswer: 'The educator did not link the Learning Area (LA) and unit correctly while setting up the microplan',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'An educator notices that their lesson plan lacks alignment with the unit\'s Enduring Understandings and Essential Questions. Based on the C&I platform structure, what is the most appropriate next step to realign the plan?',
                        options: JSON.stringify([
                            'Modify the microplan using AI-generated content without referring to the unit plan',
                            'Review Stage 1 of the unit plan for key understandings and questions, and revise the microplan accordingly',
                            'Skip to Stage 3 and add more activities to the microplan',
                            'Request the academic coordinator to rewrite the microplan',
                        ]),
                        correctAnswer: 'Review Stage 1 of the unit plan for key understandings and questions, and revise the microplan accordingly',
                        points: 1,
                        type: 'MCQ',
                    },

                    // ── Section: Assessment Design ────────────────────────────────────────
                    {
                        prompt: 'Which of the following would you categorise as an Authentic Task?',
                        options: JSON.stringify([
                            'Solving 10 algebra equations on a worksheet',
                            'Memorizing definitions of literary devices',
                            'Writing a persuasive letter to the local government about a community issue',
                            'Matching vocabulary words with their meanings in a quiz',
                        ]),
                        correctAnswer: 'Writing a persuasive letter to the local government about a community issue',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'Which of the following most accurately aligns with the principle of "assessment as learning"?',
                        options: JSON.stringify([
                            'Evaluating students through a summative test at the end of a unit',
                            'Using a rubric to assign a final grade for a project',
                            'Having students reflect on their progress and set goals during the task',
                            'Giving feedback only after the entire class has completed the assignment',
                        ]),
                        correctAnswer: 'Having students reflect on their progress and set goals during the task',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'A teacher wants to improve the reliability and transparency of scoring student projects. Which combination of actions would best support this goal?',
                        options: JSON.stringify([
                            'Provide oral feedback only and avoid numerical scores',
                            'Design a rubric with clear criteria and performance levels, and share it with students before the assessment',
                            'Allow students to choose their own grading criteria based on project type',
                            'Use peer assessment without teacher moderation',
                        ]),
                        correctAnswer: 'Design a rubric with clear criteria and performance levels, and share it with students before the assessment',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'In providing feedback on an authentic task, which of the following best reflects the growth mindset approach advocated in the session?',
                        options: JSON.stringify([
                            '"You scored 6/10 because you missed key details."',
                            '"Great work! You\'re naturally talented in this subject."',
                            '"You\'re not quite there yet—try expanding your analysis with examples like the one we discussed in class."',
                            '"This wasn\'t good enough. You need to focus more next time."',
                        ]),
                        correctAnswer: '"You\'re not quite there yet—try expanding your analysis with examples like the one we discussed in class."',
                        points: 1,
                        type: 'MCQ',
                    },

                    // ── Section: Graphic Organisers ───────────────────────────────────────
                    {
                        prompt: 'Ms. Iyer is teaching a Grade 7 Science lesson on the Water Cycle. She wants her students to understand the sequential stages (evaporation, condensation, precipitation, collection) and how each stage leads to the next. She also wants to help them visualise this process. Which type of graphic organiser would best support student understanding in this scenario?',
                        options: JSON.stringify([
                            'Venn Diagram',
                            'Cause and Effect Chart',
                            'A Cycle Diagram',
                            'T-Chart',
                        ]),
                        correctAnswer: 'A Cycle Diagram',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'Mr. Khan is teaching Character Development in a novel. He wants his students to compare two main characters in terms of their values, motivations, and growth through the story. Which graphic organiser would best help students analyse and compare the characters?',
                        options: JSON.stringify([
                            'Concept Map',
                            'Flowchart',
                            'Timeline',
                            'Venn Diagram',
                        ]),
                        correctAnswer: 'Venn Diagram',
                        points: 1,
                        type: 'MCQ',
                    },

                    // ── Section: Instructional Strategies ────────────────────────────────
                    {
                        prompt: 'How should teachers identify which instructional tool/strategy to use?',
                        options: JSON.stringify([
                            'By choosing the one that is most popular among students',
                            'By selecting a tool that aligns with the learning objective and student needs',
                            'By using the same tool for all lessons to ensure consistency',
                            'By picking the tool that requires the least preparation time',
                        ]),
                        correctAnswer: 'By selecting a tool that aligns with the learning objective and student needs',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'Before starting a new unit on Algebra, Mr. Sharma wants to quickly understand students\' prior knowledge and identify misconceptions. Which strategy would best support his goal?',
                        options: JSON.stringify([
                            'See Think Wonder',
                            'Entry Ticket',
                            'Think-Pair-Share',
                            'Do Now',
                        ]),
                        correctAnswer: 'Entry Ticket',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'During a lesson on climate change, Mr. Bose poses the question: "How do human activities contribute to global warming?" Which of the following strategy should he use?',
                        options: JSON.stringify([
                            'Think-Pair-Share',
                            'KWL Chart',
                            'Entry Ticket',
                            'I Used to Think / Now I Know',
                        ]),
                        correctAnswer: 'Think-Pair-Share',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'You have just finished a science lesson on renewable and non-renewable energy sources. You want students to reflect on their prior misconceptions and consolidate their new understanding. Which of the following strategies would be most appropriate for this purpose?',
                        options: JSON.stringify([
                            'T-Chart',
                            'KWL Chart',
                            'I Used to Think / Now I Know',
                            'Exit Ticket',
                        ]),
                        correctAnswer: 'I Used to Think / Now I Know',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'You are about to begin a Grade 6 math lesson on calculating the area of a triangle. Which of the following is the most effective way to activate relevant prior knowledge for this lesson?',
                        options: JSON.stringify([
                            'Ask students to recall the types of angles and triangles they learned in art class',
                            'Begin with a real-life problem involving floor tiling and provide the area formula directly',
                            'Review how to calculate the area of a rectangle and relate it to how a triangle is half of that',
                            'Ask students to list all geometry terms they remember from the previous year',
                        ]),
                        correctAnswer: 'Review how to calculate the area of a rectangle and relate it to how a triangle is half of that',
                        points: 1,
                        type: 'MCQ',
                    },

                    // ── Section: Schoology ────────────────────────────────────────────────
                    {
                        prompt: 'Which of the following practices would violate the assessment protocol in Schoology, as per institutional guidelines?',
                        options: JSON.stringify([
                            'Adding an ungraded worksheet to a unit folder',
                            'Publishing a pre-created E2 assessment in the assessment folder',
                            'Creating a new assessment category called \'Homework\' in the assessment folder',
                            'Sharing instructions for assessments in the description field',
                        ]),
                        correctAnswer: "Creating a new assessment category called 'Homework' in the assessment folder",
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'When should an educator use a \'Page\' instead of an \'Assignment\' in Schoology?',
                        options: JSON.stringify([
                            'To assign a graded task with a due date',
                            'To post session highlights or share additional resources',
                            'To collect a writing submission from students',
                            'To assess students on a quiz from the learning plan',
                        ]),
                        correctAnswer: 'To post session highlights or share additional resources',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'A teacher wants students to critically engage with a topic and respond to their peers\' perspectives. Which Schoology feature should they use, and why?',
                        options: JSON.stringify([
                            'Quiz, because it allows individual timed responses',
                            'Assignment, because it supports group submissions',
                            'Discussion, because it facilitates visible peer interaction and threaded replies',
                            'Page, because it lets students edit shared content collaboratively',
                        ]),
                        correctAnswer: 'Discussion, because it facilitates visible peer interaction and threaded replies',
                        points: 1,
                        type: 'MCQ',
                    },

                    // ── Section: Flipped Classroom ────────────────────────────────────────
                    {
                        prompt: 'Which of the following best describes the Flipped Classroom approach?',
                        options: JSON.stringify([
                            'Students watch a lecture in class and complete activities as homework.',
                            'Students create presentations and teach their peers in class.',
                            'Students are introduced to new content at home and engage in application during class.',
                            'Teachers deliver live lectures online, and students take notes at home.',
                        ]),
                        correctAnswer: 'Students are introduced to new content at home and engage in application during class.',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'A teacher flips a Grade 10 History lesson by assigning students a timeline and video on the causes of World War II to review before class. Which of the following in-class activities would best support higher-order thinking aligned with the flipped approach?',
                        options: JSON.stringify([
                            'Students answer multiple-choice questions based on the timeline',
                            'Students work in teams to rank and justify the most significant causes of WWII',
                            'The teacher summarizes key events while students take structured notes',
                            'Students copy key dates and events into their notebooks for future reference',
                        ]),
                        correctAnswer: 'Students work in teams to rank and justify the most significant causes of WWII',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'If a few students enter class without completing the asynchronous pre-task, which of the following is the best response from the teacher?',
                        options: JSON.stringify([
                            'Have them quietly observe the group work without participating',
                            'Briefly pair them with a peer who completed the task for a quick catch-up',
                            'Move ahead without them — they\'ll learn next time',
                            'Cancel the in-class task and switch to a teacher-led lecture',
                        ]),
                        correctAnswer: 'Briefly pair them with a peer who completed the task for a quick catch-up',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'Which of the following lessons would be least suitable for a flipped classroom approach?',
                        options: JSON.stringify([
                            'Introducing a new math topic like solving quadratic equations for the first time',
                            'Reviewing a previously taught topic through group problem-solving',
                            'Having students conduct a science investigation based on prior video prep',
                            'Debating a social issue after students have read multiple perspectives',
                        ]),
                        correctAnswer: 'Introducing a new math topic like solving quadratic equations for the first time',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'A teacher uses a flipped classroom model for a Grade 11 Science lesson. Students watch a video explaining the structure of DNA before class. In class, they work in pairs to model the DNA strand using coloured beads and then explain the function of each part to their peers. Which of the following best explains how this lesson reflects the principles of flipped learning aligned with Bloom\'s Taxonomy and the Gradual Release of Responsibility?',
                        options: JSON.stringify([
                            'It allows students to independently recall information during class with no teacher support.',
                            'It shifts content delivery to home so that in class, students can engage in hands-on and peer-based application.',
                            'It replaces teacher instruction entirely with peer activities to promote independence.',
                            'It provides a teacher-led recap followed by note-taking to reinforce memory.',
                        ]),
                        correctAnswer: 'It shifts content delivery to home so that in class, students can engage in hands-on and peer-based application.',
                        points: 1,
                        type: 'MCQ',
                    },

                    // ── Section: Classroom Culture & First 15 Days ────────────────────────
                    {
                        prompt: 'You start the class by asking students to share anything positive that has happened in the day or the past week. Which culture practice is this?',
                        options: JSON.stringify([
                            'Affirmations',
                            'Good Things',
                            'Gratitude Sharing',
                            'One minute mindfulness',
                        ]),
                        correctAnswer: 'Good Things',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'What is the primary purpose of a classroom social contract?',
                        options: JSON.stringify([
                            'To enforce discipline through fixed teacher-created rules',
                            'To outline school-mandated behavior guidelines',
                            'To co-create shared expectations that promote respect and responsibility',
                            'To reward students for academic performance only',
                        ]),
                        correctAnswer: 'To co-create shared expectations that promote respect and responsibility',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'Which of the following best explains the purpose of explicitly teaching routines during the first 15 days of school?',
                        options: JSON.stringify([
                            'To keep students occupied while academic planning is finalized',
                            'To ensure students can work independently and transitions run smoothly',
                            'To reduce the need for classroom norms',
                            'To prepare students for assessments early in the term',
                        ]),
                        correctAnswer: 'To ensure students can work independently and transitions run smoothly',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'On Day 3 of school, a teacher notices students are still interrupting during discussions. Which action is most aligned with the Classroom Norms essential?',
                        options: JSON.stringify([
                            'Giving students a warning and moving on',
                            'Sending a note home to parents about expected behavior',
                            'Asking students to stay silent for the rest of the activity',
                            'Re-teaching the classroom\'s agreed-upon discussion norms using role-play',
                        ]),
                        correctAnswer: "Re-teaching the classroom's agreed-upon discussion norms using role-play",
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'A teacher begins each day with a "Mood Meter" and a short mindfulness moment. Which two essentials from the First 15 Days framework does this most directly support?',
                        options: JSON.stringify([
                            'Academic Engagement and Routines',
                            'SEL Integration and Relationships',
                            'Classroom Norms and Academic Engagement',
                            'Routines and Assessment',
                        ]),
                        correctAnswer: 'SEL Integration and Relationships',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'Day 1 Snapshot of a classroom: Students are greeted at the door; name tags and a seating plan are provided; teacher introduces classroom rules and explains schedule; students complete an independent "All About Me" worksheet; the day ends with a classroom tour. Which of the following statements is the most appropriate evaluation of this Day 1 plan?',
                        options: JSON.stringify([
                            'It covers all 5 essentials effectively and does not need changes',
                            'It includes routines and academic engagement but lacks opportunities for SEL and co-construction of norms',
                            'It focuses on SEL and norms but does not introduce any academic activities',
                            'It builds strong academic engagement but ignores relationships and routines',
                        ]),
                        correctAnswer: 'It includes routines and academic engagement but lacks opportunities for SEL and co-construction of norms',
                        points: 1,
                        type: 'MCQ',
                    },

                    // ── Section: Differentiated Instruction ──────────────────────────────
                    {
                        prompt: 'Which of the following best defines \'process differentiation\'?',
                        options: JSON.stringify([
                            'Changing the physical space in which students learn',
                            'Allowing students to work on different topics',
                            'Giving students different ways to show their learning',
                            'Giving students different ways to make sense of the same content',
                        ]),
                        correctAnswer: 'Giving students different ways to make sense of the same content',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'What is the purpose of strategic student grouping in differentiated instruction?',
                        options: JSON.stringify([
                            'To group all high-performing students together for advanced tasks',
                            'To randomly assign groups for easier classroom management',
                            'To intentionally support student needs through targeted peer interactions',
                            'To avoid using different materials or instructions',
                        ]),
                        correctAnswer: 'To intentionally support student needs through targeted peer interactions',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'A teacher assigns all students the same story to read. Group A uses sentence starters to respond, Group B discusses the story in pairs, and Group C writes an essay. What type of differentiation is most clearly visible?',
                        options: JSON.stringify([
                            'Content',
                            'Process',
                            'Product',
                            'Learning environment',
                        ]),
                        correctAnswer: 'Process',
                        points: 1,
                        type: 'MCQ',
                    },
                    {
                        prompt: 'In a classroom, Group 1 writes a few describing sentences with the teacher, Group 2 writes a paragraph using guiding questions, and Group 3 writes a descriptive letter independently. The same garden picture is used for all. What is the student characteristic being considered for Differentiation?',
                        options: JSON.stringify([
                            'Learning Profile',
                            'Readiness',
                            'Interest',
                            'All of the above',
                        ]),
                        correctAnswer: 'Readiness',
                        points: 1,
                        type: 'MCQ',
                    },

                    // ── Section: Professional Practice ────────────────────────────────────
                    {
                        prompt: 'Which of the following is a typical step in the teacher observation process?',
                        options: JSON.stringify([
                            'School leader visits followed by anonymous feedback',
                            'Observation, feedback and follow up conversation',
                            'Group grading of lesson plans by peers',
                            'Mandatory training before each observation',
                        ]),
                        correctAnswer: 'Observation, feedback and follow up conversation',
                        points: 1,
                        type: 'MCQ',
                    },

                    // ── Section: Open-ended questions ─────────────────────────────────────
                    {
                        prompt: 'What is the purpose of your learning area? Mention the learning area and its purpose in 3-4 sentences.',
                        options: null,
                        correctAnswer: null,
                        points: 0,
                        type: 'TEXT',
                    },
                    {
                        prompt: 'List any 1 Learning Area Tool of your choice and explain the purpose of the tool and how it is used.',
                        options: null,
                        correctAnswer: null,
                        points: 0,
                        type: 'TEXT',
                    },
                ],
            },
        },
    });

    console.log('✅ Successfully created assessment:', assessmentTitle);
    console.log('   Assessment ID:', assessment.id);
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error('Error:', e);
    prisma.$disconnect();
    process.exit(1);
});
