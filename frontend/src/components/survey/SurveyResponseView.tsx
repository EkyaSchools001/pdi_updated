import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, RefreshCcw } from 'lucide-react';
import { Survey, SurveyResponse, surveyService } from '@/services/surveyService';
import { useNavigate } from 'react-router-dom';

interface SurveyResponseViewProps {
    survey: Survey;
    response: SurveyResponse;
    onEdit?: () => void;
}

export const SurveyResponseView = ({ survey, response, onEdit }: SurveyResponseViewProps) => {
    const navigate = useNavigate();
    console.log("SurveyResponseView survey:", survey);
    console.log("SurveyResponseView response:", response);

    // Helper to find question text
    const getQuestion = (qId: string) => survey.questions?.find(q => q.id === qId);

    // Helper to format answer
    const formatAnswer = (ans: any) => {
        if (ans.answerText) return ans.answerText;
        if (ans.answerNumeric) return ans.answerNumeric;
        if (ans.answerJson) {
            try {
                const parsed = JSON.parse(ans.answerJson);
                if (Array.isArray(parsed)) return parsed.join(', ');
                return ans.answerJson;
            } catch {
                return ans.answerJson;
            }
        }
        return <span className="text-muted-foreground italic">No answer provided</span>;
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onEdit || (() => navigate(-1))} className="gap-2">
                    {onEdit ? <RefreshCcw className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    {onEdit ? "Submit New Response" : "Back to Dashboard"}
                </Button>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {response.isCompleted ? 'Completed' : 'Draft'}
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{survey.title}</CardTitle>
                    <CardDescription>
                        Submitted on {new Date(response.submittedAt).toLocaleDateString()} at {new Date(response.submittedAt).toLocaleTimeString()}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {survey.questions?.sort((a, b) => a.orderIndex - b.orderIndex).map((q) => {
                        const answer = response.answers.find(a => a.questionId === q.id);
                        return (
                            <div key={q.id} className="border-b pb-4 last:border-0">
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">
                                    Q{q.orderIndex}. {q.questionText}
                                </h4>
                                <div className="text-base font-medium">
                                    {answer ? formatAnswer(answer) : <span className="text-muted-foreground">-</span>}
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
};
