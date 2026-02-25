export interface ReflectionRating {
    indicator: string;
    rating: "Basic" | "Developing" | "Effective" | "Highly Effective";
}

export interface ReflectionSection {
    id: string;
    title: string;
    ratings: ReflectionRating[];
    evidence: string;
}

export interface DetailedReflection {
    teacherName: string;
    teacherEmail: string;
    submissionDate: string;
    sections: {
        planning: ReflectionSection; // Section A
        classroomEnvironment: ReflectionSection; // Section B1
        instruction: ReflectionSection; // Section B2
        assessment: ReflectionSection; // Section B3
        environment: ReflectionSection; // Section B4
        professionalism: ReflectionSection; // Section C
    };
    strengths: string;
    improvements: string;
    goal: string;
    comments?: string;
}

export type DanielsonRatingScale = "Basic" | "Developing" | "Effective" | "Highly Effective" | "Not Observed";

export interface DanielsonIndicator {
    name: string;
    rating: DanielsonRatingScale;
}

export interface DanielsonDomain {
    domainId: string;
    title: string;
    indicators: DanielsonIndicator[];
    evidence: string;
}

export interface Observation {
    id: string;
    teacher?: string; // Optional for leader dashboard view context
    teacherId?: string;
    observerId?: string;
    teacherEmail?: string;
    date: string;
    updatedAt?: string;
    endDate?: string;
    time?: string;
    observerName?: string;
    observerEmail?: string;
    observerRole?: string;
    campus?: string;
    domain: string;
    score: number;
    notes?: string;
    hasReflection: boolean;
    reflection?: string; // Legacy simple string
    detailedReflection?: DetailedReflection; // New structured data
    // Unified Danielson Framework Data
    domains?: DanielsonDomain[];
    routines?: string[];
    cultureTools?: string[];
    instructionalTools?: string[];
    learningAreaTools?: string[];
    metaTags?: string[];
    discussionMet?: boolean;
    teacherReflection?: string;
    actionStep?: string;
    additionalNotes?: string;
    // Extended fields for full reporting
    learningArea?: string;
    strengths?: string;
    areasOfGrowth?: string;
    improvements?: string;
    feedback?: string;
    actionSteps?: string;
    nextSteps?: string;
    status?: "Draft" | "Submitted" | "Certified" | "In Progress";
    teachingStrategies?: string[];
    classroom?: {
        block: string;
        grade: string;
        section: string;
        learningArea: string;
    };
}
