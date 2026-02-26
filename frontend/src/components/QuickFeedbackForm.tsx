import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Users, BookOpen, Target, Settings, MessageSquare, Tag,
    ChevronLeft, ChevronRight, Save, Eye, CheckCircle2,
    AlertCircle, Sparkles, ClipboardCheck, Layout, Star,
    Check, ChevronsUpDown, Search, PenTool, ClipboardList, TrendingUp
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Observation } from "@/types/observation";

interface QuickFeedbackFormProps {
    onSubmit: (observation: Partial<Observation>) => void;
    onCancel: () => void;
    initialData?: Partial<Observation>;
    teachers?: { id: string; name: string; email?: string }[];
}

const META_TAG_OPTIONS = [
    "Knowledge of Content and Pedagogy", "Knowledge of Students",
    "Knowledge of Resources", "Designing A Microplan", "Using Student Assessments",
    "Creating an Environment of Respect and Rapport", "Establishing a Culture for Learning",
    "Managing Classroom Procedures", "Managing Student behaviour",
    "Communicating with Students", "Using Questioning and Discussion Techniques and Learning Tools",
    "Using Assessment in Instruction", "Organizing Physical Space", "Cleanliness", "Use of Boards",
    "Reflecting on Teaching", "Maintaining Accurate Records", "Communicating with Families",
    "Participating in a Professional Community", "Growing and Developing Professionally"
];

const TOOL_OPTIONS = [
    "321 Affirmations", "All Eyes on Me", "Brain Breaks (any 2)", "Brainstorming",
    "Catch a Bubble (EY-2)", "Choral Call", "Circle Time (EY-2)", "Circulate",
    "Cold Call", "Concept Map", "Countdown", "Do Now", "Entry Ticket", "Exit Ticket",
    "Find somebody who", "Give me Five (EY-2)", "Glow & Grow", "Good Things",
    "Grounding", "Hand Signals", "Help Now Strategies", "HoH - Care", "HoH - Grit",
    "I use to Think/Now I Know", "KWL", "Mingle", "Morning Greetings", "Parking Lot",
    "Post the Plan", "Put on your Thinking Cap (Grades EY - 4)", "Quick Draw - Quick Write",
    "Resourcing", "Round Table Discussion", "Shift & Stay", "Show Call",
    "Social Contract", "T-Chart", "Talking sticks", "Think-Pair-Share", "Timeout",
    "Tracking", "Turn & Talk", "Wait Time"
];

const ROUTINE_OPTIONS = [
    "Arrival Routine", "Attendance Routine", "Class Cleaning Routines",
    "Collection Routine", "Departure Routine", "Grouping Routine",
    "Lining Up Strategies"
];

const OBSERVER_ROLES = [
    "Academic Coordinator", "CCA Coordinator", "Head of School",
    "ELC Team Member", "PDI Team Member", "Other"
];

const BLOCKS = [
    "Early Years", "Primary", "Middle", "Senior", "Specialist"
];

export function QuickFeedbackForm({ onSubmit, onCancel, initialData = {}, teachers }: QuickFeedbackFormProps) {
    const [step, setStep] = useState(1);
    const [openTeacher, setOpenTeacher] = useState(false);
    const [formData, setFormData] = useState({
        teacherId: initialData.teacherId || "",
        teacher: initialData.teacher || "",
        teacherEmail: initialData.teacherEmail || "",
        observerName: initialData.observerName || "",
        observerRole: initialData.observerRole || "",
        date: initialData.date || new Date().toISOString().split('T')[0],
        block: initialData.classroom?.block || "",
        grade: initialData.classroom?.grade || "",
        learningArea: initialData.classroom?.learningArea || "",
        glows: initialData.strengths || "",
        grows: initialData.areasOfGrowth || "",
        actionStep: initialData.actionSteps || "",
        metaTags: (initialData as any).metaTags || [],
        tools: (initialData as any).tools || [],
        routines: (initialData as any).routines || [],
        otherComment: (initialData as any).otherComment || "",
        otherRole: "",
        otherTool: "",
        otherRoutine: ""
    });

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleSelection = (field: string, value: string) => {
        setFormData(prev => {
            const current = (prev as any)[field] || [];
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter((i: string) => i !== value) };
            } else {
                return { ...prev, [field]: [...current, value] };
            }
        });
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = () => {
        const finalData: Partial<Observation> = {
            teacherId: formData.teacherId,
            teacher: formData.teacher,
            teacherEmail: formData.teacherEmail,
            observerName: formData.observerName,
            observerRole: formData.observerRole === "Other" ? formData.otherRole : formData.observerRole,
            date: formData.date,
            classroom: {
                block: formData.block,
                grade: formData.grade,
                learningArea: formData.learningArea,
                section: "" // Not explicitly requested in the text block but usually part of grade
            },
            strengths: formData.glows,
            areasOfGrowth: formData.grows,
            actionSteps: formData.actionStep,
            metaTags: formData.metaTags,
            tools: formData.tools,
            routines: formData.routines,
            otherComment: formData.otherComment,
            status: "Submitted",
            score: 0 // Quick feedback might not have a score, or we compute one later
        } as any;

        onSubmit(finalData);
    };

    return (
        <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-background/60 backdrop-blur-xl overflow-hidden rounded-[2.5rem]">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b p-8">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                            <MessageSquare className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tight">Quick Feedback Master</CardTitle>
                            <CardDescription className="text-base font-medium">AY 25-26 Academic Observation Loop</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-primary/10">
                        <div className="flex gap-1">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={cn(
                                        "h-2 w-8 rounded-full transition-all duration-500",
                                        step === s ? "bg-primary w-12" : "bg-primary/20"
                                    )}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-primary ml-2">Step {step} of 3</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-8">
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" /> Teacher Name *
                                </Label>
                                <Popover open={openTeacher} onOpenChange={setOpenTeacher}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            disabled={!!initialData.teacherId}
                                            className={cn("w-full h-12 justify-between border-muted-foreground/20 rounded-xl text-base", !!initialData.teacherId && "bg-slate-50 text-muted-foreground")}
                                        >
                                            {formData.teacher || "Select Teacher"}
                                            {!initialData.teacherId && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search teacher..." />
                                            <CommandEmpty>No teacher found.</CommandEmpty>
                                            <CommandGroup>
                                                {teachers?.map((t) => (
                                                    <CommandItem
                                                        key={t.id}
                                                        value={t.name}
                                                        onSelect={() => {
                                                            updateField("teacher", t.name);
                                                            updateField("teacherId", t.id);
                                                            updateField("teacherEmail", t.email);
                                                            setOpenTeacher(false);
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", formData.teacherId === t.id ? "opacity-100" : "opacity-0")} />
                                                        {t.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-primary" /> Teacher Email ID *
                                </Label>
                                <Input
                                    value={formData.teacherEmail}
                                    onChange={(e) => updateField("teacherEmail", e.target.value)}
                                    readOnly={!!initialData.teacherEmail}
                                    className={cn("h-12 text-base rounded-xl border-muted-foreground/20", !!initialData.teacherEmail && "bg-slate-50 text-muted-foreground")}
                                    placeholder="Enter email"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    Observer's Name *
                                </Label>
                                <Input
                                    value={formData.observerName}
                                    onChange={(e) => updateField("observerName", e.target.value)}
                                    className="h-12 text-base rounded-xl border-muted-foreground/20"
                                    placeholder="Your Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    Observation Date *
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => updateField("date", e.target.value)}
                                    className="h-12 text-base rounded-xl border-muted-foreground/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Observer's Role *</Label>
                            <RadioGroup
                                value={formData.observerRole}
                                onValueChange={(v) => updateField("observerRole", v)}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                {OBSERVER_ROLES.map((role) => (
                                    <Label
                                        key={role}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                            formData.observerRole === role ? "border-primary bg-primary/5 shadow-md" : "border-muted-foreground/10 hover:border-primary/30"
                                        )}
                                    >
                                        <RadioGroupItem value={role} className="sr-only" />
                                        <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", formData.observerRole === role ? "border-primary" : "border-muted-foreground/30")}>
                                            {formData.observerRole === role && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                        </div>
                                        <span className="font-bold">{role}</span>
                                    </Label>
                                ))}
                            </RadioGroup>
                            {formData.observerRole === "Other" && (
                                <Input
                                    placeholder="Specify your role"
                                    value={formData.otherRole}
                                    onChange={(e) => updateField("otherRole", e.target.value)}
                                    className="mt-4 h-12 rounded-xl border-muted-foreground/20"
                                />
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-4">
                            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Layout className="w-5 h-5 text-primary" /> Classroom Block *
                            </Label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {BLOCKS.map((block) => (
                                    <Button
                                        key={block}
                                        variant={formData.block === block ? "default" : "outline"}
                                        onClick={() => updateField("block", block)}
                                        className={cn(
                                            "h-14 rounded-xl font-bold transition-all duration-300",
                                            formData.block === block ? "shadow-lg shadow-primary/20 scale-105" : "border-muted-foreground/20"
                                        )}
                                    >
                                        {block}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    Grade (Enter the grade and section) *
                                </Label>
                                <Input
                                    placeholder="e.g., Grade 5 - Emerald"
                                    value={formData.grade}
                                    onChange={(e) => updateField("grade", e.target.value)}
                                    className="h-12 text-base rounded-xl border-muted-foreground/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    Learning Area *
                                </Label>
                                <Input
                                    placeholder="e.g., Mathematics"
                                    value={formData.learningArea}
                                    onChange={(e) => updateField("learningArea", e.target.value)}
                                    className="h-12 text-base rounded-xl border-muted-foreground/20"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
                        <section className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-3 pt-4">
                                    <Label className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Sparkles className="w-5 h-5" /> Glows: What worked well in the classroom? *
                                    </Label>
                                    <Textarea
                                        value={formData.glows}
                                        onChange={(e) => updateField("glows", e.target.value)}
                                        className="min-h-[120px] text-base rounded-[1.5rem] border-muted-foreground/20 focus:ring-primary/20 bg-primary/[0.02]"
                                        placeholder="Identify specific strengths observed..."
                                    />
                                </div>
                                <div className="space-y-3 pt-4">
                                    <Label className="text-sm font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" /> Grows: What could have been better? *
                                    </Label>
                                    <Textarea
                                        value={formData.grows}
                                        onChange={(e) => updateField("grows", e.target.value)}
                                        className="min-h-[120px] text-base rounded-[1.5rem] border-muted-foreground/20 focus:ring-indigo-500/20 bg-indigo-500/[0.02]"
                                        placeholder="Suggest areas for improvement..."
                                    />
                                </div>
                                <div className="space-y-3 pt-4">
                                    <Label className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                        <Target className="w-5 h-5" /> Action Step *
                                    </Label>
                                    <Textarea
                                        value={formData.actionStep}
                                        onChange={(e) => updateField("actionStep", e.target.value)}
                                        className="min-h-[100px] text-base rounded-[1.5rem] border-muted-foreground/20 focus:ring-emerald-500/20 bg-emerald-500/[0.02]"
                                        placeholder="Specific, actionable step for the teacher..."
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6 pt-6">
                            <div className="p-6 rounded-[2rem] bg-slate-950 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                                <Label className="text-sm font-black uppercase tracking-[0.2em] text-primary-foreground/70 mb-6 block flex items-center gap-2">
                                    <Tag className="w-5 h-5" /> Meta Tags: Areas for Improvement
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {META_TAG_OPTIONS.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant={formData.metaTags.includes(tag) ? "default" : "outline"}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-300",
                                                formData.metaTags.includes(tag) ? "bg-primary text-white scale-105 shadow-lg shadow-primary/20" : "hover:bg-primary/20 hover:text-white border-primary/20"
                                            )}
                                            onClick={() => toggleSelection("metaTags", tag)}
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6 pt-6">
                            <Label className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <PenTool className="w-5 h-5" /> Select all the tools you saw in action
                            </Label>
                            <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto p-2 scrollbar-hide">
                                {TOOL_OPTIONS.map((tool) => (
                                    <Badge
                                        key={tool}
                                        variant={formData.tools.includes(tool) ? "default" : "outline"}
                                        className={cn(
                                            "px-4 py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all duration-300",
                                            formData.tools.includes(tool) ? "bg-primary text-white scale-105 shadow-lg shadow-primary/20" : "hover:bg-primary/10 border-muted-foreground/20"
                                        )}
                                        onClick={() => toggleSelection("tools", tool)}
                                    >
                                        {tool}
                                    </Badge>
                                ))}
                                <Badge
                                    variant={formData.tools.includes("Other") ? "default" : "outline"}
                                    className={cn(
                                        "px-4 py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all duration-300",
                                        formData.tools.includes("Other") ? "bg-primary text-white scale-105 shadow-lg shadow-primary/20" : "hover:bg-primary/10 border-muted-foreground/20"
                                    )}
                                    onClick={() => toggleSelection("tools", "Other")}
                                >
                                    Other
                                </Badge>
                                {formData.tools.includes("Other") && (
                                    <Input
                                        placeholder="Specify other tool"
                                        value={formData.otherTool}
                                        onChange={(e) => updateField("otherTool", e.target.value)}
                                        className="w-full mt-2 rounded-xl"
                                    />
                                )}
                            </div>
                        </section>

                        <section className="space-y-6 pt-6">
                            <Label className="text-sm font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5" /> Select all the routines you observed
                            </Label>
                            <div className="flex flex-wrap gap-4">
                                {ROUTINE_OPTIONS.map((routine) => (
                                    <Label
                                        key={routine}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200",
                                            formData.routines.includes(routine) ? "border-indigo-500 bg-indigo-500/5" : "border-muted-foreground/10 hover:border-indigo-500/30"
                                        )}
                                    >
                                        <Checkbox
                                            checked={formData.routines.includes(routine)}
                                            onCheckedChange={() => toggleSelection("routines", routine)}
                                            className="w-5 h-5 rounded-lg data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                        />
                                        <span className="font-bold">{routine}</span>
                                    </Label>
                                ))}
                                <Label
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200",
                                        formData.routines.includes("Other") ? "border-indigo-500 bg-indigo-500/5" : "border-muted-foreground/10 hover:border-indigo-500/30"
                                    )}
                                >
                                    <Checkbox
                                        checked={formData.routines.includes("Other")}
                                        onCheckedChange={() => toggleSelection("routines", "Other")}
                                        className="w-5 h-5 rounded-lg data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                    />
                                    <span className="font-bold">Other</span>
                                </Label>
                                {formData.routines.includes("Other") && (
                                    <Input
                                        placeholder="Specify other routine"
                                        value={formData.otherRoutine}
                                        onChange={(e) => updateField("otherRoutine", e.target.value)}
                                        className="w-full mt-2 rounded-xl"
                                    />
                                )}
                            </div>
                        </section>

                        <section className="space-y-4 pt-6">
                            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                Anything else you'd like to share
                            </Label>
                            <Textarea
                                value={formData.otherComment}
                                onChange={(e) => updateField("otherComment", e.target.value)}
                                className="min-h-[100px] text-base rounded-[1.5rem] border-muted-foreground/20 focus:ring-primary/20"
                                placeholder="Additional notes or observations..."
                            />
                        </section>
                    </div>
                )}
            </CardContent>

            <div className="p-8 bg-muted/30 border-t flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={step === 1 ? onCancel : handleBack}
                    className="h-14 px-8 rounded-2xl text-base font-bold bg-background/50 hover:bg-background shadow-sm border border-muted-foreground/10"
                >
                    {step === 1 ? "Cancel" : "Previous Step"}
                </Button>

                {step < 3 ? (
                    <Button
                        size="lg"
                        onClick={handleNext}
                        disabled={step === 1 && (!formData.teacherId || !formData.observerName || !formData.observerRole)}
                        className="h-14 px-10 rounded-2xl text-base font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95 group"
                    >
                        Next Section
                        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        className="h-14 px-10 rounded-2xl text-base font-black shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 transition-all active:scale-95 group"
                    >
                        Complete Feedback Loop
                        <CheckCircle2 className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                    </Button>
                )}
            </div>
        </Card>
    );
}
