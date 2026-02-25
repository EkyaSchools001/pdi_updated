import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form'; // Assuming react-hook-form is installed based on previous context
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SurveyQuestion } from '@/services/surveyService';
import { Loader2 } from 'lucide-react';

interface QuestionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<SurveyQuestion>) => Promise<void>;
    initialData?: SurveyQuestion;
}

type FormData = {
    questionText: string;
    questionType: 'short_text' | 'long_text' | 'rating_scale' | 'multiple_choice' | 'multi_select' | 'yes_no';
    options: string;
    isRequired: boolean;
    pageNumber: number;
    orderIndex?: number;
};

export const QuestionFormModal = ({ isOpen, onClose, onSubmit, initialData }: QuestionFormModalProps) => {
    const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
        defaultValues: {
            questionText: '',
            questionType: 'short_text',
            options: '',
            isRequired: true,
            pageNumber: 1
        }
    });

    const questionType = watch('questionType');

    useEffect(() => {
        if (isOpen && initialData) {
            setValue('questionText', initialData.questionText);
            setValue('questionType', initialData.questionType);
            setValue('isRequired', initialData.isRequired);
            setValue('pageNumber', initialData.pageNumber);

            // Format options from JSON string to generic string (comma separated or raw JSON) for editing
            // Or just keep it as string if the backend expects JSON string but user inputs manually?
            // Let's assume user inputs comma separated for multichoice, or we just show the raw JSON string if complex.
            // For simplicity, let's treat options as a string field that user edits directly (maybe comma separated for choices)

            let optionsVal = '';
            if (initialData.options) {
                try {
                    // Try to parse if it is an array and join with newline
                    const parsed = JSON.parse(initialData.options);
                    if (Array.isArray(parsed)) {
                        optionsVal = parsed.join('\n');
                    } else {
                        optionsVal = initialData.options;
                    }
                } catch {
                    optionsVal = initialData.options;
                }
            }
            setValue('options', optionsVal);
        } else if (isOpen) {
            reset({
                questionText: '',
                questionType: 'short_text',
                options: '',
                isRequired: true,
                pageNumber: 1
            });
        }
    }, [isOpen, initialData, setValue, reset]);

    const onFormSubmit = async (data: FormData) => {
        // Transform options back to JSON if needed
        let formattedOptions = undefined;
        if (['multiple_choice', 'multi_select'].includes(data.questionType) && data.options) {
            // Split by newline and filter empty
            const opts = data.options.split('\n').map(s => s.trim()).filter(Boolean);
            formattedOptions = opts; // Backend expects JSON string? Controller says: options: options ? JSON.stringify(options) : undefined
            // Wait, SurveyService types options as string (JSON string).
            // But my controller `createQuestion` takes `options` from body.
            // And stores it as `options: options ? JSON.stringify(options) : undefined`.
            // So if I send an array `['a', 'b']`, controller stringifies it to `'["a","b"]'`.
            // Correct.
        }

        await onSubmit({
            ...data,
            // @ts-ignore - formatting match
            options: formattedOptions // Service expects passed data to match what controller consumes before stringify?
            // Actually service says `createQuestion: async (surveyId: string, data: Omit<SurveyQuestion, 'id' | 'orderIndex'>)`
            // SurveyQuestion.options is `string` (JSON string).
            // But often in frontend->backend we send the object and backend stringifies, OR we stringify.
            // My controller implementation:
            // const { options } = req.body;
            // options: options ? JSON.stringify(options) : undefined
            // This implies `req.body.options` should be the JS Object/Array, NOT the string.
            // So I should send the Array.
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Question' : 'Add New Question'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="questionText">Question Text</Label>
                        <Textarea
                            id="questionText"
                            {...register('questionText', { required: 'Question text is required' })}
                            placeholder="Enter your question here..."
                        />
                        {errors.questionText && <p className="text-sm text-red-500">{errors.questionText.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="questionType">Type</Label>
                            <Select
                                onValueChange={(val: any) => setValue('questionType', val)}
                                defaultValue={watch('questionType')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="short_text">Short Text</SelectItem>
                                    <SelectItem value="long_text">Long Text</SelectItem>
                                    <SelectItem value="rating_scale">Rating (1-5)</SelectItem>
                                    <SelectItem value="yes_no">Yes/No</SelectItem>
                                    <SelectItem value="multiple_choice">Multiple Choice (Single)</SelectItem>
                                    <SelectItem value="multi_select">Multi-Select (Checkboxes)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pageNumber">Page Number</Label>
                            <Input
                                id="pageNumber"
                                type="number"
                                min={1}
                                {...register('pageNumber', { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    {['multiple_choice', 'multi_select'].includes(questionType) && (
                        <div className="space-y-2">
                            <Label htmlFor="options">Options (One per line)</Label>
                            <Textarea
                                id="options"
                                {...register('options')}
                                placeholder="Option 1&#10;Option 2&#10;Option 3"
                                rows={5}
                            />
                            <p className="text-xs text-muted-foreground">Enter each option on a new line.</p>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isRequired"
                            checked={watch('isRequired')}
                            onCheckedChange={(checked) => setValue('isRequired', checked)}
                        />
                        <Label htmlFor="isRequired">Required</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Question
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
