import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Users, BookOpen, Target, Settings, MessageSquare, Tag,
    ChevronLeft, ChevronRight, Save, Eye, CheckCircle2,
    AlertCircle, Sparkles, ClipboardCheck, Layout, Star,
    Check, ChevronsUpDown, Search
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

import { cn } from "@/lib/utils";
import { Observation, DanielsonRatingScale, DanielsonDomain } from "@/types/observation";
import { toast } from "sonner";
import { useEffect } from "react";
import { templateService } from "@/services/templateService";
import { CAMPUS_OPTIONS } from "@/lib/constants";

interface UnifiedObservationFormProps {
    onSubmit: (observation: Partial<Observation>) => void;
    onCancel: () => void;
    initialData?: Partial<Observation>;
    teachers?: { id: string; name: string; role?: string; email?: string; academics?: string; campus?: string }[];
}

const RATING_SCALE: DanielsonRatingScale[] = ["Basic", "Developing", "Effective", "Highly Effective", "Not Observed"];

const DOMAINS: { id: string; title: string; subtitle: string; indicators: string[] }[] = [
    {
        id: "3A",
        title: "3A. Planning & Preparation",
        subtitle: "Live the Lesson",
        indicators: [
            "Demonstrating Knowledge of Content and Pedagogy",
            "Demonstrating Knowledge of Students",
            "Demonstrating Knowledge of Resources",
            "Designing a Microplan",
            "Using Student Assessments"
        ]
    },
    {
        id: "3B1",
        title: "3B1. Classroom Practice",
        subtitle: "Care about Culture",
        indicators: [
            "Creating an Environment of Respect and Rapport",
            "Establishing a Culture for Learning",
            "Managing Classroom Procedures",
            "Managing Student Behaviour"
        ]
    },
    {
        id: "3B2",
        title: "3B2. Classroom Practice",
        subtitle: "Instruct to Inspire",
        indicators: [
            "Communicating with Students",
            "Using Questioning and Discussion Techniques and Learning Tools",
            "Engages in Student Learning",
            "Demonstrating Flexibility and Responsiveness"
        ]
    },
    {
        id: "3B3",
        title: "3B3. Classroom Practice",
        subtitle: "Authentic Assessments",
        indicators: [
            "Using Assessments in Instruction"
        ]
    },
    {
        id: "3B4",
        title: "3B4. Classroom Practice",
        subtitle: "Engaging Environment",
        indicators: [
            "Organizing Physical Space",
            "Cleanliness",
            "Use of Boards"
        ]
    },
    {
        id: "3C",
        title: "3C. Professional Practice",
        subtitle: "Professional Ethics",
        indicators: [
            "Reflecting on Teaching",
            "Maintaining Accurate Records",
            "Communicating with Families",
            "Participating in a Professional Community",
            "Growing and Developing Professionally"
        ]
    }
];

const SPECIALIST_DOMAINS = [
    {
        id: "S1",
        title: "S1. Specialized Instruction & Skills",
        subtitle: "Skill-Based Pedagogy",
        indicators: [
            "Skill-Based Pedagogy",
            "Use of Specialist Resources",
            "Safety & Procedure Management"
        ]
    },
    {
        id: "S2",
        title: "S2. Student Engagement & Artistic/Physical Expression",
        subtitle: "Authentic Expression",
        indicators: [
            "Engaging Diverse Talent",
            "Feedback on Skill Development"
        ]
    }
];

const ROUTINES = [
    "Arrival Routine", "Attendance Routine", "Class Cleaning Routines",
    "Collection Routine", "Departure Routine", "Grouping Routine",
    "Lining Up Strategies", "No Routines Observed"
];

const CULTURE_TOOLS = [
    "Affirmations", "Brain Breaks", "Check-In", "Countdown",
    "Positive Framing", "Precise Praise", "Morning Meetings",
    "Social Contract", "Normalise Error", "No Culture Tools Observed"
];

const INSTRUCTIONAL_TOOLS = [
    "Do Now", "Think-Pair-Share", "Exit Ticket", "Cold Call",
    "Choral Call", "Concept Map", "KWL", "See-Think-Wonder",
    "Turn & Talk", "Wait Time", "No Tools Observed"
];

const LA_TOOLS = [
    "Math Journal", "Error Analysis", "Graphic Organisers",
    "Claim-Evidence-Reasoning", "Socratic Seminar", "Silent Debate",
    "No LA Tool Observed"
];

const META_TAGS = [
    "Knowledge of Content and Pedagogy", "Knowledge of Students",
    "Knowledge of Resources", "Designing a Microplan", "Using Student Assessments",
    "Creating an Environment of Respect and Rapport", "Establishing a Culture for Learning",
    "Managing Classroom Procedures", "Managing Student Behaviour",
    "Communicating with Students", "Using Questioning and Discussion Techniques and Learning Tools",
    "Using Assessment in Instruction", "Organizing Physical Space", "Cleanliness", "Use of Boards",
    "Reflecting on Teaching", "Maintaining Accurate Records", "Communicating with Families",
    "Participating in a Professional Community", "Growing and Developing Professionally"
];

const GRADE_OPTIONS = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const LEARNING_AREA_OPTIONS = ["Mathematics", "Science", "English", "Social Studies", "Arts", "Physical Education", "Technology", "Languages"];


export function UnifiedObservationForm({ onSubmit, onCancel, initialData = {}, teachers }: UnifiedObservationFormProps) {
    const [step, setStep] = useState(1);
    const [dynamicDomains, setDynamicDomains] = useState(DOMAINS);
    const [dynamicRoutines, setDynamicRoutines] = useState(ROUTINES);
    const [dynamicCultureTools, setDynamicCultureTools] = useState(CULTURE_TOOLS);
    const [dynamicInstructionalTools, setDynamicInstructionalTools] = useState(INSTRUCTIONAL_TOOLS);
    const [dynamicLaTools, setDynamicLaTools] = useState(LA_TOOLS);
    const [openGrade, setOpenGrade] = useState(false);
    const [openLA, setOpenLA] = useState(false);


    useEffect(() => {
        const loadTemplate = async () => {
            try {
                const templates = await templateService.getAllTemplates('OBSERVATION');
                const selectedTeacher = teachers?.find(t => t.id === formData.teacherId);
                const isSpecialist = selectedTeacher?.academics === 'NON_CORE';

                const templateName = isSpecialist ? 'Specialist Observation' : 'Walkthrough Observation';
                const currentTemplate = templates.find(t => t.name === templateName) || templates.find(t => t.isDefault) || templates[0];

                if (currentTemplate && currentTemplate.structure) {
                    const fields = typeof currentTemplate.structure === 'string'
                        ? JSON.parse(currentTemplate.structure)
                        : currentTemplate.structure;


                    // Reconstruct DOMAINS from fields if possible
                    const newDomains = [...DOMAINS];
                    fields.forEach((f: any) => {
                        if (f.id.startsWith('3A_') && f.type === 'radio') {
                            // Update indicator labels if they changed
                            // Simple mapping for now
                        }
                    });

                    const routineField = fields.find((f: any) => f.id === 'routines' || f.label.includes('Routines'));
                    const cultureField = fields.find((f: any) => f.id === 'cultureTools' || f.label.includes('Culture Tools'));
                    const instructionalField = fields.find((f: any) => f.id === 'instructionalTools' || f.label.includes('Instructional Tools'));
                    const laField = fields.find((f: any) => f.id === 'learningAreaTools' || f.label.includes('LA Tool'));

                    if (routineField?.options) setDynamicRoutines(routineField.options);
                    if (cultureField?.options) setDynamicCultureTools(cultureField.options);
                    if (instructionalField?.options) setDynamicInstructionalTools(instructionalField.options);
                    if (laField?.options) setDynamicLaTools(laField.options);

                    console.log("Loaded observation template options:", currentTemplate.name);
                }
            } catch (error) {
                console.error("Failed to load observation template", error);
            }
        };
        loadTemplate();
    }, []);

    // Internal state uses flattened classroom fields for stability
    const [formData, setFormData] = useState<Partial<Observation> & { block: string; grade: string; section: string }>(() => {
        const obs = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split('T')[0],
            observerRole: initialData.observerRole || "Head of School",
            domains: initialData.domains || DOMAINS.map(d => ({
                domainId: d.id,
                title: d.title,
                indicators: d.indicators.map(i => ({ name: i, rating: "Not Observed" })),
                evidence: ""
            })),
            routines: initialData.routines || [],
            cultureTools: initialData.cultureTools || [],
            instructionalTools: initialData.instructionalTools || [],
            learningAreaTools: initialData.learningAreaTools || [],
            metaTags: initialData.metaTags || [],
            discussionMet: initialData.discussionMet || false,
            strengths: initialData.strengths || "",
            areasOfGrowth: initialData.areasOfGrowth || "",
            feedback: initialData.feedback || "",
            actionSteps: initialData.actionSteps || "",
            nextSteps: initialData.nextSteps || "",
            score: initialData.score || 0,
            status: initialData.status || "Draft",
            hasReflection: initialData.hasReflection || false,
            reflection: initialData.reflection || "",
            // Classroom fields flattened
            campus: initialData.campus || "CMR NPS",
            teacher: initialData.teacher || "",
            teacherId: initialData.teacherId || "",
            teacherEmail: initialData.teacherEmail || "",
            observerName: initialData.observerName || "Rohit",
            block: initialData.classroom?.block || "",
            grade: initialData.classroom?.grade || "",
            section: initialData.classroom?.section || "",
            ...initialData,
            learningArea: initialData.learningArea || initialData.classroom?.learningArea || ""
        };
        return obs as Partial<Observation> & { block: string; grade: string; section: string };
    });

    const updateField = <K extends keyof (Partial<Observation> & { block: string; grade: string; section: string })>(
        field: K,
        value: (Partial<Observation> & { block: string; grade: string; section: string })[K]
    ) => {
        setFormData(prev => {
            if (prev[field] === value) return prev;
            return { ...prev, [field]: value };
        });
    };

    const handleTeacherSelect = (teacherId: string) => {
        const selectedTeacher = teachers?.find(t => t.id === teacherId);
        if (selectedTeacher) {
            const isSpecialist = selectedTeacher.academics === 'NON_CORE_ACADEMICS';
            const targetDomains = isSpecialist ? SPECIALIST_DOMAINS : DOMAINS;

            setFormData(prev => ({
                ...prev,
                teacherId: selectedTeacher.id,
                teacher: selectedTeacher.name,
                teacherEmail: selectedTeacher.email || `${selectedTeacher.name.toLowerCase().replace(' ', '.')}@ekya.in`,
                domains: targetDomains.map(d => ({
                    domainId: d.id,
                    title: d.title,
                    indicators: d.indicators.map(i => ({ name: i, rating: "Not Observed" })),
                    evidence: ""
                }))
            }));

            // Force reload template options
            setDynamicDomains(targetDomains);
        }
    };

    const updateIndicatorRating = (domainId: string, indicatorName: string, rating: DanielsonRatingScale) => {
        setFormData(prev => {
            const domain = prev.domains?.find(d => d.domainId === domainId);
            if (!domain) return prev;

            const indicator = domain.indicators.find(i => i.name === indicatorName);
            if (indicator?.rating === rating) return prev;

            return {
                ...prev,
                domains: prev.domains?.map(d => d.domainId === domainId ? {
                    ...d,
                    indicators: d.indicators.map(i => i.name === indicatorName ? { ...i, rating } : i)
                } : d)
            };
        });
    };

    const updateDomainEvidence = (domainId: string, evidence: string) => {
        setFormData(prev => {
            const domain = prev.domains?.find(d => d.domainId === domainId);
            if (domain?.evidence === evidence) return prev;

            return {
                ...prev,
                domains: prev.domains?.map(d => d.domainId === domainId ? { ...d, evidence } : d)
            };
        });
    };

    const setMultiSelect = (field: keyof Observation, item: string, checked: boolean) => {
        setFormData(prev => {
            const current = Array.isArray(prev[field]) ? (prev[field] as string[]) : [];
            const exists = current.includes(item);

            if (checked && !exists) {
                return { ...prev, [field]: [...current, item] };
            } else if (!checked && exists) {
                return { ...prev, [field]: current.filter(i => i !== item) };
            }
            return prev;
        });
    };

    const validateStep = () => {
        if (step === 1) {
            if (!formData.teacher?.trim() || !formData.teacherEmail?.trim() || !formData.campus) {
                toast.error("Please fill in all required teacher details");
                return false;
            }
        }
        if (step === 2) {
            if (!formData.block || !formData.grade || !formData.learningArea) {
                toast.error("Please fill in all required classroom details");
                return false;
            }
        }
        if (step === 3) {
            // Check if all domaines have evidence
            const missingEvidence = formData.domains?.some(d => !d.evidence.trim());
            // Requirement from prompt: "Evidence required for every rated section"
            // Let's interpret "rated section" as a domain where at least one indicator is observed
            // For simplicity, let's require evidence for all domains in Section 3
            if (missingEvidence) {
                toast.error("Please provide evidence for every rated domain");
                return false;
            }
        }
        if (step === 4) {
            // Optional but recommended
        }
        if (step === 5) {
            if (formData.discussionMet === undefined || !formData.notes?.trim() || !formData.actionStep?.trim()) {
                toast.error("Please complete feedback and action steps");
                return false;
            }
        }
        if (step === 6) {
            if (!formData.metaTags || formData.metaTags.length === 0) {
                toast.error("Please select at least one Meta Tag for improvement");
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            setStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep()) {
            let totalPoints = 0;
            let observedCount = 0;
            formData.domains?.forEach(d => {
                d.indicators.forEach(i => {
                    if (i.rating !== "Not Observed") {
                        observedCount++;
                        if (i.rating === "Highly Effective") totalPoints += 4;
                        else if (i.rating === "Effective") totalPoints += 3;
                        else if (i.rating === "Developing") totalPoints += 2;
                        else if (i.rating === "Basic") totalPoints += 1;
                    }
                });
            });
            const scoreValue = observedCount > 0 ? Number((totalPoints / observedCount).toFixed(1)) : 0;

            const finalGrade = formData.section ? `${formData.grade} - ${formData.section}` : formData.grade;

            const finalData: Partial<Observation> = {
                ...formData,
                score: scoreValue,
                domain: formData.metaTags?.[0] || "General Instruction",
                classroom: {
                    block: formData.block || "",
                    grade: finalGrade || "",
                    section: formData.section || "",
                    learningArea: formData.learningArea || ""
                }
            };


            onSubmit(finalData);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Progress Header */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pt-4 pb-6 border-b mb-8 px-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-primary">Observation Form</h2>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Layout className="w-4 h-4" /> Step {step} of 6: {
                                step === 1 ? "Teacher Details" :
                                    step === 2 ? "Classroom Details" :
                                        step === 3 ? "Danielson Ratings" :
                                            step === 4 ? "Routines & Tools" :
                                                step === 5 ? "Feedback" : "Meta Tags"
                            }
                        </p>
                    </div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6].map(s => (
                            <div key={s} className={cn("w-8 h-1.5 rounded-full transition-all duration-500", step >= s ? "bg-primary" : "bg-muted")} />
                        ))}
                    </div>
                </div>
            </div>

            <form onSubmit={handleFormSubmit} className="px-4">
                {/* Step 1: Observation & Teacher Details */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-none shadow-xl">
                            <CardHeader className="bg-primary/5 rounded-t-xl py-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Observation & Teacher Details</CardTitle>
                                        <CardDescription>Basic information about the session</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Name of the Teacher *</Label>
                                        <Select
                                            value={formData.teacherId || ""}
                                            onValueChange={(val) => {
                                                const teacher = teachers?.find(t => t.id === val);
                                                if (teacher) {
                                                    updateField("teacherId", teacher.id);
                                                    updateField("teacher", teacher.name);
                                                    updateField("teacherEmail", teacher.email || "");
                                                    updateField("campus", teacher.campus || "");
                                                }
                                            }}
                                            disabled={!!initialData.teacherId}
                                        >
                                            <SelectTrigger className={cn("h-12 text-base rounded-xl border-muted-foreground/20", !!initialData.teacherId && "bg-slate-50 text-muted-foreground")}>
                                                <SelectValue placeholder="Search or Select Teacher" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teachers?.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.role || 'Teacher'})</SelectItem>
                                                ))}
                                                {(!teachers || teachers.length === 0) && (
                                                    <SelectItem value="manual" disabled>No teachers found</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Teacher Email ID *</Label>
                                        <Input
                                            type="email"
                                            placeholder="teacher@ekya.in"
                                            value={formData.teacherEmail || ""}
                                            onChange={(e) => updateField("teacherEmail", e.target.value)}
                                            readOnly={!!initialData.teacherEmail}
                                            className={cn("h-12 text-base rounded-xl border-muted-foreground/20", !!initialData.teacherEmail && "bg-slate-50 text-muted-foreground")}
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Observer's Name *</Label>
                                        <Input
                                            value={formData.observerName || ""}
                                            onChange={(e) => updateField("observerName", e.target.value)}
                                            className="h-12 text-base rounded-xl border-muted-foreground/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Date of Observation *</Label>
                                        <Input
                                            type="date"
                                            value={formData.date || ""}
                                            onChange={(e) => updateField("date", e.target.value)}
                                            className="h-12 text-base rounded-xl border-muted-foreground/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Campus *</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {CAMPUS_OPTIONS.map(c => (
                                            <Badge
                                                key={c}
                                                variant={formData.campus === c ? "default" : "outline"}
                                                className={cn(
                                                    "cursor-pointer px-4 py-2 rounded-full text-xs font-semibold transition-all hover:scale-105",
                                                    formData.campus === c ? "bg-primary text-white" : "border-primary/20 text-muted-foreground hover:bg-primary/5"
                                                )}
                                                onClick={() => updateField("campus", c)}
                                            >
                                                {c}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Observer's Role *</Label>
                                    <RadioGroup
                                        value={formData.observerRole}
                                        onValueChange={(val) => updateField("observerRole", val)}
                                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                                    >
                                        {["Academic Coordinator", "CCA Coordinator", "Head of School", "ELC Team Member", "PDI Team Member", "Other"].map(r => (
                                            <div key={r} className="flex items-center space-x-2 border p-4 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors">
                                                <RadioGroupItem value={r} id={`role-${r}`} />
                                                <Label htmlFor={`role-${r}`} className="cursor-pointer font-medium">{r}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 2: Classroom Details */}
                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-none shadow-xl">
                            <CardHeader className="bg-indigo-500/5 rounded-t-xl py-6 border-l-4 border-indigo-500">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Classroom Details</CardTitle>
                                        <CardDescription>Subject and grade context</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Block *</Label>
                                    <div className="flex flex-wrap gap-4">
                                        {["Early Years", "Primary", "Middle", "Senior", "Specialist"].map(b => (
                                            <div
                                                key={b}
                                                className={cn(
                                                    "flex items-center gap-2 p-4 border-2 rounded-2xl transition-all cursor-pointer",
                                                    formData.block === b ? "border-primary bg-primary/5" : "border-muted-foreground/10 hover:border-primary/40 hover:bg-muted/20"
                                                )}
                                                onClick={() => updateField("block", b)}
                                            >
                                                <div className={cn("w-4 h-4 rounded-full border-2", formData.block === b ? "bg-primary border-primary" : "border-muted-foreground/20")} />
                                                <span className="font-bold">{b}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Grade *</Label>
                                        <Popover open={openGrade} onOpenChange={setOpenGrade}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openGrade}
                                                    className="w-full h-12 justify-between border-muted-foreground/20 rounded-xl text-base"
                                                >
                                                    {formData.grade
                                                        ? GRADE_OPTIONS.find((g) => g === formData.grade)
                                                        : "Select Grade"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search grade..." />
                                                    <CommandEmpty>No grade found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {GRADE_OPTIONS.map((g) => (
                                                            <CommandItem
                                                                key={g}
                                                                value={g}
                                                                onSelect={(currentValue) => {
                                                                    updateField("grade", currentValue === formData.grade ? "" : currentValue);
                                                                    setOpenGrade(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.grade === g ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {g}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Section</Label>
                                        <Input
                                            placeholder="e.g., A, B, Emerald"
                                            value={formData.section}
                                            onChange={(e) => updateField("section", e.target.value)}
                                            className="h-12 text-base rounded-xl border-muted-foreground/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Learning Area *</Label>
                                    <Popover open={openLA} onOpenChange={setOpenLA}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openLA}
                                                className="w-full h-12 justify-between border-muted-foreground/20 rounded-xl text-base"
                                            >
                                                {formData.learningArea
                                                    ? LEARNING_AREA_OPTIONS.find((la) => la === formData.learningArea)
                                                    : "Search or Select Learning Area"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search learning area..." />
                                                <CommandEmpty>No learning area found.</CommandEmpty>
                                                <CommandGroup>
                                                    {LEARNING_AREA_OPTIONS.map((la) => (
                                                        <CommandItem
                                                            key={la}
                                                            value={la}
                                                            onSelect={(currentValue) => {
                                                                updateField("learningArea", currentValue === formData.learningArea ? "" : (LEARNING_AREA_OPTIONS.find(opt => opt.toLowerCase() === currentValue.toLowerCase()) || currentValue));
                                                                setOpenLA(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.learningArea === la ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {la}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 3: Danielson Ratings */}
                {step === 3 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {DOMAINS.map((domain, domainIdx) => (
                            <Card key={domain.id} className="border-none shadow-xl overflow-hidden">
                                <CardHeader className="bg-primary/5 py-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                {domainIdx + 1}
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">{domain.title}</CardTitle>
                                                <CardDescription className="font-bold text-primary uppercase text-xs tracking-widest">{domain.subtitle}</CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-10">
                                    {domain.indicators.map((indicator, idx) => (
                                        <div key={indicator} className="space-y-4">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <Label className="text-base font-bold flex-1 leading-tight">
                                                    <span className="text-primary/40 mr-2">3.{domain.id}.{idx + 1}</span>
                                                    {indicator}
                                                </Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {RATING_SCALE.map(rating => (
                                                        <button
                                                            key={rating}
                                                            type="button"
                                                            onClick={() => updateIndicatorRating(domain.id, indicator, rating)}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                                                formData.domains?.find(d => d.domainId === domain.id)?.indicators.find(i => i.name === indicator)?.rating === rating
                                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                                    : "bg-background text-muted-foreground border-muted-foreground/10 hover:border-primary/40 hover:bg-primary/5"
                                                            )}
                                                        >
                                                            {rating}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="h-px bg-muted-foreground/5" />
                                        </div>
                                    ))}

                                    <div className="space-y-3 pt-4">
                                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Share evidences for your rating ({domain.id}) *</Label>
                                        <Textarea
                                            placeholder="Provide specific evidence observed mapping to the indicators above..."
                                            className="min-h-[100px] bg-muted/20 border-muted-foreground/10 p-4 focus:ring-4 focus:ring-primary/10 rounded-xl transition-all"
                                            value={formData.domains?.find(d => d.domainId === domain.id)?.evidence || ""}
                                            onChange={(e) => updateDomainEvidence(domain.id, e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Step 4: Routines, Tools & Strategies */}
                {step === 4 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 mb-8">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Settings className="w-8 h-8 text-primary" />
                                Routines, Tools & Strategies
                            </h2>
                            <p className="text-muted-foreground mt-2">Select all that were observed during the session.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-10">
                            {/* Classroom Routines */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2">
                                    <ClipboardCheck className="w-5 h-5 text-primary" />
                                    <h3 className="font-bold text-lg">Classroom Routines</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {dynamicRoutines.map((routine) => (
                                        <div
                                            key={routine}
                                            className={cn(
                                                "flex items-center space-x-3 p-3 rounded-xl border transition-all select-none",
                                                formData.routines?.includes(routine) ? "bg-primary/5 border-primary shadow-sm" : "hover:bg-muted/50 border-muted-foreground/10"
                                            )}
                                        >
                                            <Checkbox
                                                id={`routine-${routine}`}
                                                checked={formData.routines?.includes(routine)}
                                                onCheckedChange={(checked) => setMultiSelect("routines", routine, !!checked)}
                                            />
                                            <Label htmlFor={`routine-${routine}`} className="font-medium text-sm flex-1 cursor-pointer">{routine}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Culture Tools */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b-2 border-indigo-500/10 pb-2">
                                    <Star className="w-5 h-5 text-indigo-500" />
                                    <h3 className="font-bold text-lg">Culture Tools Observed</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {dynamicCultureTools.map((tool) => (
                                        <div
                                            key={tool}
                                            className={cn(
                                                "flex items-center space-x-3 p-3 rounded-xl border transition-all select-none",
                                                formData.cultureTools?.includes(tool) ? "bg-indigo-500/5 border-indigo-500 shadow-sm" : "hover:bg-muted/50 border-muted-foreground/10"
                                            )}
                                        >
                                            <Checkbox
                                                id={`culture-${tool}`}
                                                checked={formData.cultureTools?.includes(tool)}
                                                onCheckedChange={(checked) => setMultiSelect("cultureTools", tool, !!checked)}
                                            />
                                            <Label htmlFor={`culture-${tool}`} className="font-medium text-sm flex-1 cursor-pointer">{tool}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Instructional Tools */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b-2 border-emerald-500/10 pb-2">
                                    <Target className="w-5 h-5 text-emerald-500" />
                                    <h3 className="font-bold text-lg">Instructional Tools Observed</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {dynamicInstructionalTools.map((tool) => (
                                        <div
                                            key={tool}
                                            className={cn(
                                                "flex items-center space-x-3 p-3 rounded-xl border transition-all select-none",
                                                formData.instructionalTools?.includes(tool) ? "bg-emerald-500/5 border-emerald-500 shadow-sm" : "hover:bg-muted/50 border-muted-foreground/10"
                                            )}
                                        >
                                            <Checkbox
                                                id={`instructional-${tool}`}
                                                checked={formData.instructionalTools?.includes(tool)}
                                                onCheckedChange={(checked) => setMultiSelect("instructionalTools", tool, !!checked)}
                                            />
                                            <Label htmlFor={`instructional-${tool}`} className="font-medium text-sm flex-1 cursor-pointer">{tool}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Learning Area Tools */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b-2 border-orange-500/10 pb-2">
                                    <BookOpen className="w-5 h-5 text-orange-500" />
                                    <h3 className="font-bold text-lg">LA Tools Observed</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {dynamicLaTools.map((tool) => (
                                        <div
                                            key={tool}
                                            className={cn(
                                                "flex items-center space-x-3 p-3 rounded-xl border transition-all select-none",
                                                formData.learningAreaTools?.includes(tool) ? "bg-orange-500/5 border-orange-500 shadow-sm" : "hover:bg-muted/50 border-muted-foreground/10"
                                            )}
                                        >
                                            <Checkbox
                                                id={`la-tool-${tool}`}
                                                checked={formData.learningAreaTools?.includes(tool)}
                                                onCheckedChange={(checked) => setMultiSelect("learningAreaTools", tool, !!checked)}
                                            />
                                            <Label htmlFor={`la-tool-${tool}`} className="font-medium text-sm flex-1 cursor-pointer">{tool}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Feedback & Action Steps */}
                {step === 5 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-none shadow-xl">
                            <CardHeader className="bg-primary/5 rounded-t-xl py-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <MessageSquare className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Feedback & Action Steps</CardTitle>
                                        <CardDescription>Synthesizing the observation into growth points</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                <div className="space-y-6">
                                    <Label className="text-base font-bold">Have you met and discussed the observation with the teacher? *</Label>
                                    <RadioGroup
                                        className="flex gap-10"
                                        value={formData.discussionMet ? "yes" : "no"}
                                        onValueChange={(val) => updateField("discussionMet", val === "yes")}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="yes" id="met-yes" />
                                            <Label htmlFor="met-yes" className="font-bold cursor-pointer">Yes, discussed</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="no" id="met-no" />
                                            <Label htmlFor="met-no" className="font-bold cursor-pointer">No, yet to meet</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Feedback to the teacher *</Label>
                                    <Textarea
                                        placeholder="Summarize key strengths and areas observed..."
                                        className="min-h-[150px] bg-background text-base p-6 rounded-2xl border-muted-foreground/20 leading-relaxed shadow-sm focus:ring-4 focus:ring-primary/10 transition-all"
                                        value={formData.notes || ""}
                                        onChange={(e) => updateField("notes", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">One reflection shared by the teacher *</Label>
                                    <Textarea
                                        placeholder="What did the teacher share during your conversation?"
                                        className="min-h-[100px] bg-background text-base p-6 rounded-2xl border-muted-foreground/20 leading-relaxed shadow-sm focus:ring-4 focus:ring-primary/10 transition-all"
                                        value={formData.teacherReflection || ""}
                                        onChange={(e) => updateField("teacherReflection", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Action Step for the teacher *</Label>
                                    <Textarea
                                        placeholder="Specific, actionable next step for the educator..."
                                        className="min-h-[100px] bg-primary/5 text-base font-medium p-6 rounded-2xl border-primary/20 leading-relaxed shadow-sm focus:ring-4 focus:ring-primary/10 transition-all"
                                        value={formData.actionStep || ""}
                                        onChange={(e) => updateField("actionStep", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Anything else you’d like to share (optional)</Label>
                                    <Textarea
                                        placeholder="Internal notes or context..."
                                        className="min-h-[80px] bg-background rounded-xl border-muted-foreground/20"
                                        value={formData.additionalNotes || ""}
                                        onChange={(e) => updateField("additionalNotes", e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 6: Meta Tags */}
                {step === 6 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-none shadow-xl bg-background overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b py-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Tag className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold">Meta Tags – Areas for Improvement</CardTitle>
                                        <CardDescription className="text-base">Select the key tags that best reflect the feedback and action steps.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10 space-y-10">
                                <div className="p-6 bg-info/5 rounded-2xl border border-info/10 flex items-start gap-4 mb-4">
                                    <AlertCircle className="w-6 h-6 text-info mt-1" />
                                    <div>
                                        <p className="font-bold text-info">Insight Engine Integration</p>
                                        <p className="text-sm text-info/80">These tags power the analytics engine to identify recurring growth areas across teams and campuses.</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {META_TAGS.map(tag => (
                                        <Badge
                                            key={tag}
                                            variant={formData.metaTags?.includes(tag) ? "default" : "outline"}
                                            className={cn(
                                                "cursor-pointer px-5 py-3 rounded-2xl text-sm font-bold transition-all border-2",
                                                formData.metaTags?.includes(tag)
                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                    : "bg-background text-muted-foreground border-muted-foreground/10 hover:border-primary/40 hover:bg-primary/5"
                                            )}
                                            onClick={() => setMultiSelect("metaTags", tag, !formData.metaTags?.includes(tag))}
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="pt-10 border-t flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                                        <CheckCircle2 className="w-10 h-10 text-success" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">Ready to Submit</h3>
                                        <p className="text-muted-foreground max-w-md">Every single detail matters for the educator's growth journey. Thank you for your thorough documentation.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-6 z-30">
                    <div className="max-w-5xl mx-auto flex justify-between gap-4">
                        <div className="flex gap-3">
                            {step === 1 ? (
                                <Button variant="ghost" type="button" onClick={onCancel} className="h-14 px-8 text-base font-bold rounded-2xl">
                                    Discard
                                </Button>
                            ) : (
                                <Button variant="outline" type="button" onClick={handleBack} className="h-14 px-8 text-base font-bold rounded-2xl gap-2 border-2">
                                    <ChevronLeft className="w-5 h-5" /> Back
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-3">
                            {step < 6 ? (
                                <Button type="button" onClick={handleNext} className="h-14 px-10 text-base font-bold rounded-2xl gap-2 shadow-xl shadow-primary/25">
                                    Continue <ChevronRight className="w-5 h-5" />
                                </Button>
                            ) : (
                                <Button type="submit" className="h-14 px-12 text-base font-bold rounded-2xl gap-2 bg-success hover:bg-success/90 shadow-xl shadow-success/25">
                                    <Save className="w-6 h-6" /> Complete & Submit
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
