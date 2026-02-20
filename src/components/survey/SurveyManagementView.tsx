import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Survey, SurveyQuestion, surveyService } from '@/services/surveyService';
import { Edit, Trash2, Plus, GripVertical, Save } from 'lucide-react';
import { QuestionFormModal } from './QuestionFormModal';
import { toast } from 'sonner';

interface SurveyManagementViewProps {
    survey: Survey;
    onUpdate: () => void; // Callback to refresh data
}

export const SurveyManagementView = ({ survey, onUpdate }: SurveyManagementViewProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | undefined>(undefined);
    const [isUpdating, setIsUpdating] = useState(false);

    // Sort questions by page and order
    const sortedQuestions = [...survey.questions].sort((a, b) => {
        if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
        return a.orderIndex - b.orderIndex;
    });

    const handleAdd = () => {
        setEditingQuestion(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (q: SurveyQuestion) => {
        setEditingQuestion(q);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question? This will delete all collected answers for this question.')) return;

        try {
            await surveyService.deleteQuestion(id);
            toast.success('Question deleted');
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete question');
        }
    };

    const handleSave = async (data: Partial<SurveyQuestion>) => {
        try {
            if (editingQuestion) {
                await surveyService.updateQuestion(editingQuestion.id, data);
                toast.success('Question updated');
            } else {
                // @ts-ignore - Data structure match
                await surveyService.createQuestion(survey.id, data);
                toast.success('Question added');
            }
            setIsModalOpen(false);
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save question');
        }
    };

    const handleSurveyMetaUpdate = async (field: string, value: any) => {
        try {
            await surveyService.updateSurvey(survey.id, { [field]: value });
            toast.success('Survey updated');
            onUpdate();
        } catch (error) {
            toast.error('Failed to update survey');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Survey Settings</CardTitle>
                            <CardDescription>Manage general survey settings</CardDescription>
                        </div>
                        <Badge variant={survey.isActive ? 'default' : 'secondary'}>
                            {survey.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Quick toggle for active status */}
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="font-medium">Status</span>
                            <Button
                                variant={survey.isActive ? "destructive" : "default"}
                                size="sm"
                                onClick={() => handleSurveyMetaUpdate('isActive', !survey.isActive)}
                            >
                                {survey.isActive ? 'Deactivate Survey' : 'Activate Survey'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Questions ({sortedQuestions.length})</h3>
                <Button onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-2" /> Add Question
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead className="w-[80px]">Page</TableHead>
                                <TableHead>Question</TableHead>
                                <TableHead className="w-[150px]">Type</TableHead>
                                <TableHead className="w-[80px]">Req</TableHead>
                                <TableHead className="w-[120px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedQuestions.map((q, idx) => (
                                <TableRow key={q.id}>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell>{q.pageNumber}</TableCell>
                                    <TableCell className="font-medium">
                                        <div className="line-clamp-2">{q.questionText}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                            {q.questionType.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {q.isRequired && <Badge variant="secondary" className="text-xs">Req</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(q)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(q.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sortedQuestions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No questions found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <QuestionFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSave}
                initialData={editingQuestion}
            />
        </div>
    );
};
