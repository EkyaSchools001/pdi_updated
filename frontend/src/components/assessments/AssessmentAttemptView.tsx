import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { assessmentService, Assessment, AssessmentAttempt } from "@/services/assessmentService";
import { useParams, useNavigate } from 'react-router-dom';
import { Timer, Send, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { toast } from "sonner";

export const AssessmentAttemptView: React.FC = () => {
    const { assessmentId } = useParams<{ assessmentId: string }>();
    const navigate = useNavigate();

    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (assessmentId) startAssessment(assessmentId);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [assessmentId]);

    const startAssessment = async (id: string) => {
        try {
            const newAttempt = await assessmentService.startAttempt(id);
            setAttempt(newAttempt);

            // Get assessment details (could be part of attempt response or separate call)
            // For now, assuming we need to fetch assignments to find this one or directly fetch by ID
            const data = await assessmentService.getMyAssignments();
            const found = data.assignments.find((a: any) => a.assessment.id === id)?.assessment;
            setAssessment(found);

            if (found.isTimed && found.timeLimitMinutes) {
                setTimeLeft(found.timeLimitMinutes * 60);
            }

            if (newAttempt.answers) {
                setAnswers(JSON.parse(newAttempt.answers));
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to start assessment");
            navigate('/teacher/courses/assessments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => (prev !== null ? prev - 1 : null));
            }, 1000);
        } else if (timeLeft === 0) {
            handleSubmit();
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [timeLeft]);

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => {
            const newAnswers = { ...prev, [questionId]: value };
            // Auto-save progress every answer
            if (attempt) assessmentService.saveProgress(attempt.id, newAnswers);
            return newAnswers;
        });
    };

    const handleSubmit = async () => {
        if (!attempt) return;
        try {
            await assessmentService.submitAttempt(attempt.id, answers);
            toast.success("Assessment submitted successfully!");
            navigate('/teacher/courses/assessments');
        } catch (error) {
            toast.error("Failed to submit assessment");
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading || !assessment || !attempt) return <div className="p-8 text-center text-zinc-500">Initializing environment...</div>;

    const questions = assessment.questions || [];
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-0">
            {/* Header / Timer */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900 text-white p-6 rounded-2xl shadow-xl">
                <div>
                    <h2 className="text-2xl font-bold">{assessment.title}</h2>
                    <p className="text-zinc-400 text-sm">Question {currentQuestionIndex + 1} of {questions.length}</p>
                </div>

                {timeLeft !== null && (
                    <div className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 ${timeLeft < 60 ? 'border-red-500 bg-red-500/10 text-red-500 animate-pulse' : 'border-primary/20 bg-primary/10 text-primary'}`}>
                        <Timer className="w-5 h-5" />
                        <span className="text-2xl font-mono font-bold">{formatTime(timeLeft)}</span>
                    </div>
                )}
            </div>

            <Progress value={progress} className="h-2" />

            {/* Question Card */}
            <Card className="border-none shadow-2xl min-h-[400px] flex flex-col">
                <CardHeader>
                    <CardTitle className="text-xl leading-relaxed">
                        {currentQuestionIndex + 1}. {currentQuestion.prompt}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    {currentQuestion.type === 'MULTI_SELECT' ? (
                        <div className="space-y-4">
                            {(Array.isArray(currentQuestion.options) ? currentQuestion.options : JSON.parse((currentQuestion.options as any) || '[]')).map((option: string, idx: number) => {
                                let selected: string[] = [];
                                try {
                                    selected = answers[currentQuestion.id] || [];
                                    if (typeof selected === 'string') selected = JSON.parse(selected);
                                    if (!Array.isArray(selected)) selected = [];
                                } catch {
                                    selected = [];
                                }

                                return (
                                    <div key={idx} className="flex items-center space-x-3 p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                        <input
                                            type="checkbox"
                                            id={`q-${currentQuestion.id}-opt-${idx}`}
                                            checked={selected.includes(option)}
                                            onChange={(e) => {
                                                const next = e.target.checked
                                                    ? [...selected, option]
                                                    : selected.filter(o => o !== option);
                                                handleAnswerChange(currentQuestion.id, next);
                                            }}
                                            className="w-5 h-5 accent-primary cursor-pointer"
                                        />
                                        <Label htmlFor={`q-${currentQuestion.id}-opt-${idx}`} className="flex-1 cursor-pointer font-medium leading-none">
                                            {option}
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    ) : currentQuestion.type === 'MCQ' ? (
                        <RadioGroup
                            value={answers[currentQuestion.id]}
                            onValueChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                            className="space-y-4"
                        >
                            {(Array.isArray(currentQuestion.options) ? currentQuestion.options : JSON.parse((currentQuestion.options as any) || '[]')).map((option: string, idx: number) => (
                                <div key={idx} className="flex items-center space-x-3 p-4 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                    <RadioGroupItem value={option} id={`q-${currentQuestion.id}-opt-${idx}`} />
                                    <Label htmlFor={`q-${currentQuestion.id}-opt-${idx}`} className="flex-1 cursor-pointer font-medium leading-none">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    ) : (
                        <Textarea
                            placeholder="Type your answer here..."
                            className="min-h-[200px] text-lg rounded-xl"
                            value={answers[currentQuestion.id] || ''}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        />
                    )}
                </CardContent>
                <CardFooter className="flex justify-between p-6 bg-zinc-50 border-t rounded-b-2xl">
                    <Button
                        variant="outline"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        className="gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <Button onClick={handleSubmit} className="gap-2 px-8 bg-emerald-600 hover:bg-emerald-700">
                            Submit Assessment <Send className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="gap-2"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <div className="flex justify-center gap-2 flex-wrap">
                {questions.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${currentQuestionIndex === idx
                            ? 'bg-primary text-white scale-110 shadow-lg'
                            : answers[questions[idx].id]
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                            }`}
                    >
                        {idx + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};
