import { FormField } from "@/pages/admin/FormTemplatesView";

export interface FormTemplate {
    id: number;
    title: string;
    type: "Observation" | "Reflection" | "Goal Setting" | "Other";
    version: string;
    status: string;
    lastUpdated: string;
    questions: number;
    targetRole: string;
    targetBlock: string;
    fields: FormField[];
}


export const initialTemplates: FormTemplate[] = [{
    id: 3,
    title: "AY 25–26 Goal Setting Form – Master",
    type: "Other",
    version: "1.0",
    status: "Archived",
    lastUpdated: "Jan 12, 2026",
    questions: 13,
    targetRole: "Teacher",
    targetBlock: "All",
    fields: [
        { id: "g1", label: "Name of the Educator", type: "text", required: true },
        { id: "g2", label: "Name of the Coach", type: "text", required: true },
        { id: "g3", label: "Campus", type: "select", required: true, options: ["CMR NPS", "EJPN", "EITPL", "EBTM", "EBYR", "ENICE", "ENAVA", "PU BTM", "PU BYR", "PU HRBR", "PU ITPL"] },
        { id: "g4", label: "Date of Goal Setting Conversation", type: "date", required: true },
        { id: "g_end_date", label: "Goal Target End Date", type: "date", required: true },
        { id: "g5", label: "Was the teacher informed and aware of the goal setting process?", type: "radio", required: true, options: ["Yes", "No"] },
        { id: "g6", label: "Was the teacher informed and aware about the Ekya Danielson Framework?", type: "radio", required: true, options: ["Yes", "No"] },
        { id: "g7", label: "Did the teacher complete her self-reflection on Ekya Danielson Form?", type: "radio", required: true, options: ["Yes", "No"] },
        { id: "g8", label: "Did the teacher provide evidence for her rating and reflection?", type: "radio", required: true, options: ["Yes", "No"] },
        { id: "g9", label: "Goal for the Academic Year", type: "textarea", required: true },
        { id: "g10", label: "Reason for the Goal", type: "textarea", required: true },
        { id: "g11", label: "Action Step", type: "textarea", required: true },
        { id: "g12", label: "Pillar Tag", type: "select", required: true, options: ["Live the Lesson", "Authentic Assessments", "Instruct to Inspire", "Care about Culture", "Engaging Environment", "Professional Practice"] },
        { id: "g13", label: "Additional Notes (Optional)", type: "textarea", required: false }
    ]
},
{
    id: 1,
    title: "Instructional Review (Observation)",
    type: "Observation",
    version: "1.0",
    status: "Active",
    lastUpdated: "Jan 10, 2026",
    questions: 15,
    targetRole: "Teacher",
    targetBlock: "All",
    fields: [
        { id: "t1", label: "Teacher Name", type: "text", required: true },
        { id: "t2", label: "Teacher Email", type: "text", required: true },
        { id: "o1", label: "Observer Name", type: "text", required: true },
        { id: "o2", label: "Observation Date", type: "date", required: true }, // Changed to date
        { id: "o4", label: "Observation End Date", type: "date", required: true },
        { id: "o5", label: "Time", type: "time", required: true },
        { id: "o3", label: "Observer Role", type: "radio", required: true, options: ["Academic Coordinator", "CCA Coordinator", "Head of School", "ELC Team Member", "PDI Team Member", "Other"] },
        { id: "c1", label: "Block", type: "radio", required: true, options: ["Early Years", "Primary", "Middle", "Senior", "Specialist"] },
        { id: "c2", label: "Grade", type: "select", required: true, options: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
        { id: "c3", label: "Section", type: "text", required: false },
        { id: "c4", label: "Learning Area", type: "select", required: true, options: ["Mathematics", "Science", "English", "Social Studies", "Arts", "Physical Education", "Technology", "Languages"] },
        { id: "a1", label: "Observation Domain", type: "select", required: true, options: ["Instruction", "Classroom Management", "Assessment", "Professionalism"] },
        { id: "a2", label: "Performance Score (1-5)", type: "rating", required: true },
        { id: "a3", label: "Observation Notes & Feedback", type: "textarea", required: false },
        { id: "a4", label: "Strengths Observed", type: "textarea", required: false },
        { id: "a5", label: "Areas for Growth", type: "textarea", required: false },
        { id: "a6", label: "Teaching Strategies (comma separated)", type: "text", required: false }
    ]
},
{
    id: 2,
    title: "Teacher Self-Reflection Form (Master)",
    type: "Reflection",
    version: "1.0",
    status: "Active",
    lastUpdated: "Feb 06, 2026",
    questions: 26,
    targetRole: "Teacher",
    targetBlock: "All",
    fields: [
        // Section A
        { id: "r1", label: "A1: Demonstrating Knowledge of Content and Pedagogy", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r2", label: "A2: Demonstrating Knowledge of Students", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r3", label: "A3: Demonstrating Knowledge of Resources", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r4", label: "A4: Designing a Microplan", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r5", label: "A5: Using Student Assessments", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r6", label: "Evidence for Section A: Planning & Preparation", type: "textarea", required: true },

        // Section B (Classroom Practice)
        { id: "r7", label: "B1: Creating an Environment of Respect and Rapport", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r8", label: "B2: Establishing a Culture for Learning", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r9", label: "B3: Managing Classroom Procedures", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r10", label: "B4: Managing Student Behaviour", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r11", label: "Evidence for Section B1: Care about Culture", type: "textarea", required: true },

        { id: "r12", label: "B5: Communicating with Students", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r13", label: "B6: Using Questioning and Discussion Techniques", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r14", label: "B7: Engages in Student Learning", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r15", label: "B8: Demonstrating Flexibility and Responsiveness", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r16", label: "Evidence for Section B2: Instruct to Inspire", type: "textarea", required: true },

        // Section C (Professional Practice)
        { id: "r17", label: "C1: Reflecting on Teaching", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r18", label: "C2: Maintaining Accurate Records", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r19", label: "C3: Communicating with Families", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r20", label: "C4: Participating in a Professional Community", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r21", label: "C5: Growing and Developing Professionally", type: "radio", required: true, options: ["Highly Effective", "Effective", "Developing", "Basic"] },
        { id: "r22", label: "Evidence for Section C: Professional Practice", type: "textarea", required: true },

        // Final Reflection
        { id: "r23", label: "Identify your key strengths in this cycle", type: "textarea", required: true },
        { id: "r24", label: "Identify areas for immediate improvement", type: "textarea", required: true },
        { id: "r25", label: "Define a SMART goal for yourself", type: "text", required: true },
        { id: "r26", label: "Additional context or feedback", type: "textarea", required: false }
    ]
},
{
    id: 5,
    title: "AY 25-26 MOOC Evidence Form",
    type: "Other",
    version: "1.0",
    status: "Active",
    lastUpdated: "Feb 06, 2026",
    questions: 15,
    targetRole: "Both",
    targetBlock: "All",
    fields: [
        { id: "m1", label: "Email Address", type: "text", required: true },
        { id: "m2", label: "Full Name", type: "text", required: true },
        { id: "m3", label: "Campus", type: "select", required: true, options: ["CMR NPS", "EITPL", "EBYR", "EJPN", "EBTM", "ENICE", "ENAVA", "PU BTM", "PU BYR", "PU HRBR", "PU ITPL", "PU NICE", "HO"] },
        { id: "m4", label: "Name of Course", type: "text", required: true },
        { id: "m5", label: "Number of Hours", type: "text", required: true },
        { id: "m_start", label: "Date of Start", type: "date", required: true },
        { id: "m_end", label: "Date of End", type: "date", required: true },
        { id: "m7", label: "Platform", type: "radio", required: true, options: ["Coursera", "FutureLearn", "Khan Academy", "edX", "Alison", "Class Central", "Schoology", "Other"] },
        { id: "m8", label: "Specify Platform (if other)", type: "text", required: false },
        { id: "m9", label: "Do you have a completion certificate?", type: "radio", required: true, options: ["Yes", "No"] },
        { id: "m10", label: "Certificate / Proof Link", type: "text", required: false },
        { id: "m_file", label: "Certificate / Proof File (if no link)", type: "file", required: false },
        { id: "m11", label: "Three Key Takeaways from the Course", type: "textarea", required: false },
        { id: "m12", label: "Two Unanswered Questions After Learning", type: "textarea", required: false },
        { id: "m13", label: "One Thing You Enjoyed Most", type: "text", required: false },
        { id: "m14", label: "Course Effectiveness Rating (1-10)", type: "rating", required: true },
        { id: "m15", label: "Additional Feedback", type: "textarea", required: false }
    ]
}
];


