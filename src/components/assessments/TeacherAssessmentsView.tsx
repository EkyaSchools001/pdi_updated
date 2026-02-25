import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { assessmentService, Assessment, AssessmentAttempt } from "@/services/assessmentService";
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { PageHeader } from "../layout/PageHeader";

export const TeacherAssessmentsView: React.FC = () => {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await assessmentService.getMyAssignments();
            setAssignments(data.assignments || []);
            setAttempts(data.attempts || []);
        } catch (error) {
            console.error("Error fetching assessments:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatus = (assessmentId: string) => {
        const attempt = attempts.find(a => a.assessmentId === assessmentId);
        if (!attempt) return { label: 'Not Started', color: 'bg-zinc-100 text-zinc-800' };
        if (attempt.status === 'SUBMITTED') return { label: 'Completed', color: 'bg-emerald-100 text-emerald-800', score: attempt.score };
        return { label: 'In Progress', color: 'bg-blue-100 text-blue-800' };
    };

    // Analytics calculations
    const submittedAttempts = attempts.filter(a => a.status === 'SUBMITTED');
    const avgScore = submittedAttempts.length > 0
        ? submittedAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / submittedAttempts.length
        : 0;

    const academicPreparednessAttempt = attempts.find(a =>
        assignments.find(as => as.assessmentId === a.assessmentId)?.assessment?.type === 'PREPAREDNESS' &&
        a.status === 'SUBMITTED'
    );

    const postOrientationAttempt = attempts.find(a =>
        assignments.find(as => as.assessmentId === a.assessmentId)?.assessment?.type === 'POST_ORIENTATION' &&
        a.status === 'SUBMITTED'
    );

    const completionRate = assignments.length > 0
        ? (submittedAttempts.length / assignments.length) * 100
        : 0;

    if (loading) return <div className="p-8 text-center text-zinc-400 font-medium">Loading assessments...</div>;

    return (
        <div className="space-y-8 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none shadow-md bg-zinc-900 text-white rounded-2xl overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-zinc-400 text-sm font-medium">Average Score</span>
                        </div>
                        <div className="text-3xl font-bold">{Math.round(avgScore)}%</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-zinc-500 text-sm font-medium">Completion Rate</span>
                        </div>
                        <div className="text-3xl font-bold text-zinc-900">{Math.round(completionRate)}%</div>
                        <div className="text-[10px] text-zinc-400 mt-1">{submittedAttempts.length} of {assignments.length} Completed</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden opacity-90">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-zinc-500 text-sm font-medium">Acad. Preparedness</span>
                        </div>
                        <div className="text-3xl font-bold text-zinc-900">
                            {academicPreparednessAttempt ? `${Math.round(academicPreparednessAttempt.score || 0)}%` : '--'}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1">{academicPreparednessAttempt ? 'Completed' : 'Not Attempted'}</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl overflow-hidden opacity-90">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                            <span className="text-zinc-500 text-sm font-medium">Post-Orientation</span>
                        </div>
                        <div className="text-3xl font-bold text-zinc-900">
                            {postOrientationAttempt ? `${Math.round(postOrientationAttempt.score || 0)}%` : '--'}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1">{postOrientationAttempt ? 'Completed' : 'Not Attempted'}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    Assigned Assessments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map((assignment: any) => {
                        const assessment = assignment.assessment;
                        const status = getStatus(assessment.id);

                        return (
                            <Card key={assignment.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
                                <div className="h-2 bg-zinc-100 group-hover:bg-primary transition-colors" />
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge className={`${status.color} rounded-lg border-none`}>{status.label}</Badge>
                                        {status.score !== undefined && (
                                            <div className="flex flex-col items-end">
                                                <div className="text-sm font-black text-primary">Score: {Math.round(status.score)}%</div>
                                                <span className="text-[9px] text-zinc-400">Final Result</span>
                                            </div>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">{assessment.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">{assessment.description || 'Professional assessment'}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 rounded-md">
                                            <ClipboardList className="w-3.5 h-3.5" />
                                            {assessment.questions?.length || 0} Questions
                                        </div>
                                        {assessment.isTimed && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 rounded-md">
                                                <Clock className="w-3.5 h-3.5" />
                                                {assessment.timeLimitMinutes} mins
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        className={`w-full gap-2 h-12 rounded-xl transition-all ${status.label === 'Completed' ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-100 cursor-default' : 'bg-primary hover:scale-[1.02]'}`}
                                        disabled={status.label === 'Completed'}
                                        onClick={() => navigate(`/teacher/courses/assessments/attempt/${assessment.id}`)}
                                    >
                                        {status.label === 'Completed' ? (
                                            <><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Finished</>
                                        ) : (
                                            <><PlayCircle className="w-5 h-5" /> {status.label === 'In Progress' ? 'Continue Attempt' : 'Start Assessment'}</>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {assignments.length === 0 && (
                        <Card className="col-span-full border-dashed border-2 bg-zinc-50/50 p-16 text-center rounded-3xl">
                            <CardContent className="space-y-3">
                                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="w-8 h-8 text-zinc-300" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900">No Pending Assessments</h3>
                                <p className="text-zinc-500 max-w-xs mx-auto">You've completed all professional assessments assigned to you. Great job!</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

// Add missing imports
import { TrendingUp, CheckCircle2 } from 'lucide-react';
