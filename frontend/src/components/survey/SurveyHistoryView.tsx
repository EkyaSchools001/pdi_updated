import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Calendar, ArrowLeft } from 'lucide-react';
import { surveyService, SurveyResponse } from '@/services/surveyService';
import { format } from 'date-fns';

interface SurveyHistoryViewProps {
    onViewResponse: (response: SurveyResponse) => void;
    onBack: () => void;
}

export const SurveyHistoryView = ({ onViewResponse, onBack }: SurveyHistoryViewProps) => {
    const [responses, setResponses] = useState<SurveyResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await surveyService.getMyHistory();
                setResponses(data);
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack} size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">My Survey History</h2>
                    <p className="text-muted-foreground">View all your submitted professional development surveys.</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Survey Title</TableHead>
                                <TableHead>Academic Year</TableHead>
                                <TableHead>Term</TableHead>
                                <TableHead>Submitted Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {responses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No submitted surveys found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                responses.map((response) => (
                                    <TableRow key={response.id}>
                                        <TableCell className="font-medium">{(response as any).survey?.title || 'Untitled Survey'}</TableCell>
                                        <TableCell>{(response as any).survey?.academicYear}</TableCell>
                                        <TableCell>{(response as any).survey?.term}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                {response.submittedAt ? format(new Date(response.submittedAt), 'PPP') : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                                                Completed
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewResponse(response)}
                                            >
                                                <Eye className="h-3 w-3 mr-2" /> View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
