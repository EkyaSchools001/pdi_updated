import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useEffect } from "react";
import { templateService } from "@/services/templateService";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const DEFAULT_CAMPUSES = [
    "CMR NPS", "EJPN", "EITPL", "EBTM", "EBYR", "ENICE", "ENAVA", "PU BTM", "PU BYR", "PU HRBR", "PU ITPL",
];

const DEFAULT_PILLARS = [
    "Live the Lesson", "Authentic Assessments", "Instruct to Inspire", "Care about Culture", "Engaging Environment", "Professional Practice",
];

const formSchema = z.object({
    educatorName: z.string().min(1, "Educator name is required"),
    coachName: z.string().min(1, "Coach name is required"),
    campus: z.string().min(1, "Please select a campus"),
    dateOfGoalSetting: z.date({
        required_error: "Date is required",
    }).max(new Date(), "Date cannot be in the future"),

    // Readiness
    awareOfProcess: z.enum(["yes", "no"], {
        required_error: "This question is mandatory",
    }),
    awareOfFramework: z.enum(["yes", "no"], {
        required_error: "This question is mandatory",
    }),
    reflectionCompleted: z.enum(["yes", "no"], {
        required_error: "This question is mandatory",
    }).refine((val) => val === "yes", {
        message: "Educator self-reflection must be completed before setting goals",
    }),
    evidenceProvided: z.enum(["yes", "no"], {
        required_error: "This question is mandatory",
    }),

    // Goal Setting
    goalForYear: z.string().min(10, "Please provide a detailed goal"),
    reasonForGoal: z.string().min(10, "Please explain the reason for this goal"),
    actionStep: z.string().min(10, "Please provide the first action step"),
    goalEndDate: z.date({
        required_error: "Target end date is required",
    }).min(new Date(), "End date must be in the future"),
    pillarTag: z.string().min(1, "Please select a pillar"),
    additionalNotes: z.string().optional(),
    teacherEmail: z.string().email("Invalid email address").optional(),
});

interface GoalSettingFormProps {
    onSubmit: (data: z.infer<typeof formSchema>) => void;
    defaultCoachName?: string;
    onCancel: () => void;
    teachers: { id: string; name: string; email?: string }[];
    initialData?: Partial<z.infer<typeof formSchema>>;
}

export function GoalSettingForm({ onSubmit, defaultCoachName = "", onCancel, teachers, initialData = {} }: GoalSettingFormProps) {
    const [campuses, setCampuses] = useState(DEFAULT_CAMPUSES);
    const [pillars, setPillars] = useState(DEFAULT_PILLARS);

    useEffect(() => {
        const loadTemplate = async () => {
            try {
                const templates = await templateService.getAllTemplates('GOAL');
                const defaultTemplate = templates.find(t => t.isDefault) || templates[0];
                if (defaultTemplate && defaultTemplate.structure) {
                    const campusField = defaultTemplate.structure.find((f: any) => f.id === 'campus');
                    const pillarField = defaultTemplate.structure.find((f: any) => f.id === 'pillarTag');
                    if (campusField?.options) setCampuses(campusField.options);
                    if (pillarField?.options) setPillars(pillarField.options);
                }
            } catch (error) {
                console.error("Failed to load GOAL template", error);
            }
        };
        loadTemplate();
    }, []);

    const form = useForm<any>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            coachName: defaultCoachName,
            educatorName: "",
            teacherEmail: "",
            additionalNotes: "",
            ...initialData,
        },
    });

    function handleSubmit(values: z.infer<typeof formSchema>) {
        onSubmit(values);
        // form.reset(); // Don't reset if we want to show success state or redirect
    }

    return (
        <Card className="max-w-4xl mx-auto border-none shadow-none">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">AY 25–26 Goal Setting Form – Master</CardTitle>
                <CardDescription className="text-base text-muted-foreground mt-2">
                    Please use the following form to set goals for educators.
                    The goal setting window is from 12 May 2025 – 28 June 2025.
                    Prior to goal setting, educators should have completed their self-reflection.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">

                        {/* Section 1: Context */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">1</span>
                                <h3 className="text-lg font-semibold text-foreground">Educator & Context Details</h3>
                            </div>
                            <Separator />

                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="educatorName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name of the Educator *</FormLabel>
                                            <Select
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    const selectedTeacher = teachers.find(t => t.name === value);
                                                    if (selectedTeacher?.email) {
                                                        form.setValue("teacherEmail", selectedTeacher.email);
                                                    }
                                                }}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select educator" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {teachers.map((t) => (
                                                        <SelectItem key={t.id || t.name} value={t.name}>
                                                            {t.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="teacherEmail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teacher Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Teacher email" {...field} readOnly className="bg-muted" />
                                            </FormControl>
                                            <FormDescription>Auto-populated based on selection</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="coachName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name of the Coach *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter coach name" {...field} />
                                            </FormControl>
                                            <FormDescription>Who did the Goal Setting?</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="campus"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Campus *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select campus" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {campuses.map((campus) => (
                                                        <SelectItem key={campus} value={campus}>
                                                            {campus}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dateOfGoalSetting"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Date of Goal Setting Conversation *</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date("1900-01-01")
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="goalEndDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Goal Target End Date *</FormLabel>
                                            <FormDescription>By when should this goal be achieved?</FormDescription>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a target date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date < new Date()
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Section 2: Readiness */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">2</span>
                                <h3 className="text-lg font-semibold text-foreground">Readiness on Goal Setting Process</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">Please rate the readiness for the goal setting process below.</p>
                            <Separator />

                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="awareOfProcess"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3 bg-muted/30 p-4 rounded-lg">
                                            <FormLabel>Was the teacher informed and aware of the goal setting process? *</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="flex gap-4"
                                                >
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="yes" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Yes</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="no" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">No</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="awareOfFramework"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3 bg-muted/30 p-4 rounded-lg">
                                            <FormLabel>Was the teacher informed and aware about the Ekya Danielson Framework? *</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="flex gap-4"
                                                >
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="yes" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Yes</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="no" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">No</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="reflectionCompleted"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3 bg-muted/30 p-4 rounded-lg">
                                            <FormLabel>Did the teacher complete her self-reflection on Ekya Danielson Form? *</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="flex gap-4"
                                                >
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="yes" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Yes</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="no" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">No</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="evidenceProvided"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3 bg-muted/30 p-4 rounded-lg">
                                            <FormLabel>Did the teacher provide evidence for her rating and reflection? *</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="flex gap-4"
                                                >
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="yes" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Yes</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="no" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">No</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Section 3: Goal Process */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">3</span>
                                <h3 className="text-lg font-semibold text-foreground">Goal Setting Process</h3>
                            </div>
                            <Separator />

                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="goalForYear"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Goal for the Academic Year *</FormLabel>
                                            <FormDescription>Define the primary focus for AY 25–26</FormDescription>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter the primary goal..."
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="reasonForGoal"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reason for the Goal *</FormLabel>
                                            <FormDescription>Why is this goal the most important goal for the teacher?</FormDescription>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Explain your reasoning..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="actionStep"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Action Step *</FormLabel>
                                            <FormDescription>What is the first action step for the teacher towards the goal?</FormDescription>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Define the first action step..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />


                                <FormField
                                    control={form.control}
                                    name="pillarTag"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pillar Tag *</FormLabel>
                                            <FormDescription>This goal can be categorised under which pillar?</FormDescription>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a pillar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {pillars.map((pillar) => (
                                                        <SelectItem key={pillar} value={pillar}>
                                                            {pillar}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="additionalNotes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Anything else you'd like to share (Optional)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Additional notes..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 sticky bottom-6 bg-background/95 backdrop-blur-sm p-4 border rounded-xl shadow-lg">
                            <Button type="button" variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="min-w-[150px]"
                                onClick={() => {
                                    if (!form.formState.isValid) {
                                        const errors = form.formState.errors;
                                        const errorCount = Object.keys(errors).length;
                                        if (errorCount > 0) {
                                            toast.error(`Please fix the ${errorCount} errors in the form before submitting.`);
                                            console.log("Form errors:", errors);
                                        }
                                    }
                                }}
                            >
                                Submit Goal
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
