export interface Goal {
    id: string;
    title: string;
    description: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    progress: number;
    dueDate: string;
    createdAt: string;
    teacherId: string;
    teacher?: string;
    category: string;
    isSchoolAligned: boolean;
}
