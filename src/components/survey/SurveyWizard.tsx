import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { surveyService, Survey, SurveyQuestion } from '@/services/surveyService';

interface SurveyWizardProps {
    survey: Survey;
    initialAnswers?: any[];
    onComplete: () => void;
}

const QuestionRenderer = ({ question }: { question: SurveyQuestion }) => {
    const { register, setValue, watch, formState: { errors } } = useFormContext();
    const answerKey = `answers.${question.id}`;
    const error = errors.answers?.[question.id];

    let options: any = null;
    try {
        options = question.options ? JSON.parse(question.options) : null;
    } catch (e) {
        console.error("Error parsing options", e);
    }

    const currentVal = watch(answerKey);

    // Common wrapper for error message
    const ErrorMsg = () => error ? <p className="text-red-500 text-sm mt-1">This field is required</p> : null;

    switch (question.questionType) {
        case 'short_text':
            return (
                <div className="space-y-2 mb-6">
                    <Label>{question.questionText} {question.isRequired && <span className="text-red-500">*</span>}</Label>
                    <Input
                        {...register(answerKey, { required: question.isRequired })}
                        placeholder="Your answer"
                    />
                    <ErrorMsg />
                </div>
            );
        case 'long_text':
            return (
                <div className="space-y-2 mb-6">
                    <Label>{question.questionText} {question.isRequired && <span className="text-red-500">*</span>}</Label>
                    <Textarea
                        {...register(answerKey, { required: question.isRequired })}
                        placeholder="Your answer"
                        className="min-h-[100px]"
                    />
                    <ErrorMsg />
                </div>
            );
        case 'multiple_choice':
            return (
                <div className="space-y-2 mb-6">
                    <Label>{question.questionText} {question.isRequired && <span className="text-red-500">*</span>}</Label>
                    <RadioGroup
                        onValueChange={(val) => setValue(answerKey, val, { shouldValidate: true })}
                        defaultValue={currentVal}
                    >
                        {Array.isArray(options) && options.map((opt: string) => (
                            <div key={opt} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt} id={`${question.id}-${opt}`} />
                                <Label htmlFor={`${question.id}-${opt}`}>{opt}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                    {/* Hidden input for validation */}
                    <input
                        type="hidden"
                        {...register(answerKey, { required: question.isRequired })}
                    />
                    <ErrorMsg />
                </div>
            );
        case 'multi_select':
            return (
                <div className="space-y-2 mb-6">
                    <Label>{question.questionText} {question.isRequired && <span className="text-red-500">*</span>}</Label>
                    <div className="grid grid-cols-1 gap-2">
                        {Array.isArray(options) && options.map((opt: string) => (
                            <div key={opt} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${question.id}-${opt}`}
                                    checked={Array.isArray(currentVal) && currentVal.includes(opt)}
                                    onCheckedChange={(checked) => {
                                        const current = Array.isArray(currentVal) ? currentVal : [];
                                        if (checked) {
                                            setValue(answerKey, [...current, opt], { shouldValidate: true });
                                        } else {
                                            setValue(answerKey, current.filter((v: string) => v !== opt), { shouldValidate: true });
                                        }
                                    }}
                                />
                                <Label htmlFor={`${question.id}-${opt}`}>{opt}</Label>
                            </div>
                        ))}
                    </div>
                    <input
                        type="hidden"
                        {...register(answerKey, { required: question.isRequired, validate: v => !question.isRequired || (v && v.length > 0) })}
                    />
                    <ErrorMsg />
                </div>
            );
        case 'rating_scale':
            const min = options?.min || 1;
            const max = options?.max || 5;
            const range = Array.from({ length: max - min + 1 }, (_, i) => i + min);

            return (
                <div className="space-y-2 mb-6">
                    <Label>{question.questionText} {question.isRequired && <span className="text-red-500">*</span>}</Label>
                    <div className="flex items-center gap-4">
                        {options?.lowLabel && <span className="text-sm text-muted-foreground">{options.lowLabel}</span>}
                        <div className="flex gap-2">
                            {range.map((val) => (
                                <Button
                                    key={val}
                                    type="button"
                                    variant={currentVal == val ? "default" : "outline"}
                                    className="w-10 h-10 rounded-full p-0"
                                    onClick={() => setValue(answerKey, val, { shouldValidate: true })}
                                >
                                    {val}
                                </Button>
                            ))}
                        </div>
                        {options?.highLabel && <span className="text-sm text-muted-foreground">{options.highLabel}</span>}
                    </div>
                    <input
                        type="hidden"
                        {...register(answerKey, { required: question.isRequired })}
                    />
                    <ErrorMsg />
                </div>
            );
        case 'yes_no':
            return (
                <div className="space-y-2 mb-6">
                    <Label>{question.questionText} {question.isRequired && <span className="text-red-500">*</span>}</Label>
                    <RadioGroup
                        onValueChange={(val) => setValue(answerKey, val, { shouldValidate: true })}
                        defaultValue={currentVal}
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Yes" id={`${question.id}-yes`} />
                            <Label htmlFor={`${question.id}-yes`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="No" id={`${question.id}-no`} />
                            <Label htmlFor={`${question.id}-no`}>No</Label>
                        </div>
                    </RadioGroup>
                    <input
                        type="hidden"
                        {...register(answerKey, { required: question.isRequired })}
                    />
                    <ErrorMsg />
                </div>
            );

        default:
            return null;
    }
};

export const SurveyWizard = ({ survey, initialAnswers, onComplete }: SurveyWizardProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Group questions by page
    const questionsByPage = survey.questions.reduce((acc, q) => {
        if (!acc[q.pageNumber]) acc[q.pageNumber] = [];
        acc[q.pageNumber].push(q);
        return acc;
    }, {} as Record<number, SurveyQuestion[]>);

    const totalPages = Object.keys(questionsByPage).length;

    const methods = useForm({
        defaultValues: {
            answers: initialAnswers?.reduce((acc, ans) => {
                // Convert backend answer format to form format
                if (ans.answerNumeric) acc[ans.questionId] = ans.answerNumeric;
                else if (ans.answerJson) acc[ans.questionId] = JSON.parse(ans.answerJson);
                else acc[ans.questionId] = ans.answerText;
                return acc;
            }, {}) || {}
        }
    });

    const { handleSubmit, trigger, getValues } = methods;

    const handleNext = async () => {
        // Validate current page fields
        const currentPageQuestions = questionsByPage[currentPage] || [];
        const fieldsToValidate = currentPageQuestions.map(q => `answers.${q.id}`);
        const isValid = await trigger(fieldsToValidate as any);

        if (isValid) {
            // Auto-save progress logic could go here
            setCurrentPage(prev => Math.min(prev + 1, totalPages));
            window.scrollTo(0, 0);
        }
    };

    const handlePrev = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
        window.scrollTo(0, 0);
    };

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            // Transform data back to backend format
            const formattedAnswers = Object.keys(data.answers).map(qId => {
                const val = data.answers[qId];
                const q = survey.questions.find(q => q.id === qId);

                if (!q) return null;

                const ansObj: any = { questionId: qId };

                if (q.questionType === 'rating_scale') {
                    ansObj.answerNumeric = Number(val);
                } else if (q.questionType === 'multi_select') {
                    ansObj.answerJson = JSON.stringify(val);
                } else {
                    ansObj.answerText = String(val);
                }
                return ansObj;
            }).filter(Boolean);

            await surveyService.submitSurvey(survey.id, formattedAnswers, true);
            toast.success("Survey submitted successfully!");
            onComplete();
        } catch (err) {
            console.error(err);
            toast.error("Failed to submit survey");
        } finally {
            setIsSubmitting(false);
        }
    };

    const progress = (currentPage / totalPages) * 100;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-muted-foreground">Step {currentPage} of {totalPages}</div>
                        <div className="w-1/3 h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">{survey.title}</CardTitle>
                    <CardDescription>{survey.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormProvider {...methods}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="mt-4">
                                {questionsByPage[currentPage]?.map(q => (
                                    <QuestionRenderer key={q.id} question={q} />
                                ))}
                            </div>

                            <div className="flex justify-between mt-8 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handlePrev}
                                    disabled={currentPage === 1 || isSubmitting}
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                                </Button>

                                {currentPage < totalPages ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={isSubmitting}
                                    >
                                        Next <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit Survey
                                    </Button>
                                )}
                            </div>
                        </form>
                    </FormProvider>
                </CardContent>
            </Card>
        </div>
    );
};
