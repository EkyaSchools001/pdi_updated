import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Upload, CheckCircle2, User, BookOpen, Link as LinkIcon, Star, MessageSquare, Brain, FileText, Paperclip } from "lucide-react";
import { format } from "date-fns";

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
import { Slider } from "@/components/ui/slider";

const campuses = [
    "CMR NPS", "EITPL", "EBYR", "EJPN", "EBTM", "ENICE", "ENAVA",
    "PU BTM", "PU BYR", "PU HRBR", "PU ITPL", "PU NICE", "HO"
] as const;

const platforms = [
    "Coursera", "FutureLearn", "Khan Academy", "edX", "Alison", "Class Central", "Schoology", "Other"
] as const;

const formSchema = z.object({
    // Section 1: User Details
    email: z.string().email("Invalid email address"),
    name: z.string().min(2, "Name is required"),
    campus: z.enum(campuses, {
        required_error: "Please select a campus",
    }),

    // Section 2: Course Details
    courseName: z.string().min(3, "Course name is required"),
    hours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Please enter a valid number of hours",
    }),
    platform: z.enum(platforms, {
        required_error: "Please select a platform",
    }),
    otherPlatform: z.string().optional(),
    startDate: z.date({
        required_error: "Date of start is required",
    }).max(new Date(), "Date cannot be in the future"),
    endDate: z.date({
        required_error: "Date of end is required",
    }).max(new Date(), "Date cannot be in the future"),

    // Section 3: Certificate / Proof
    hasCertificate: z.enum(["yes", "no"], {
        required_error: "Please select an option",
    }),
    proofLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    certificateType: z.enum(["link", "file"]).optional(),
    certificateFile: z.string().optional(),
    certificateFileName: z.string().optional(),

    // Section 4: Reflection (Conditional)
    keyTakeaways: z.string().optional(),
    unansweredQuestions: z.string().optional(),
    enjoyedMost: z.string().optional(),

    // Section 5: Feedback
    effectivenessRating: z.array(z.number()).refine((val) => val.length === 1 && val[0] >= 1 && val[0] <= 10, {
        message: "Rating must be between 1 and 10",
    }),
    additionalFeedback: z.string().optional(),

    // Section 6: Supporting Documents (Optional)
    supportingDocType: z.enum(["link", "file"]).optional(),
    supportingDocLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    supportingDocFile: z.string().optional(),
    supportingDocFileName: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.platform === "Other" && !data.otherPlatform) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please specify the platform",
            path: ["otherPlatform"],
        });
    }

    if (data.hasCertificate === "yes") {
        if (!data.certificateType) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please select a proof type",
                path: ["certificateType"],
            });
        }
        if (data.certificateType === "link" && !data.proofLink) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please provide the certificate link",
                path: ["proofLink"],
            });
        }
        if (data.certificateType === "file" && !data.certificateFile) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please upload a certificate file",
                path: ["certificateFile"],
            });
        }
    }

    if (data.hasCertificate === "no") {
        if (!data.keyTakeaways) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "This field is mandatory as you don't have a certificate",
                path: ["keyTakeaways"],
            });
        }
        if (!data.unansweredQuestions) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "This field is mandatory as you don't have a certificate",
                path: ["unansweredQuestions"],
            });
        }
        if (!data.enjoyedMost) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "This field is mandatory as you don't have a certificate",
                path: ["enjoyedMost"],
            });
        }
    }

    if (data.supportingDocType === "link" && !data.supportingDocLink) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please provide the document link",
            path: ["supportingDocLink"],
        });
    }

    if (data.supportingDocType === "file" && !data.supportingDocFile) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please upload a file",
            path: ["supportingDocFile"], // This might need manual handling since it's not a standard input
        });
    }
});

interface MoocEvidenceFormProps {
    onCancel: () => void;
    onSubmitSuccess: () => void;
    userEmail?: string;
    userName?: string;
}

export function MoocEvidenceForm({ onCancel, onSubmitSuccess, userEmail = "", userName = "" }: MoocEvidenceFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: userEmail,
            name: userName,
            effectivenessRating: [5], // Default middle value
            hasCertificate: "yes",
            proofLink: "",
            otherPlatform: "",
            additionalFeedback: "",
            startDate: new Date(),
            endDate: new Date(),
            certificateType: "link",
            certificateFile: "",
            certificateFileName: "",
            supportingDocType: undefined,
            supportingDocLink: "",
            supportingDocFile: "",
            supportingDocFileName: "",
        },
    });

    const hasCertificate = form.watch("hasCertificate");
    const selectedPlatform = form.watch("platform");
    const certificateType = form.watch("certificateType");
    const supportingDocType = form.watch("supportingDocType");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: "supportingDocFile" | "certificateFile", fileNameField: "supportingDocFileName" | "certificateFileName") => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500 * 1024) { // 500KB limit
                toast.error("File size exceeds 500KB limit");
                e.target.value = ""; // Reset input
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                form.setValue(fieldName, base64String);
                form.setValue(fileNameField, file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    function handleSubmit(values: z.infer<typeof formSchema>) {
        console.log("Form Data:", values);

        // Save to localStorage
        try {
            const existingData = localStorage.getItem("mooc_submissions");
            const submissions = existingData ? JSON.parse(existingData) : [];
            const newSubmission = {
                id: Math.random().toString(36).substr(2, 9),
                submittedAt: new Date().toISOString(),
                ...values,
                // Ensure dates are strings for JSON storage
                startDate: values.startDate.toISOString(),
                endDate: values.endDate.toISOString()
            };

            submissions.push(newSubmission);
            localStorage.setItem("mooc_submissions", JSON.stringify(submissions));

            // Dispatch storage event for other components to listen
            window.dispatchEvent(new Event("mooc-submission-updated"));
        } catch (error) {
            console.error("Failed to save MOOC submission", error);
        }

        toast.success("MOOC Evidence Submitted Successfully!", {
            description: "Your professional development record has been updated.",
        });
        onSubmitSuccess();
    }

    function onInvalid(errors: any) {
        console.log("Form errors:", errors);
        toast.error("Please fill in all required fields correctly.");
    }

    return (
        <Card className="max-w-4xl mx-auto border-none shadow-none h-full overflow-y-auto">
            <CardHeader className="bg-primary/5 rounded-t-xl mb-6 border-b">
                <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                    <BookOpen className="w-6 h-6" />
                    AY 25-26 MOOC Evidence Form
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground mt-2 space-y-2">
                    <p className="font-semibold text-foreground">Congratulations! 🎉</p>
                    <p>We appreciate your commitment to learning and professional growth.</p>
                    <p>Please fill out this form to record your course completion. Read the MOOC Handout instructions carefully before submission.</p>
                    <p className="text-sm">For queries contact: <span className="text-primary font-medium">pdi@ekyaschools.com</span> via the ticketing system.</p>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit, onInvalid)} className="space-y-8 pb-8">

                        {/* Section 1: User Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground border-l-4 border-primary pl-3">
                                <User className="w-5 h-5 text-muted-foreground" />
                                Personal Details
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="your.email@ekyaschools.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter your full name" {...field} />
                                            </FormControl>
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
                            </div>
                        </div>

                        <Separator />

                        {/* Section 2: Course Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground border-l-4 border-primary pl-3">
                                <BookOpen className="w-5 h-5 text-muted-foreground" />
                                Course Details
                            </h3>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="courseName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name of Course *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter course title" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="hours"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Number of Hours *</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="Total course hours" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Date of Start *</FormLabel>
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
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Date of End *</FormLabel>
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
                                </div>

                                <FormField
                                    control={form.control}
                                    name="platform"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel>Platform *</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                                                >
                                                    {platforms.map((platform) => (
                                                        <FormItem key={platform} className="flex items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value={platform} />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer">
                                                                {platform}
                                                            </FormLabel>
                                                        </FormItem>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {selectedPlatform === "Other" && (
                                    <FormField
                                        control={form.control}
                                        name="otherPlatform"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Specify Platform *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter platform name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Section 3: Certificate / Proof */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground border-l-4 border-primary pl-3">
                                <LinkIcon className="w-5 h-5 text-muted-foreground" />
                                Certificate & Proof
                            </h3>
                            <FormField
                                control={form.control}
                                name="hasCertificate"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Do you have a completion certificate? *</FormLabel>
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

                            {hasCertificate === "yes" && (
                                <div className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="certificateType"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel>Proof Type</FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        className="flex gap-4"
                                                    >
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="link" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer">Drive Link</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="file" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer">File Upload</FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {certificateType === "link" && (
                                        <FormField
                                            control={form.control}
                                            name="proofLink"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Certificate / Proof Link *</FormLabel>
                                                    <FormDescription>
                                                        Upload certificate or final completion screenshot to Google Drive with "Anyone with link can view" access.
                                                    </FormDescription>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                            <Input className="pl-9" placeholder="https://drive.google.com/..." {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {certificateType === "file" && (
                                        <div className="space-y-2">
                                            <FormLabel>Upload Certificate (Max 500KB) *</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleFileChange(e, "certificateFile", "certificateFileName")}
                                                        className="cursor-pointer"
                                                    />
                                                </div>
                                            </FormControl>
                                            {form.watch("certificateFileName") && (
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <FileText className="w-3 h-3" />
                                                    Selected: {form.watch("certificateFileName")}
                                                </p>
                                            )}
                                            <FormMessage>
                                                {form.formState.errors.certificateFile?.message}
                                            </FormMessage>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Section 4: Supporting Documents (Optional) */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground border-l-4 border-primary pl-3">
                                <Paperclip className="w-5 h-5 text-muted-foreground" />
                                Supporting Documents <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                            </h3>
                            <FormField
                                control={form.control}
                                name="supportingDocType"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Attach additional evidence (e.g., project files, notes, screenshots)</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex gap-4"
                                            >
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="link" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Drive Link</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="file" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">File Upload</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {supportingDocType === "link" && (
                                <FormField
                                    control={form.control}
                                    name="supportingDocLink"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Document Link</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input className="pl-9" placeholder="https://..." {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {supportingDocType === "file" && (
                                <div className="space-y-2">
                                    <FormLabel>Upload File (Max 500KB)</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            onChange={(e) => handleFileChange(e, "supportingDocFile", "supportingDocFileName")}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                    {form.watch("supportingDocFileName") && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            Selected: {form.watch("supportingDocFileName")}
                                        </p>
                                    )}
                                    <FormMessage>
                                        {form.formState.errors.supportingDocFile?.message}
                                    </FormMessage>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Section 5: Reflection (Conditional) */}
                        {hasCertificate === "no" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <Separator />
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground border-l-4 border-warning pl-3">
                                    <Brain className="w-5 h-5 text-muted-foreground" />
                                    Reflection <span className="text-xs text-muted-foreground font-normal">(Required as no certificate is available)</span>
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="keyTakeaways"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Three Key Takeaways from the Course *</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="1. ...&#10;2. ...&#10;3. ..." className="min-h-[100px]" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="unansweredQuestions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Two Unanswered Questions After Learning *</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="1. ...&#10;2. ..." className="min-h-[80px]" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="enjoyedMost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>One Thing You Enjoyed Most *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Briefly describe what you enjoyed..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <Separator />



                        {/* Section 6: Feedback */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground border-l-4 border-primary pl-3">
                                <Star className="w-5 h-5 text-muted-foreground" />
                                Feedback
                            </h3>
                            <FormField
                                control={form.control}
                                name="effectivenessRating"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Course Effectiveness Rating (1-10)</FormLabel>
                                        <FormDescription className="flex justify-between text-xs">
                                            <span>1 = Not Effective</span>
                                            <span>10 = Extremely Effective</span>
                                        </FormDescription>
                                        <FormControl>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold w-6 text-center">{field.value[0]}</span>
                                                <Slider
                                                    min={1}
                                                    max={10}
                                                    step={1}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    className="flex-1"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="additionalFeedback"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Additional Feedback (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Any other thoughts about the course?" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Submit Evidence
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
