import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailedReflection, Observation, ReflectionSection } from "@/types/observation";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, Lock, Save, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReflectionFormProps {
    observation: Observation;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reflection: DetailedReflection) => void;
    teacherName: string; // Auto-captured
    teacherEmail: string; // Auto-captured
}

const SECTIONS_CONFIG = [
    {
        id: "planning",
        title: "Section A: Planning & Preparation (Live the Lesson)",
        indicators: [
            "Demonstrating Knowledge of Content and Pedagogy",
            "Demonstrating Knowledge of Students",
            "Demonstrating Knowledge of Resources",
            "Designing a Microplan",
            "Using Student Assessments"
        ]
    },
    {
        id: "classroomEnvironment",
        title: "Section B1: Classroom Practice (Care about Culture)",
        indicators: [
            "Creating an Environment of Respect and Rapport",
            "Establishing a Culture for Learning",
            "Managing Classroom Procedures",
            "Managing Student Behaviour"
        ]
    },
    {
        id: "instruction",
        title: "Section B2: Classroom Practice (Instruct to Inspire)",
        indicators: [
            "Communicating with Students",
            "Using Questioning and Discussion Techniques and Learning Tools",
            "Engages in Student Learning",
            "Demonstrating Flexibility and Responsiveness"
        ]
    },
    {
        id: "assessment",
        title: "Section B3: Classroom Practice (Authentic Assessments)",
        indicators: [
            "Using Assessments in Instruction"
        ]
    },
    {
        id: "environment",
        title: "Section B4: Classroom Practice (Engaging Environment)",
        indicators: [
            "Organizing Physical Space",
            "Cleanliness",
            "Use of Boards"
        ]
    },
    {
        id: "professionalism",
        title: "Section C: Professional Practice",
        indicators: [
            "Reflecting on Teaching",
            "Maintaining Accurate Records",
            "Communicating with Families",
            "Participating in a Professional Community",
            "Growing and Developing Professionally"
        ]
    }
];

export function ReflectionForm({ observation, isOpen, onClose, onSubmit, teacherName, teacherEmail }: ReflectionFormProps) {
    const [step, setStep] = useState(0); // 0 to SECTIONS_CONFIG.length + 1 (Final questions)

    // Initial empty state
    const [formData, setFormData] = useState<DetailedReflection>({
        teacherName,
        teacherEmail,
        submissionDate: new Date().toISOString(),
        sections: {
            planning: { id: "planning", title: "Section A: Planning & Preparation", ratings: [], evidence: "" },
            classroomEnvironment: { id: "classroomEnvironment", title: "Section B1: Care about Culture", ratings: [], evidence: "" },
            instruction: { id: "instruction", title: "Section B2: Instruct to Inspire", ratings: [], evidence: "" },
            assessment: { id: "assessment", title: "Section B3: Authentic Assessments", ratings: [], evidence: "" },
            environment: { id: "environment", title: "Section B4: Engaging Environment", ratings: [], evidence: "" },
            professionalism: { id: "professionalism", title: "Section C: Professional Practice", ratings: [], evidence: "" }
        },
        strengths: "",
        improvements: "",
        goal: "",
        comments: ""
    });

    const handleRatingChange = (sectionId: keyof DetailedReflection["sections"], indicator: string, value: string) => {
        setFormData(prev => {
            const section = prev.sections[sectionId];
            const existingRatingIndex = section.ratings.findIndex(r => r.indicator === indicator);
            const newRatings = [...section.ratings];

            if (existingRatingIndex >= 0) {
                newRatings[existingRatingIndex] = { indicator, rating: value as any };
            } else {
                newRatings.push({ indicator, rating: value as any });
            }

            return {
                ...prev,
                sections: {
                    ...prev.sections,
                    [sectionId]: { ...section, ratings: newRatings }
                }
            };
        });
    };

    const handleEvidenceChange = (sectionId: keyof DetailedReflection["sections"], value: string) => {
        setFormData(prev => ({
            ...prev,
            sections: {
                ...prev.sections,
                [sectionId]: { ...prev.sections[sectionId], evidence: value }
            }
        }));
    };

    const validateCurrentStep = () => {
        if (step < SECTIONS_CONFIG.length) {
            const config = SECTIONS_CONFIG[step];
            const sectionKey = config.id as keyof DetailedReflection["sections"];
            const sectionData = formData.sections[sectionKey];

            // Check all ratings filled
            const missingRatings = config.indicators.filter(ind => !sectionData.ratings.find(r => r.indicator === ind));
            if (missingRatings.length > 0) {
                toast.error(`Please rate all indicators in ${config.title}`);
                return false;
            }

            // Check evidence filled
            if (!sectionData.evidence || sectionData.evidence.trim().length === 0) {
                toast.error(`Please provide evidence for ${config.title}`);
                return false;
            }
            return true;
        } else {
            // Validate final questions
            if (!formData.strengths || !formData.improvements || !formData.goal) {
                toast.error("Please answer all mandatory reflection questions");
                return false;
            }
            return true;
        }
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleFinalSubmit = () => {
        if (validateCurrentStep()) {
            onSubmit(formData);
            onClose();
        }
    };

    const currentSectionConfig = SECTIONS_CONFIG[step];
    const isFinalStep = step === SECTIONS_CONFIG.length;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b bg-muted/10 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                Teacher Reflection Form
                                <span className="text-sm font-normal text-muted-foreground ml-2 px-2 py-0.5 rounded-full bg-muted border">
                                    Observation #{observation.id}
                                </span>
                            </DialogTitle>
                            <DialogDescription>
                                Ekya Danielson Framework • {teacherName}
                            </DialogDescription>
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                            Step {step + 1} of {SECTIONS_CONFIG.length + 1}
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-muted rounded-full mt-4 overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${((step + 1) / (SECTIONS_CONFIG.length + 1)) * 100}%` }}
                        />
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-6">
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {/* Locked Info Header */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/20 border text-sm">
                            <div>
                                <span className="block text-xs font-bold text-muted-foreground uppercase">Teacher</span>
                                <span className="font-medium">{teacherName}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-muted-foreground uppercase">Observer</span>
                                <span className="font-medium">{observation.observerName || "N/A"}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-muted-foreground uppercase">Date</span>
                                <span className="font-medium">{observation.date}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-muted-foreground uppercase">Domain</span>
                                <span className="font-medium">{observation.domain}</span>
                            </div>
                        </div>

                        {!isFinalStep ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg">
                                        {String.fromCharCode(65 + step)}
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">{currentSectionConfig.title}</h2>
                                </div>

                                <div className="space-y-6">
                                    {currentSectionConfig.indicators.map((indicator, idx) => {
                                        const sectionKey = currentSectionConfig.id as keyof DetailedReflection["sections"];
                                        const currentRating = formData.sections[sectionKey].ratings.find(r => r.indicator === indicator)?.rating;

                                        return (
                                            <div key={idx} className="space-y-4 pb-4 border-b border-muted/40 last:border-0">
                                                <h3 className="text-base font-semibold text-foreground">{indicator}</h3>
                                                <RadioGroup
                                                    value={currentRating}
                                                    onValueChange={(val) => handleRatingChange(sectionKey, indicator, val)}
                                                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                                                >
                                                    {["Basic", "Developing", "Effective", "Highly Effective"].map((option, optIdx) => (
                                                        <div key={option} className="relative">
                                                            <RadioGroupItem value={option} id={`${indicator}-${option}`} className="peer sr-only" />
                                                            <Label
                                                                htmlFor={`${indicator}-${option}`}
                                                                className="flex flex-col items-center justify-center h-24 rounded-xl border-2 bg-background cursor-pointer transition-all hover:bg-muted/50 hover:border-primary/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-sm"
                                                            >
                                                                <div className="flex gap-0.5 mb-2">
                                                                    {[...Array(4)].map((_, i) => (
                                                                        <Star
                                                                            key={i}
                                                                            className={cn(
                                                                                "w-4 h-4",
                                                                                i <= optIdx
                                                                                    ? "fill-primary text-primary"
                                                                                    : "fill-muted/20 text-muted-foreground/20"
                                                                            )}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <span className="text-sm font-medium peer-data-[state=checked]:text-primary text-muted-foreground">{option}</span>
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="space-y-3 pt-4">
                                    <Label className="text-base font-bold flex items-center gap-2">
                                        Evidence <span className="text-destructive">*</span>
                                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">Required</span>
                                    </Label>
                                    <Textarea
                                        placeholder={`Share evidences for your rating in ${currentSectionConfig.title}...`}
                                        className="min-h-[150px] text-base p-4 resize-none focus:ring-4 focus:ring-primary/10 transition-shadow"
                                        value={formData.sections[currentSectionConfig.id as keyof DetailedReflection["sections"]].evidence}
                                        onChange={(e) => handleEvidenceChange(currentSectionConfig.id as keyof DetailedReflection["sections"], e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">Reflection & Commitments</h2>
                                </div>

                                <Card className="border-none shadow-lg bg-primary/5">
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="space-y-3">
                                            <Label htmlFor="strengths" className="font-bold">What are your strengths? <span className="text-destructive">*</span></Label>
                                            <Textarea
                                                id="strengths"
                                                placeholder="Identify areas where you excelled..."
                                                className="bg-background"
                                                value={formData.strengths}
                                                onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="improvements" className="font-bold">What are your areas of improvement? <span className="text-destructive">*</span></Label>
                                            <Textarea
                                                id="improvements"
                                                placeholder="Identify areas for growth..."
                                                className="bg-background"
                                                value={formData.improvements}
                                                onChange={(e) => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="goal" className="font-bold">What goal would you like to set for yourself? <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="goal"
                                                placeholder="Define a SMART goal..."
                                                className="bg-background h-12"
                                                value={formData.goal}
                                                onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="comments">Anything else you’d like to share? (Optional)</Label>
                                            <Textarea
                                                id="comments"
                                                placeholder="Additional context or feedback..."
                                                className="bg-background"
                                                value={formData.comments}
                                                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex items-center gap-2 p-4 rounded-lg bg-orange-50 text-orange-800 border-l-4 border-orange-500 text-sm">
                                    <Lock className="w-4 h-4 shrink-0" />
                                    <p>Once submitted, this reflection is locked and shared with your school leader. You cannot edit it afterwards.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t bg-background shrink-0 gap-2 sm:justify-between">
                    <Button variant="ghost" onClick={step === 0 ? onClose : handleBack} disabled={false}>
                        {step === 0 ? "Cancel" : "Back"}
                    </Button>
                    <Button onClick={isFinalStep ? handleFinalSubmit : handleNext} className={cn("gap-2", isFinalStep && "bg-success hover:bg-success/90 text-white")}>
                        {isFinalStep ? (
                            <>Simulate Submit <Save className="w-4 h-4" /></>
                        ) : (
                            <>Next Section <ChevronRight className="w-4 h-4" /></>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
