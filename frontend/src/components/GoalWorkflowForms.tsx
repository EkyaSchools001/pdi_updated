import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Target, CheckCircle2, AlertCircle, Clock, FileText, Sparkles, TrendingUp, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { GoalSettingForm } from '@/components/GoalSettingForm';

const safeJsonParse = (str: any, fallback: any = {}) => {
    if (!str || str === 'null') return fallback;
    if (typeof str === 'object') return str || fallback;
    try {
        const parsed = JSON.parse(str);
        return parsed || fallback;
    } catch (e) {
        return fallback;
    }
};

const CORE_FRAMEWORK = [
    {
        id: 'A',
        section: 'Section A: Planning & Preparation - Live the Lesson',
        items: [
            'Demonstrating Knowledge of Content and Pedagogy',
            'Demonstrating Knowledge of Students',
            'Demonstrating Knowledge of Resources',
            'Designing A Microplan',
            'Using Student Assessments'
        ],
        evidenceId: 'A'
    },
    {
        id: 'B1',
        section: 'Section B: Classroom Practice - Care about Culture',
        items: [
            'Creating an Environment of Respect and Rapport',
            'Establishing a Culture for Learning',
            'Managing Classroom Procedures',
            'Managing Student behaviour'
        ],
        evidenceId: 'B1'
    },
    {
        id: 'B2',
        section: 'Section B: Classroom Practice - Instruct to Inspire',
        items: [
            'Communicating with Students',
            'Using Questioning and Discussion Techniques and Learning Tools',
            'Engages in student’s learning',
            'Demonstrating Flexibility and Responsiveness'
        ],
        evidenceId: 'B2'
    },
    {
        id: 'B3',
        section: 'Section B: Classroom Practice - Authentic Assessments',
        items: [
            'Using Assessments in Instructions'
        ],
        evidenceId: 'B3'
    },
    {
        id: 'B4',
        section: 'Section B: Classroom Practice - Engaging Environment',
        items: [
            'Organizing Physical Space',
            'Cleanliness',
            'Use of Boards'
        ],
        evidenceId: 'B4'
    },
    {
        id: 'C1',
        section: 'Section C: Professional Practice',
        items: [
            'Reflecting on Teaching',
            'Maintaining Accurate Records',
            'Communicating with Families',
            'Participating in a Professional Community',
            'Growing and Developing Professionally'
        ],
        evidenceId: 'C1'
    }
];

const PA_FRAMEWORK = [
    {
        id: 'A',
        section: 'Section A: Curriculum and Instruction',
        items: [
            'I clearly inform students about the learning objectives in every lesson.',
            'I give clear and explicit directions to my students.',
            'I share relevant examples and demonstrate techniques to students.',
            'I provide sufficient practice time and assistance to my students.',
            'I correct my student\'s skills and provide encouraging feedback.',
            'I state safety procedures for each activity and immediately address unsafe practices.'
        ],
        evidenceId: 'A'
    },
    {
        id: 'B',
        section: 'Section B: Culture and Environment',
        items: [
            'My transitions between activities is smooth and effective.',
            'I maintain student engagement throughout the class through voice and movement.',
            'My students are engaged in an activity at least 50% or more of the total class duration.',
            'I monitor students behaviour and actively correct it.',
            'I share rules with each procedure and state expectations of each activity clearly.'
        ],
        evidenceId: 'B'
    },
    {
        id: 'C',
        section: 'Section C: PA Classroom Procedures',
        items: [
            'Students participate in an instant warm-up activity to prepare their bodies and minds for the class.',
            'Students are assigned or choose their performance groups or partners if applicable.',
            'Students participate in a cool-down activity to help them recover from physical exertion.',
            'Students follow routines to wind up PA Class and to get back to their home class in an organized manner.'
        ],
        evidenceId: 'C'
    }
];

const PE_FRAMEWORK = [
    {
        id: 'A',
        section: 'Section A: Curriculum and Instruction',
        items: [
            'I clearly inform students about the learning objectives in every lesson.',
            'I give clear and explicit directions to my students.',
            'I share relevant examples and demonstrate techniques to students.',
            'I provide sufficient practice time and assistance to my students.',
            'I correct my student\'s skills and provide encouraging feedback.',
            'I state safety procedures for each activity and immediately address unsafe practices.'
        ],
        evidenceId: 'A'
    },
    {
        id: 'B',
        section: 'Section B: Culture and Environment',
        items: [
            'My transitions between activities is smooth and effective.',
            'I maintain student engagement throughout the class through voice and movement.',
            'My students are engaged in an activity at least 50% or more of the total class duration.',
            'I monitor students behaviour and actively correct it.',
            'I treat all my students with respect and in a fair manner.',
            'I keep equipment ready prior to the class and store excess equipment safely.',
            'I share rules with each procedure and state expectations of each activity clearly.'
        ],
        evidenceId: 'B'
    },
    {
        id: 'C',
        section: 'Section C: PE Classroom Procedures',
        items: [
            'Students engage in an instant warm up activity upon entering PE Room / Outdoor Ground.',
            'Students engage in a warm up activity to prepare for participation in moderate to vigorous physical activity.',
            'Students engage in a cool-down activity to recover from moderate to vigorous physical activity.',
            'Students follow routines to wind up PE Class and to get back to their home class in an organized manner.'
        ],
        evidenceId: 'C'
    }
];

const VA_FRAMEWORK = [
    {
        id: 'A',
        section: 'Section A: Planning & Preparation - Live the Lesson',
        items: [
            'Teacher displays extensive knowledge of the important concepts in the discipline and how these relate both to one another to other disciplines',
            'Teacher understands and teaches the mental tools and processes that will promote student understanding.',
            'Teacher is able to demonstrate the knowledge of various physical and digital resources.',
            'The teacher is able to create a lesson plan that is in aligned with the Master Plan'
        ],
        evidenceId: 'A'
    },
    {
        id: 'B1',
        section: 'Section B: Classroom Practice - Care about Culture',
        items: [
            'Teacher and student interactions are respectful.',
            'The classroom has a culture of respect for their peers.',
            'The classroom has a culture of respect for each other’s artwork.',
            'The classroom has a culture of respect for the resources.',
            'The classroom has a culture of learning reflected by the teacher communicating the passion for the subject, having high expectations and students taking pride in their work.',
            'The teacher is able to effectively manage classroom routines such as assigning of the groups, management of transitions in between activities, and management of resources and materials.'
        ],
        evidenceId: 'B1'
    },
    {
        id: 'B2',
        section: 'Section B: Classroom Practice - Instruct to Inspire',
        items: [
            'Teacher is able to communicate the goal and objective of the session to students.',
            'Teachers\' directions and procedures are clear and coherent for students.',
            'Teacher is able to integrate technology in class while using visual art and makery vocabulary.',
            'Teacher is able to use various tools and questioning techniques appropriate for a Visual Arts Classroom.',
            'Teacher is able to engage students in active learning with the help of demonstrations and design crit sessions.',
            'Teacher demonstrates flexibility and responsiveness along that is reflected in lesson adjustments as per the needs of the classroom, building on students responses and persevering their efforts in helping students who need support.'
        ],
        evidenceId: 'B2'
    },
    {
        id: 'B3',
        section: 'Section B: Classroom Practice - Authentic Assessments',
        items: [
            'Teacher uses student assessments results to plan future instructions.'
        ],
        evidenceId: 'B3'
    },
    {
        id: 'B4',
        section: 'Section B: Classroom Practice - Engaging Environment',
        items: [
            'Teacher keeps the visual art studio organised and free from clutter.',
            'Teachers and students use physical resources easily and skillfully.',
            'Student thinking is made visible through work produced on the pin up boards. Following boards are maintained- information wall, wall of questions, wall of images.',
            'Student work is displayed during crit and feedback sessions.'
        ],
        evidenceId: 'B4'
    },
    {
        id: 'C1',
        section: 'Section C: Professional Practice',
        items: [
            'Teacher maintains accurate records that include the student\'s portfolio, teacher\'s LP, parent- teacher records.',
            'Teachers participate in the professional community as reflected by maintaining cooperative relationships with peers, volunteering in various events, projects. etc.',
            'Teachers seek out opportunities for professional development and make a systematic effort by enrolling themselves in courses related to visual arts, design and makery and attending training sessions.',
            'Teacher communicates and behaves professionally as reflected by a prompt response over email, updating classroom images and maintaining notes on what went right and what could be better.'
        ],
        evidenceId: 'C1'
    }
];

const SPECIALIST_TOOLS = [
    '321', 'Affirmations', 'All Eyes on Me', 'Brain Breaks (any 2)', 'Brainstorming',
    'Catch a Bubble (EY-2)', 'Choral Call', 'Circle Time (EY-2)', 'Circulate',
    'Cold Call', 'Concept Map', 'Countdown', 'Do Now', 'Entry Ticket', 'Exit Ticket',
    'Find somebody who', 'Give me Five (EY-2)', 'Glow & Grow', 'Good Things',
    'Grounding', 'Hand Signals', 'Help Now Strategies', 'HoH - Care', 'HoH - Grit',
    'I use to Think/Now I Know', 'KWL', 'Mingle', 'Morning Greetings', 'Parking Lot',
    'Post the Plan', 'Put on your Thinking Cap (Grades EY - 4)', 'Quick Draw - Quick Write',
    'Resourcing', 'Round Table Discussion', 'Shift & Stay', 'Show Call',
    'Social Contract', 'T-Chart', 'Talking sticks', 'Think-Pair-Share', 'Timeout',
    'Tracking', 'Turn & Talk', 'Wait Time'
];

const SPECIALIST_ROUTINES = [
    'Arrival Routine', 'Attendance Routine', 'Class Cleaning Routines',
    'Collection Routine', 'Departure Routine', 'Grouping Routine', 'Lining Up Strategies'
];

const RATING_LEVELS = ['Basic', 'Developing', 'Effective', 'Highly Effective'];

interface GoalWorkflowFormsProps {
    goal: any;
    role: 'TEACHER' | 'LEADER' | 'ADMIN';
    onComplete: () => void;
    onClose: () => void;
}

export const GoalWorkflowForms = ({ goal, role, onComplete, onClose }: GoalWorkflowFormsProps) => {
    const { user } = useAuth();
    const [phase, setPhase] = useState<'SELF_REFLECTION' | 'GOAL_SETTING' | 'GOAL_COMPLETION' | 'VIEW' | 'MASTER_FORM'>('VIEW');
    const [formData, setFormData] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [windows, setWindows] = useState<any[]>([]);

    useEffect(() => {
        fetchWindows();
        determinePhase();

        // Ensure formData is pre-loaded if they already have draft data
        if (goal.selfReflectionForm) {
            setFormData(safeJsonParse(goal.selfReflectionForm));
        } else {
            setFormData({});
        }
    }, [goal]);

    const fetchWindows = async () => {
        try {
            const res = await api.get('/goal-windows');
            setWindows(res.data.data.windows);
        } catch (err) { }
    };

    const determinePhase = () => {
        if (role === 'TEACHER') {
            if (goal.status === 'SELF_REFLECTION_PENDING' || goal.status === 'IN_PROGRESS') setPhase('SELF_REFLECTION');
            else setPhase('VIEW');
        } else if (role === 'LEADER') {
            if (goal.status === 'SELF_REFLECTION_SUBMITTED') setPhase('GOAL_SETTING');
            else if (goal.status === 'GOAL_SET') setPhase('GOAL_COMPLETION');
            else setPhase('VIEW');
        } else if (role === 'ADMIN') {
            // Admin defaults to Master Form (Goal Creation)
            setPhase('MASTER_FORM');
        }
    };

    const isWindowOpen = (p: string) => {
        const win = windows.find(w => w.phase === p);
        if (!win || win.status === 'CLOSED') return false;
        const now = new Date();
        if (win.startDate && now < new Date(win.startDate)) return false;
        if (win.endDate && now > new Date(win.endDate)) return false;
        return true;
    };

    const handleSubmit = async () => {
        if (role !== 'ADMIN' && !isWindowOpen(phase)) {
            toast.error("Submission window is currently closed");
            return;
        }

        setIsSubmitting(true);
        try {
            let endpoint = '';
            let payload = {};

            if (phase === 'SELF_REFLECTION') {
                endpoint = `/goals/${goal.id}/self-reflection`;
                payload = { reflectionData: formData };
            } else if (phase === 'GOAL_SETTING') {
                endpoint = `/goals/${goal.id}/goal-setting`;
                payload = { settingData: formData };
            } else if (phase === 'GOAL_COMPLETION') {
                endpoint = `/goals/${goal.id}/goal-completion`;
                payload = { completionData: formData, status: formData.status || 'GOAL_COMPLETED' };
            }

            const res = await api.post(endpoint, payload);
            if (res.data.status === 'success') {
                toast.success("Submitted successfully");
                onComplete();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to submit");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderContent = () => {
        if (phase === 'MASTER_FORM') {
            return (
                <ScrollArea className="h-[65vh] w-full">
                    <GoalSettingForm
                        teachers={[{ id: goal.teacherId || "temp-id", name: goal.teacher || "Unknown", email: goal.teacherEmail || "", academics: goal.academicType || "CORE" }]}
                        defaultCoachName={goal.assignedBy || "Admin"}
                        initialData={{
                            educatorName: goal.teacher,
                            teacherEmail: goal.teacherEmail || "",
                            coachName: goal.assignedBy || "Admin",
                            campus: goal.campus || "HQ",
                            dateOfGoalSetting: goal.createdAt ? new Date(goal.createdAt) : new Date(),
                            goalForYear: goal.title,
                            reasonForGoal: goal.description || "Defined during goal setting",
                            actionStep: goal.actionStep || "Initial planning",
                            pillarTag: goal.category || goal.pillar || "Professional Practice",
                            goalEndDate: goal.dueDate ? new Date(goal.dueDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                            awareOfProcess: "yes",
                            awareOfFramework: "yes",
                            reflectionCompleted: "yes",
                            evidenceProvided: "yes",
                            ...safeJsonParse(goal.goalSettingForm)
                        }}
                        onSubmit={async (data) => {
                            if (role !== 'ADMIN') return;
                            try {
                                setIsSubmitting(true);
                                const payload = {
                                    title: data.goalForYear || goal.title,
                                    description: data.reasonForGoal !== undefined ? data.reasonForGoal : goal.description,
                                    actionStep: data.actionStep !== undefined ? data.actionStep : goal.actionStep,
                                    pillar: data.pillarTag || goal.pillar,
                                    category: data.pillarTag || goal.category,
                                    campus: data.campus || goal.campus,
                                    dueDate: data.goalEndDate ? new Date(data.goalEndDate).toISOString() : goal.dueDate,
                                    goalSettingForm: JSON.stringify(data)
                                };
                                const res = await api.patch(`/goals/${goal.id}`, payload);
                                if (res.data?.status === 'success' || res.status === 200) {
                                    toast.success(`Goal master form updated for ${goal.teacher}.`);
                                    onComplete();
                                }
                            } catch (err) {
                                toast.error("Failed to update goal via master form.");
                            } finally {
                                setIsSubmitting(false);
                            }
                        }}
                        onCancel={onClose}
                    />
                </ScrollArea>
            );
        }

        if (phase === 'SELF_REFLECTION') {
            // Detect framework: teacher data is the primary signal;
            // logged-in user data is only a fallback for the teacher themselves.
            const teacherEmail = goal.teacherEmail?.toLowerCase() || user?.email?.toLowerCase() || '';
            const teacherDept = goal.teacherDepartment || user?.department || '';

            const isPE =
                teacherDept === 'Physical Education' ||
                teacherEmail.includes('.pe') ||
                goal.category === 'Physical Education' ||
                goal.title?.toLowerCase().includes('physical education') ||
                goal.title?.toLowerCase().includes('p.e');

            const isVA = !isPE && (
                teacherDept === 'Visual Arts' ||
                teacherEmail.includes('.va') ||
                goal.category === 'Visual Arts' ||
                goal.title?.toLowerCase().includes('visual arts')
            );

            const isPA = !isPE && !isVA && (
                teacherDept === 'Performing Arts' ||
                teacherDept === 'Arts' || // "Arts" maps to PA
                teacherEmail.includes('.art') ||
                goal.category === 'Performing Arts' ||
                goal.title?.toLowerCase().includes('performing arts') ||
                goal.title?.toLowerCase().includes('arts')
            );

            const isCore = goal.academicType === 'CORE' && !isPE && !isPA && !isVA;

            if (isCore) {
                return (
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-8 pb-4">
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-6 font-medium">
                                <p className="text-sm">Ekya Danielson Self-Reflection Form</p>
                                <Badge variant="outline" className="mt-1 text-[10px] uppercase">Core Track</Badge>
                            </div>

                            <div className="space-y-6">
                                {CORE_FRAMEWORK.map((section) => (
                                    <Card key={section.id} className="border-none shadow-sm bg-muted/20 overflow-hidden">
                                        <CardHeader className="bg-primary/5 pb-2">
                                            <CardTitle className="text-xs font-bold uppercase tracking-tight text-primary">{section.section}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-6">
                                            <div className="grid gap-4">
                                                {section.items.map((item, itemIdx) => (
                                                    <div key={itemIdx} className="flex flex-col gap-3 p-4 rounded-xl bg-background border border-muted-foreground/10 shadow-sm hover:border-primary/20 transition-colors">
                                                        <p className="text-sm font-semibold text-foreground/90">{item}</p>
                                                        <RadioGroup
                                                            onValueChange={(val) => {
                                                                const newRatings = { ...(formData?.ratings || {}), [item]: val };
                                                                setFormData({ ...(formData || {}), ratings: newRatings });
                                                            }}
                                                            value={formData?.ratings?.[item] || ''}
                                                            className="flex flex-wrap gap-x-6 gap-y-3 pt-2"
                                                        >
                                                            {RATING_LEVELS.map((level, levelIdx) => {
                                                                const sId = `core-${section.id}-${itemIdx}-${levelIdx}`;
                                                                return (
                                                                    <div key={levelIdx} className="flex items-center space-x-2 bg-muted/30 px-3 py-1.5 rounded-full hover:bg-muted/50 transition-colors cursor-pointer">
                                                                        <RadioGroupItem value={level} id={sId} className="w-4 h-4" />
                                                                        <Label htmlFor={sId} className="text-xs cursor-pointer font-medium">{level}</Label>
                                                                    </div>
                                                                );
                                                            })}
                                                        </RadioGroup>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-2">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block">Share evidences for your rating ({section.evidenceId})</Label>
                                                <Textarea
                                                    placeholder="Provide specific evidence..."
                                                    className="text-xs min-h-[60px]"
                                                    value={formData?.evidence?.[section.evidenceId] || ''}
                                                    onChange={(e) => {
                                                        const newEvidence = { ...(formData?.evidence || {}), [section.evidenceId]: e.target.value };
                                                        setFormData({ ...(formData || {}), evidence: newEvidence });
                                                    }}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                <Card className="border-none shadow-sm bg-primary/5 overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-bold uppercase text-primary">Final Reflection</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        {[
                                            { id: 'strengths', l: 'What are your strengths? *' },
                                            { id: 'improvement', l: 'What do you think you need to improve on? *' },
                                            { id: 'goal', l: 'What goal would you like to set for yourself? *' },
                                            { id: 'anythingElse', l: "Anything else you'd like to share" }
                                        ].map(field => (
                                            <div key={field.id} className="space-y-2">
                                                <Label className="text-xs font-bold">{field.l}</Label>
                                                <Textarea
                                                    className="text-xs min-h-[80px] bg-background"
                                                    value={formData?.reflection?.[field.id] || ''}
                                                    onChange={(e) => setFormData({ ...(formData || {}), reflection: { ...(formData?.reflection || {}), [field.id]: e.target.value } })}
                                                />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </ScrollArea>
                );
            }

            if (isPA || isPE || isVA) {
                const framework = isPA ? PA_FRAMEWORK : isPE ? PE_FRAMEWORK : VA_FRAMEWORK;
                const frameworkName = isPA ? 'Performing Arts' : isPE ? 'Physical Education' : 'Visual Arts';
                const ratingOptions = isVA ? ['Yes', 'No', 'Not Applicable'] : ['Yes', 'No'];
                return (
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-8 pb-4">
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-6">
                                <p className="text-sm font-medium">{frameworkName} Self-Reflection</p>
                                <Badge variant="outline" className="mt-1 text-[10px] uppercase">Specialist Track</Badge>
                            </div>

                            <Card className="border-none shadow-sm bg-primary/5 overflow-hidden">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold uppercase text-primary">Grade Level Context</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold italic text-muted-foreground">Select your current category block *</Label>
                                        <RadioGroup
                                            className="flex flex-wrap gap-3 pt-2"
                                            onValueChange={(val) => setFormData({ ...(formData || {}), block: val })}
                                            value={formData.block || ''}
                                        >
                                            {['Early Years', 'Primary', 'Middle', 'Senior', 'Whole School'].map((b, bIdx) => {
                                                const sId = `block-${bIdx}`;
                                                return (
                                                    <div key={bIdx} className="flex items-center space-x-2 bg-background/50 border border-primary/10 px-4 py-2 rounded-xl cursor-pointer hover:bg-background transition-all">
                                                        <RadioGroupItem value={b} id={sId} />
                                                        <Label htmlFor={sId} className="text-xs cursor-pointer font-bold">{b}</Label>
                                                    </div>
                                                );
                                            })}
                                        </RadioGroup>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                {framework.map((section) => (
                                    <Card key={section.id} className="border-none shadow-sm bg-muted/20 overflow-hidden">
                                        <CardHeader className="bg-primary/5 pb-4">
                                            <CardTitle className="text-xs font-bold uppercase tracking-tight text-primary">{section.section}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-6">
                                            <div className="space-y-4">
                                                {section.items.map((item, itemIdx) => (
                                                    <div key={itemIdx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-background border border-muted-foreground/10 shadow-sm hover:border-primary/20 transition-colors">
                                                        <p className="text-sm font-medium md:max-w-[70%]">{item}</p>
                                                        <RadioGroup
                                                            onValueChange={(val) => {
                                                                const newRatings = { ...(formData?.ratings || {}), [item]: val };
                                                                setFormData({ ...(formData || {}), ratings: newRatings });
                                                            }}
                                                            value={formData?.ratings?.[item] || ''}
                                                            className="flex gap-2 flex-wrap md:flex-nowrap shrink-0"
                                                        >
                                                            {ratingOptions.map((level, levelIdx) => {
                                                                const sId = `specialist-${section.id}-${itemIdx}-${levelIdx}`;
                                                                return (
                                                                    <div key={levelIdx} className="flex items-center space-x-2 bg-muted/30 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                                                        <RadioGroupItem value={level} id={sId} className="w-4 h-4 shrink-0" />
                                                                        <Label htmlFor={sId} className="text-xs cursor-pointer break-words max-w-[80px] leading-snug font-medium">{level}</Label>
                                                                    </div>
                                                                );
                                                            })}
                                                        </RadioGroup>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-2">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block">Share evidences for your rating ({section.id})</Label>
                                                <Textarea
                                                    placeholder="Provide specific evidence..."
                                                    className="text-xs min-h-[60px]"
                                                    value={formData?.evidence?.[section.id] || ''}
                                                    onChange={(e) => {
                                                        const newEvidence = { ...(formData?.evidence || {}), [section.id]: e.target.value };
                                                        setFormData({ ...(formData || {}), evidence: newEvidence });
                                                    }}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                <Card className="border-none shadow-sm bg-primary/5 overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-bold uppercase text-primary">Classroom Dynamics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold">How would you rate your classrooms overall?</Label>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Basic</span>
                                                <RadioGroup
                                                    className="flex gap-4"
                                                    onValueChange={(val) => setFormData({ ...(formData || {}), overallRating: val })}
                                                    value={formData.overallRating || ''}
                                                >
                                                    {['1', '2', '3', '4'].map((r, rIdx) => {
                                                        const sId = `rating-${rIdx}`;
                                                        return (
                                                            <div key={rIdx} className="flex flex-col items-center gap-2 bg-background p-2 rounded-lg border border-muted shadow-sm hover:border-primary/30 transition-colors cursor-pointer min-w-[40px]">
                                                                <RadioGroupItem value={r} id={sId} />
                                                                <Label htmlFor={sId} className="text-xs font-bold cursor-pointer">{r}</Label>
                                                            </div>
                                                        );
                                                    })}
                                                </RadioGroup>
                                                <span className="text-[10px] text-primary font-bold uppercase">Highly Effective</span>
                                            </div>
                                        </div>

                                        <Separator className="bg-primary/10" />

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold">Which tools do you use actively in your classroom?</Label>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                                                {SPECIALIST_TOOLS.map((tool, tIdx) => {
                                                    const sId = `tool-${tIdx}`;
                                                    return (
                                                        <div key={tIdx} className="flex items-center space-x-3 bg-background p-2 px-3 rounded-lg border border-muted shadow-sm hover:border-primary/20 transition-colors">
                                                            <Checkbox
                                                                id={sId}
                                                                className="w-4 h-4"
                                                                checked={(formData.tools || []).includes(tool)}
                                                                onCheckedChange={(checked) => {
                                                                    const tools = formData.tools || [];
                                                                    setFormData({
                                                                        ...(formData || {}),
                                                                        tools: checked ? [...tools, tool] : tools.filter((t: string) => t !== tool)
                                                                    });
                                                                }}
                                                            />
                                                            <Label htmlFor={sId} className="text-xs cursor-pointer font-medium leading-tight">{tool}</Label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold">Which routines do you use actively in your classroom?</Label>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                                                {SPECIALIST_ROUTINES.map((routine, rIdx) => {
                                                    const sId = `routine-${rIdx}`;
                                                    return (
                                                        <div key={rIdx} className="flex items-center space-x-3 bg-background p-2 px-3 rounded-lg border border-muted shadow-sm hover:border-primary/20 transition-colors">
                                                            <Checkbox
                                                                id={sId}
                                                                className="w-4 h-4"
                                                                checked={(formData.routines || []).includes(routine)}
                                                                onCheckedChange={(checked) => {
                                                                    const routines = formData.routines || [];
                                                                    setFormData({
                                                                        ...(formData || {}),
                                                                        routines: checked ? [...routines, routine] : routines.filter((r: string) => r !== routine)
                                                                    });
                                                                }}
                                                            />
                                                            <Label htmlFor={sId} className="text-xs cursor-pointer font-medium leading-tight">{routine}</Label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-primary/5 overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-bold uppercase text-primary">Final Reflection</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        {[
                                            { id: 'strengths', l: isPE ? 'What are your strengths as a PE educator? *' : isVA ? 'What are your strengths as a visual arts educator? *' : 'What are your strengths? *' },
                                            { id: 'improvement', l: 'What do you think you need to improve on? *' },
                                            { id: 'goal', l: 'What goal would you like to set for yourself? *' },
                                            { id: 'anythingElse', l: "Anything else you'd like to share" }
                                        ].map(field => (
                                            <div key={field.id} className="space-y-2">
                                                <Label className="text-xs font-bold">{field.l}</Label>
                                                <Textarea
                                                    className="text-xs min-h-[80px] bg-background"
                                                    value={formData?.reflection?.[field.id] || ''}
                                                    onChange={(e) => setFormData({ ...(formData || {}), reflection: { ...(formData?.reflection || {}), [field.id]: e.target.value } })}
                                                />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </ScrollArea>
                );
            }

            return (
                <div className="space-y-4">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                        <p className="text-sm font-medium">Goal: {goal.title}</p>
                        <Badge variant="secondary" className="mt-2 text-[10px] uppercase">Non-Core Track</Badge>
                    </div>

                    <Card className="border-none shadow-sm bg-primary/5 overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase text-primary">Non-Core Self-Reflection</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">Professional Contribution</Label>
                                <Textarea
                                    placeholder="Describe your professional contribution and collaboration..."
                                    className="min-h-[100px] bg-background"
                                    value={formData.impact || ''}
                                    onChange={(e) => setFormData({ ...(formData || {}), impact: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">Skill Development & Alignment</Label>
                                <Textarea
                                    placeholder="Describe skills developed and alignment with school needs..."
                                    className="min-h-[100px] bg-background"
                                    value={formData.evidence || ''}
                                    onChange={(e) => setFormData({ ...(formData || {}), evidence: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">Summary</Label>
                                <Textarea
                                    placeholder="Final summary and any additional support required..."
                                    className="min-h-[120px] bg-background"
                                    value={formData.text || ''}
                                    onChange={(e) => setFormData({ ...(formData || {}), text: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        const renderDetailedReflection = () => {
            if (!goal.selfReflectionForm) return null;
            const refData = safeJsonParse(goal.selfReflectionForm);

            const teacherEmail = goal.teacherEmail?.toLowerCase() || '';
            const teacherDept = goal.teacherDepartment || '';

            const isPE = goal.category === 'Physical Education' ||
                teacherDept === 'Physical Education' ||
                teacherEmail.includes('.pe') ||
                (goal.title?.toLowerCase().includes('p.e') && !goal.category);

            const isVA = !isPE && (goal.category === 'Visual Arts' || teacherDept === 'Visual Arts' || teacherEmail.includes('.va') || goal.title?.toLowerCase().includes('visual arts'));
            const isPA = !isPE && !isVA && (refData?.block || goal.category === 'Performing Arts' || teacherDept === 'Performing Arts' || teacherDept === 'Arts' || teacherEmail.includes('.art') || goal.title?.toLowerCase().includes('arts'));
            const isCore = !isPA && !isPE && !isVA && (refData.ratings && Object.keys(refData.ratings).length > 0);

            if (isPA || isPE || isVA) {
                const framework = isPA ? PA_FRAMEWORK : isPE ? PE_FRAMEWORK : VA_FRAMEWORK;
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <div>
                                <p className="text-[10px] font-bold text-primary uppercase">Category Block</p>
                                <p className="text-sm font-semibold">{refData.block}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-primary uppercase">Overall Rating</p>
                                <Badge className="bg-primary text-white">{refData.overallRating || 'N/A'}/4</Badge>
                            </div>
                        </div>

                        {framework.map(section => (
                            <Card key={section.id} className="border-none shadow-sm bg-muted/20 overflow-hidden">
                                <CardHeader className="bg-primary/5 pb-2">
                                    <CardTitle className="text-xs font-bold uppercase tracking-tight text-primary">
                                        {section.section}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    <div className="grid gap-2">
                                        {section.items.map(item => (
                                            <div key={item} className="flex justify-between items-center text-[11px] p-2 bg-background rounded border border-muted-foreground/5 shadow-sm">
                                                <span className="font-medium max-w-[80%]">{item}</span>
                                                <Badge variant={refData.ratings?.[item] === 'Yes' ? 'default' : 'outline'} className="text-[10px]">
                                                    {refData.ratings?.[item] || 'N/A'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                        <p className="text-[10px] font-bold text-primary/70 uppercase mb-1 flex items-center gap-1.5">
                                            <FileText className="w-3 h-3" /> Evidence ({section.id})
                                        </p>
                                        <p className="text-xs italic leading-relaxed text-muted-foreground line-clamp-3">
                                            {refData.evidence?.[section.id] || 'No evidence provided'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                );
            }

            if (isCore) {
                return (
                    <div className="space-y-6">
                        {CORE_FRAMEWORK.map(section => (
                            <Card key={section.id} className="border-none shadow-sm bg-muted/20 overflow-hidden">
                                <CardHeader className="bg-primary/5 pb-2">
                                    <CardTitle className="text-xs font-bold uppercase tracking-tight text-primary">
                                        {section.section}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    <div className="grid gap-2">
                                        {section.items.map(item => (
                                            <div key={item} className="flex justify-between items-center text-[11px] p-2 bg-background rounded border border-muted-foreground/5 shadow-sm">
                                                <span className="font-medium">{item}</span>
                                                <Badge variant="outline" className="text-[10px] bg-background">
                                                    {refData.ratings?.[item] || 'Not Rated'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                        <p className="text-[10px] font-bold text-primary/70 uppercase mb-1 flex items-center gap-1.5">
                                            <FileText className="w-3 h-3" /> Evidence ({section.evidenceId})
                                        </p>
                                        <p className="text-xs italic leading-relaxed text-muted-foreground line-clamp-3">
                                            {refData.evidence?.[section.evidenceId] || 'No evidence provided'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                );
            }

            return (
                <div className="space-y-3">
                    {['Impact', 'Evidence', 'Text'].map(field => (
                        <div key={field} className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">{field}</p>
                            <p className="text-xs italic">"{refData[field.toLowerCase()] || 'N/A'}"</p>
                        </div>
                    ))}
                </div>
            );
        };

        if (phase === 'GOAL_SETTING') {
            return (
                <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge>HOS Goal Review</Badge>
                                <span className="text-xs font-medium text-muted-foreground">Phase 2: Set Expectations</span>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">HOS Goal Expectations & Success Criteria</Label>
                                <Textarea
                                    placeholder="Define clear success criteria for this goal..."
                                    className="min-h-[150px] text-xs bg-background"
                                    value={formData.text || ''}
                                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                />
                                {!isWindowOpen('GOAL_SETTING') && (
                                    <p className="text-[10px] text-destructive flex items-center gap-1 font-bold">
                                        <AlertCircle className="w-3 h-3" /> Note: Submission window is closed
                                    </p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Teacher's Self-Reflection Details
                            </h3>
                            {renderDetailedReflection()}
                        </div>
                    </div>
                </ScrollArea>
            );
        }

        if (phase === 'GOAL_COMPLETION') {
            return (
                <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge className="bg-emerald-600">Final Evaluation</Badge>
                                <span className="text-xs font-medium text-emerald-800">Phase 3: Goal Outcome</span>
                            </div>

                            <div className="space-y-4">
                                <div className="p-3 bg-white rounded-lg border border-emerald-100 shadow-sm">
                                    <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Expectations Set Previously:</p>
                                    <p className="text-xs font-medium">{safeJsonParse(goal.goalSettingForm).text || '-'}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-emerald-900">Final Feedback & Narrative</Label>
                                    <Textarea
                                        placeholder="Final assessment of teacher's accomplishments..."
                                        className="min-h-[120px] text-xs bg-white"
                                        value={formData.text || ''}
                                        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-emerald-900">Final Goal Status</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'GOAL_COMPLETED', label: 'Goal Completed', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200' },
                                            { id: 'PARTIALLY_MET', label: 'Partially Met', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' },
                                            { id: 'NOT_MET', label: 'Not Met', color: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' }
                                        ].map(s => (
                                            <Button
                                                key={s.id}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setFormData({ ...formData, status: s.id })}
                                                className={cn(
                                                    "text-[10px] h-8 font-bold",
                                                    formData.status === s.id ? s.color : "opacity-60"
                                                )}
                                            >
                                                {s.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4 opacity-80 scale-[0.98] origin-top">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Reference: Teacher's Reflection
                            </h3>
                            {renderDetailedReflection()}
                        </div>
                    </div>
                </ScrollArea>
            );
        }

        // VIEW mode
        const refData = safeJsonParse(goal.selfReflectionForm);
        const isComplex = !!refData.ratings;
        const isPE = goal.category === 'Physical Education' ||
            goal.teacherDepartment === 'Physical Education' ||
            goal.teacherEmail?.toLowerCase().includes('.pe') ||
            (goal.title?.toLowerCase().includes('p.e') && !goal.category);
        const isPA = !isPE && (refData?.block || goal.category === 'Performing Arts' || goal.teacherDepartment === 'Performing Arts' || goal.teacherEmail?.toLowerCase().includes('.art'));
        const isVA = !isPE && !isPA && (refData?.block || goal.category === 'Visual Arts' || goal.teacherDepartment === 'Visual Arts' || goal.teacherEmail?.toLowerCase().includes('.va') || goal.title?.toLowerCase().includes('visual arts') || goal.title?.toLowerCase().includes('art'));
        const framework = isPA ? PA_FRAMEWORK : isPE ? PE_FRAMEWORK : isVA ? VA_FRAMEWORK : null;

        return (
            <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6">
                    {goal.selfReflectionForm && (
                        <div className="space-y-8">
                            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
                                <Badge>Teacher Reflection</Badge>
                                {isComplex ? "Ekya Danielson Framework" : "Simple Track"}
                            </div>

                            {isComplex && refData.block && framework ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                                        <div>
                                            <p className="text-[10px] font-bold text-primary uppercase">Category Block</p>
                                            <p className="text-sm font-semibold">{refData.block}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-primary uppercase">Overall Rating</p>
                                            <Badge className="bg-primary text-white">{refData.overallRating || 'N/A'}/4</Badge>
                                        </div>
                                    </div>

                                    {framework.map(section => (
                                        <Card key={section.id} className="border-none shadow-sm bg-muted/20 overflow-hidden">
                                            <CardHeader className="bg-primary/5 pb-2">
                                                <CardTitle className="text-xs font-bold uppercase tracking-tight text-primary">
                                                    {section.section}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-4 space-y-4">
                                                <div className="grid gap-2">
                                                    {section.items.map(item => (
                                                        <div key={item} className="flex justify-between items-center text-[11px] p-2 bg-background rounded border border-muted-foreground/5 shadow-sm">
                                                            <span className="font-medium max-w-[80%]">{item}</span>
                                                            <Badge variant={refData.ratings?.[item] === 'Yes' ? 'default' : 'outline'} className="text-[10px]">
                                                                {refData.ratings?.[item] || 'N/A'}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                                    <p className="text-[10px] font-bold text-primary/70 uppercase mb-1 flex items-center gap-1.5">
                                                        <FileText className="w-3 h-3" /> Evidence ({section.id})
                                                    </p>
                                                    <p className="text-xs italic leading-relaxed text-muted-foreground">
                                                        {refData.evidence?.[section.id] || 'No evidence provided'}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <Card className="border-none bg-primary/5">
                                        <CardContent className="p-4 space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-primary uppercase mb-2">Classroom Tools Used</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(refData.tools || []).map((tool: string) => (
                                                        <Badge key={tool} variant="outline" className="bg-background text-[10px]">{tool}</Badge>
                                                    ))}
                                                    {(!refData.tools || refData.tools.length === 0) && <p className="text-xs italic text-muted-foreground">None listed</p>}
                                                </div>
                                            </div>
                                            <Separator className="bg-primary/10" />
                                            <div>
                                                <p className="text-[10px] font-bold text-primary uppercase mb-2">Active Routines</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(refData.routines || []).map((routine: string) => (
                                                        <Badge key={routine} variant="outline" className="bg-background text-[10px]">{routine}</Badge>
                                                    ))}
                                                    {(!refData.routines || refData.routines.length === 0) && <p className="text-xs italic text-muted-foreground">None listed</p>}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="grid md:grid-cols-2 gap-4 pt-4">
                                        {[
                                            { l: 'Strengths', v: refData.reflection?.strengths, icon: <Sparkles className="w-3 h-3" /> },
                                            { l: 'Areas for Improvement', v: refData.reflection?.improvement, icon: <TrendingUp className="w-3 h-3" /> },
                                            { l: 'Set Goal', v: refData.reflection?.goal, icon: <Target className="w-3 h-3" /> },
                                            { l: 'Additional Notes', v: refData.reflection?.anythingElse, icon: <MessageSquare className="w-3 h-3" /> }
                                        ].map(item => (
                                            <Card key={item.l} className="border-none bg-primary/5">
                                                <CardContent className="p-4 space-y-2">
                                                    <p className="text-[10px] font-bold text-primary uppercase flex items-center gap-1.5">
                                                        {item.icon} {item.l}
                                                    </p>
                                                    <p className="text-xs leading-relaxed font-medium">
                                                        {item.v || 'N/A'}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ) : isComplex && !refData.block ? (
                                <div className="space-y-6">
                                    {CORE_FRAMEWORK.map(section => (
                                        <Card key={section.id} className="border-none shadow-sm bg-muted/20 overflow-hidden">
                                            <CardHeader className="bg-primary/5 pb-2">
                                                <CardTitle className="text-xs font-bold uppercase tracking-tight text-primary">
                                                    {section.section}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-4 space-y-4">
                                                <div className="grid gap-2">
                                                    {section.items.map(item => (
                                                        <div key={item} className="flex justify-between items-center text-[11px] p-2 bg-background rounded border border-muted-foreground/5 shadow-sm">
                                                            <span className="font-medium">{item}</span>
                                                            <Badge variant="outline" className="text-[10px] bg-background">
                                                                {refData.ratings?.[item] || 'Not Rated'}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                                    <p className="text-[10px] font-bold text-primary/70 uppercase mb-1 flex items-center gap-1.5">
                                                        <FileText className="w-3 h-3" /> Evidence ({section.evidenceId})
                                                    </p>
                                                    <p className="text-xs italic leading-relaxed text-muted-foreground">
                                                        {refData.evidence?.[section.evidenceId] || 'No evidence provided'}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <div className="grid md:grid-cols-2 gap-4 pt-4">
                                        {[
                                            { l: 'Strengths', v: refData.reflection?.strengths, icon: <Sparkles className="w-3 h-3" /> },
                                            { l: 'Areas for Improvement', v: refData.reflection?.improvement, icon: <TrendingUp className="w-3 h-3" /> },
                                            { l: 'Set Goal', v: refData.reflection?.goal, icon: <Target className="w-3 h-3" /> },
                                            { l: 'Additional Notes', v: refData.reflection?.anythingElse, icon: <MessageSquare className="w-3 h-3" /> }
                                        ].map(item => (
                                            <Card key={item.l} className="border-none bg-primary/5">
                                                <CardContent className="p-4 space-y-2">
                                                    <p className="text-[10px] font-bold text-primary uppercase flex items-center gap-1.5">
                                                        {item.icon} {item.l}
                                                    </p>
                                                    <p className="text-xs leading-relaxed font-medium">
                                                        {item.v || 'N/A'}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Impact / Contribution</p>
                                        <div className="p-3 bg-muted/30 rounded-lg text-sm italic">
                                            "{refData.impact || 'N/A'}"
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Evidence / Skills</p>
                                        <div className="p-3 bg-muted/30 rounded-lg text-sm italic">
                                            "{refData.evidence || 'N/A'}"
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Summary</p>
                                        <div className="p-3 bg-muted/30 rounded-lg text-sm italic">
                                            "{refData.text || 'N/A'}"
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {goal.goalSettingForm && (
                        <div className="space-y-1 pt-4 border-t border-muted">
                            <p className="text-[10px] font-bold text-primary uppercase">HOS Expectations</p>
                            <div className="p-3 bg-info/5 border border-info/10 rounded-lg text-sm font-medium">
                                {safeJsonParse(goal.goalSettingForm).text}
                            </div>
                        </div>
                    )}
                    {goal.goalCompletionForm && (
                        <div className="space-y-1 pt-4 border-t border-muted">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase">Final Evaluation</p>
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm">
                                {safeJsonParse(goal.goalCompletionForm).text}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        );
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl border-none shadow-2xl p-0 overflow-hidden">
                <div className="p-6 pb-0">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="rounded-md font-mono text-[10px] uppercase">
                                {(goal.status || 'IN_PROGRESS').replace('_', ' ')}
                            </Badge>
                            {role === 'ADMIN' && (
                                <Badge variant="destructive" className="rounded-md font-mono text-[10px] uppercase ml-auto">
                                    Admin Override Mode
                                </Badge>
                            )}
                        </div>
                        <DialogTitle className="text-xl font-bold flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                {phase === 'VIEW' ? 'Goal Details' : phase.replace('_', ' ')}
                            </div>

                            {role === 'ADMIN' && (
                                <Tabs value={phase} onValueChange={(v: any) => setPhase(v)} className="w-full mt-2">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="MASTER_FORM">Goal Creation</TabsTrigger>
                                        <TabsTrigger value="SELF_REFLECTION">Self Reflection</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            )}
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            {goal.teacher?.fullName || goal.teacher} - {goal.title}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-2">
                    {renderContent()}
                </div>

                {phase !== 'MASTER_FORM' && (
                    <div className="p-6 pt-2 bg-muted/10 border-t border-muted">
                        <DialogFooter className="gap-2">
                            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                                {phase === 'VIEW' ? 'Close' : 'Cancel'}
                            </Button>
                            {phase !== 'VIEW' && (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || (role !== 'ADMIN' && !isWindowOpen(phase))}
                                    className="gap-2"
                                >
                                    {isSubmitting ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Submit {phase.toLowerCase().replace('_', ' ')}
                                </Button>
                            )}
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
