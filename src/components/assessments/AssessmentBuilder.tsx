import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assessmentService } from "@/services/assessmentService";
import { Plus, Trash2, X, Save, GripVertical } from 'lucide-react';
import { toast } from "sonner";

interface Question {
    prompt: string;
    type: 'MCQ' | 'TEXT';
    options: string[];
    correctAnswer: string;
    points: number;
}

export const AssessmentBuilder: React.FC<{
    onClose: () => void;
    onSave: () => void;
    editingAssessment?: any;
}> = ({ onClose, onSave, editingAssessment }) => {
    const [title, setTitle] = useState(editingAssessment?.title || "");
    const [description, setDescription] = useState(editingAssessment?.description || "");
    const [isTimed, setIsTimed] = useState(editingAssessment?.isTimed || false);
    const [timeLimit, setTimeLimit] = useState(editingAssessment?.timeLimitMinutes || 30);
    const [maxAttempts, setMaxAttempts] = useState(editingAssessment?.maxAttempts || 1);
    const [questions, setQuestions] = useState<Question[]>(
        editingAssessment?.questions?.map((q: any) => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        })) || [
            { prompt: "", type: "MCQ", options: ["", "", "", ""], correctAnswer: "", points: 1 }
        ]
    );

    const addQuestion = () => {
        setQuestions([...questions, { prompt: "", type: "MCQ", options: ["", "", "", ""], correctAnswer: "", points: 1 }]);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    const handleSave = async () => {
        if (!title) return toast.error("Title is required");
        try {
            const data = {
                title,
                description,
                type: editingAssessment?.type || 'CUSTOM',
                isTimed,
                timeLimitMinutes: isTimed ? Number(timeLimit) : null,
                maxAttempts: Number(maxAttempts),
                questions: questions.map(q => ({
                    ...q,
                    prompt: q.prompt.trim(),
                    options: q.options.map(opt => opt.trim()),
                    correctAnswer: q.correctAnswer.trim()
                }))
            };

            if (editingAssessment?.id) {
                await assessmentService.updateAssessment(editingAssessment.id, data);
                toast.success("Assessment updated!");
            } else {
                await assessmentService.createAssessment(data);
                toast.success("Assessment template created!");
            }
            onSave();
        } catch (error) {
            toast.error(editingAssessment?.id ? "Failed to update assessment" : "Failed to create assessment");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-zinc-50">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900">Assessment Builder</h2>
                        <p className="text-zinc-500 text-sm">Design your professional evaluation template</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="w-6 h-6" /></Button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="atitle" className="font-bold">Assessment Title</Label>
                                <Input id="atitle" placeholder="e.g., Annual Pedagogy Reflection" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="adesc" className="font-bold">Description</Label>
                                <Textarea id="adesc" placeholder="What is the goal of this assessment?" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px] rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-6 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="font-bold">Timed Assessment</Label>
                                    <p className="text-xs text-zinc-500">Enable automatic submission when time expires</p>
                                </div>
                                <Switch checked={isTimed} onCheckedChange={setIsTimed} />
                            </div>
                            {isTimed && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider">Time Limit (Minutes)</Label>
                                    <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="h-10 rounded-lg" />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider">Maximum Attempts</Label>
                                <Input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} className="h-10 rounded-lg" />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-zinc-100 pt-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <GripVertical className="w-5 h-5 text-zinc-300" />
                                Questions ({questions.length})
                            </h3>
                            <Button onClick={addQuestion} variant="outline" size="sm" className="gap-2 border-primary/20 text-primary">
                                <Plus className="w-4 h-4" /> Add Question
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {questions.map((q, qIdx) => (
                                <Card key={qIdx} className="border-2 border-zinc-50 shadow-sm overflow-hidden">
                                    <div className="bg-zinc-50 px-6 py-3 border-b flex justify-between items-center">
                                        <span className="font-bold text-zinc-400"># {qIdx + 1}</span>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-[10px] uppercase font-bold text-zinc-400">Points</Label>
                                                <Input
                                                    type="number"
                                                    value={q.points}
                                                    onChange={(e) => updateQuestion(qIdx, 'points', Number(e.target.value))}
                                                    className="h-8 w-16 bg-white rounded-lg text-center font-bold"
                                                    min={0}
                                                />
                                            </div>
                                            <Select value={q.type} onValueChange={(val: any) => updateQuestion(qIdx, 'type', val)}>
                                                <SelectTrigger className="h-8 w-[140px] bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MCQ">Multiple Choice</SelectItem>
                                                    <SelectItem value="TEXT">Short Answer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button variant="ghost" size="icon" className="text-red-400 h-8 w-8 hover:bg-red-50" onClick={() => removeQuestion(qIdx)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardContent className="p-6 space-y-4">
                                        <Input placeholder="Enter question prompt..." value={q.prompt} onChange={(e) => updateQuestion(qIdx, 'prompt', e.target.value)} className="text-lg font-medium border-none p-0 focus-visible:ring-0 placeholder:text-zinc-300" />

                                        {q.type === 'MCQ' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className={cn(
                                                        "flex gap-3 items-center p-3 rounded-xl border-2 transition-all group",
                                                        q.correctAnswer === opt && opt !== ""
                                                            ? "border-emerald-500 bg-emerald-50/50"
                                                            : "border-zinc-100 hover:border-zinc-200"
                                                    )}>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <input
                                                                type="radio"
                                                                id={`correct-${qIdx}-${optIdx}`}
                                                                name={`correct-${qIdx}`}
                                                                checked={q.correctAnswer === opt && opt !== ""}
                                                                onChange={() => updateQuestion(qIdx, 'correctAnswer', opt)}
                                                                className="w-5 h-5 accent-emerald-600 cursor-pointer"
                                                            />
                                                            <Label
                                                                htmlFor={`correct-${qIdx}-${optIdx}`}
                                                                className="text-[9px] font-bold uppercase text-zinc-400 group-hover:text-emerald-600 cursor-pointer transition-colors"
                                                            >
                                                                Correct
                                                            </Label>
                                                        </div>
                                                        <Input
                                                            placeholder={`Option ${optIdx + 1}`}
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newVal = e.target.value;
                                                                const oldVal = q.options[optIdx];
                                                                const newOpts = [...q.options];
                                                                newOpts[optIdx] = newVal;

                                                                // Update correctly if this was the correct answer
                                                                if (q.correctAnswer === oldVal && oldVal !== "") {
                                                                    const newQuestions = [...questions];
                                                                    newQuestions[qIdx] = {
                                                                        ...newQuestions[qIdx],
                                                                        options: newOpts,
                                                                        correctAnswer: newVal
                                                                    };
                                                                    setQuestions(newQuestions);
                                                                } else {
                                                                    updateQuestion(qIdx, 'options', newOpts);
                                                                }
                                                            }}
                                                            className="border-none bg-transparent focus-visible:ring-0 text-zinc-700 font-medium p-0 h-auto"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-zinc-50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Discard</Button>
                    <Button onClick={handleSave} className="gap-2 px-10">
                        <Save className="w-4 h-4" /> Save Template
                    </Button>
                </div>
            </div>
        </div>
    );
};
