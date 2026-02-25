import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Target, Search, FileText, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DynamicForm } from '@/components/DynamicForm';
import { GoalSettingForm } from '@/components/GoalSettingForm';

export function AdminGoalsView() {
    const [goals, setGoals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isGoalSettingOpen, setIsGoalSettingOpen] = useState(true);

    const [selectedGoal, setSelectedGoal] = useState<any>(null);
    const [settingText, setSettingText] = useState("");
    const [reflectionText, setReflectionText] = useState("");
    const [completionText, setCompletionText] = useState("");
    const [goalTemplate, setGoalTemplate] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("master");

    useEffect(() => {
        fetchGoals();
        fetchSettings();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await api.get('/goals');
            if (res.data.status === 'success') {
                setGoals(res.data.data.goals || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            // Mocking setting fetch for now
            setIsGoalSettingOpen(true);

            // Fetch template
            const response = await api.get('/templates');
            if (response.data?.status === 'success') {
                const templates = response.data.data.templates || [];
                const activeResponse = templates.find((t: any) => t.type === 'GOAL' && (t.isDefault || t.status === 'Active' || !t.status));
                if (activeResponse) {
                    let parsedStructure = [];
                    try {
                        parsedStructure = typeof activeResponse.structure === 'string'
                            ? JSON.parse(activeResponse.structure)
                            : activeResponse.structure;
                    } catch (e) {
                        parsedStructure = [];
                    }
                    setGoalTemplate({ ...activeResponse, fields: parsedStructure });
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleWindow = async (checked: boolean) => {
        setIsGoalSettingOpen(checked);
        if (checked) {
            try {
                await api.post('/goals/notify-window-open');
                toast.success("Goal setting window opened and teachers notified.");
            } catch (e) {
                toast.error("Failed to notify teachers.");
            }
        } else {
            toast.success("Goal setting window is now closed.");
        }
    };

    const handleAdminUpdate = async () => {
        if (!selectedGoal) return;
        try {
            await api.patch(`/goals/${selectedGoal.id}`, {
                goalSettingForm: JSON.stringify({ text: settingText }),
                selfReflectionForm: JSON.stringify({ text: reflectionText }),
                goalCompletionForm: JSON.stringify({ text: completionText }),
            });
            toast.success(`Goal forms manually updated for ${selectedGoal.teacher}.`);
            setSelectedGoal(null);
            fetchGoals();
        } catch (err) {
            toast.error("Failed to update goal forms.");
        }
    };

    // Group goals by campus (or fallback)
    const campusStats = React.useMemo(() => {
        const grouped = goals.reduce((acc, goal) => {
            const campus = goal.campus || "Unassigned";
            if (!acc[campus]) {
                acc[campus] = { totalGoals: 0, reflectionFilled: 0, settingFilled: 0, completed: 0 };
            }
            acc[campus].totalGoals += 1;
            if (goal.selfReflectionForm) acc[campus].reflectionFilled += 1;
            if (goal.goalSettingForm) acc[campus].settingFilled += 1;
            if (goal.status === "COMPLETED") acc[campus].completed += 1;
            return acc;
        }, {} as Record<string, { totalGoals: number; reflectionFilled: number; settingFilled: number; completed: number }>);

        return Object.entries(grouped).map(([campus, value]) => {
            const stats = value as { totalGoals: number; reflectionFilled: number; settingFilled: number; completed: number };
            return {
                campus,
                ...stats,
                reflectionPct: stats.totalGoals ? Math.round((stats.reflectionFilled / stats.totalGoals) * 100) : 0,
                settingPct: stats.totalGoals ? Math.round((stats.settingFilled / stats.totalGoals) * 100) : 0,
            };
        });
    }, [goals]);

    const filteredGoals = goals.filter(g =>
        g.teacher?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.campus?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Admin: Goals Management"
                subtitle="Overview of goal setting, reflections, and metrics per campus"
                actions={
                    <div className="flex items-center gap-3 bg-muted/30 px-4 py-2 rounded-xl border border-muted-foreground/10">
                        <Label htmlFor="goal-window" className="text-sm font-bold truncate">Goal Setting Window Open</Label>
                        <Switch
                            id="goal-window"
                            checked={isGoalSettingOpen}
                            onCheckedChange={handleToggleWindow}
                        />
                    </div>
                }
            />

            {/* Campus Aggregated Metrics */}
            <h3 className="text-xl font-bold mt-8 mb-4">Campus Goal Metrics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {campusStats.map(stat => (
                    <Card key={stat.campus} className="shadow-lg border-none hover:shadow-xl transition-shadow bg-background/50 backdrop-blur-sm">
                        <CardHeader className="border-b bg-muted/10 pb-4">
                            <CardTitle className="text-lg flex justify-between">
                                <span>{stat.campus}</span>
                                <span className="text-sm text-muted-foreground font-normal">{stat.totalGoals} Total Goals</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Self-Reflection Forms Filled</span>
                                    <span>{stat.reflectionPct}% ({stat.reflectionFilled}/{stat.totalGoals})</span>
                                </div>
                                <Progress value={stat.reflectionPct} className="h-2 rounded-full bg-muted/40" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="flex items-center gap-2"><Target className="w-4 h-4 text-info" /> Goal Setting Forms Filled</span>
                                    <span>{stat.settingPct}% ({stat.settingFilled}/{stat.totalGoals})</span>
                                </div>
                                <Progress value={stat.settingPct} className="h-2 rounded-full bg-info/20 [&>div]:bg-info" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {campusStats.length === 0 && !isLoading && (
                    <div className="col-span-full p-8 text-center text-muted-foreground border-dashed border rounded-xl">No campus data available.</div>
                )}
            </div>

            <h3 className="text-xl font-bold mt-10 mb-4">Goal Registry & Adjustments</h3>
            <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm">
                <CardHeader className="border-b bg-muted/20 pb-4 flex flex-row items-center justify-between">
                    <CardTitle>All Teacher Goals</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search teacher, title, campus..."
                            className="pl-9 h-9 border-muted bg-background/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="font-bold text-foreground">Teacher</TableHead>
                                <TableHead className="font-bold text-foreground">Campus</TableHead>
                                <TableHead className="font-bold text-foreground">Goal Title</TableHead>
                                <TableHead className="font-bold text-foreground">Self Reflection</TableHead>
                                <TableHead className="font-bold text-foreground">Goal Setting (HOS)</TableHead>
                                <TableHead className="text-right font-bold text-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredGoals.map((goal) => (
                                <TableRow key={goal.id} className="hover:bg-muted/10">
                                    <TableCell className="font-medium">{goal.teacher}</TableCell>
                                    <TableCell>{goal.campus || "-"}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{goal.title}</TableCell>
                                    <TableCell>
                                        {goal.selfReflectionForm
                                            ? <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded-md">Filled</span>
                                            : <span className="text-muted-foreground text-xs italic">Pending</span>}
                                    </TableCell>
                                    <TableCell>
                                        {goal.goalSettingForm
                                            ? <span className="text-info font-medium text-xs bg-info/10 px-2 py-1 rounded-md">Filled</span>
                                            : <span className="text-muted-foreground text-xs italic">Pending</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setSelectedGoal(goal);
                                                try { setSettingText(goal.goalSettingForm ? JSON.parse(goal.goalSettingForm).text : ""); } catch { setSettingText(""); }
                                                try { setReflectionText(goal.selfReflectionForm ? JSON.parse(goal.selfReflectionForm).text : ""); } catch { setReflectionText(""); }
                                                try { setCompletionText(goal.goalCompletionForm ? JSON.parse(goal.goalCompletionForm).text : ""); } catch { setCompletionText(""); }
                                            }}
                                            className="text-primary font-bold px-2 h-8"
                                        >
                                            Modify
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredGoals.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">No goals found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedGoal} onOpenChange={(open) => !open && setSelectedGoal(null)}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Admin Modify Goal Forms</DialogTitle>
                        <DialogDescription>
                            Directly edit the form data for {selectedGoal?.teacher}'s goal.
                        </DialogDescription>
                    </DialogHeader>

                    <GoalSettingForm
                        teachers={[{ id: selectedGoal?.teacherId || "temp-id", name: selectedGoal?.teacher || "Unknown", email: selectedGoal?.teacherEmail || "" }]}
                        defaultCoachName={selectedGoal?.assignedBy || "Admin"}
                        initialData={{
                            educatorName: selectedGoal?.teacher,
                            teacherEmail: selectedGoal?.teacherEmail || "",
                            coachName: selectedGoal?.assignedBy || "Admin",
                            campus: selectedGoal?.campus || "HQ",
                            dateOfGoalSetting: selectedGoal?.createdAt ? new Date(selectedGoal.createdAt) : new Date(),
                            goalForYear: selectedGoal?.title,
                            reasonForGoal: selectedGoal?.description || "Defined during goal setting",
                            actionStep: selectedGoal?.actionStep || "Initial planning",
                            pillarTag: selectedGoal?.category || selectedGoal?.pillar || "Professional Practice",
                            goalEndDate: selectedGoal?.dueDate ? new Date(selectedGoal.dueDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                            awareOfProcess: "yes",
                            awareOfFramework: "yes",
                            reflectionCompleted: "yes",
                            evidenceProvided: "yes",
                            ...(() => {
                                try {
                                    return selectedGoal?.goalSettingForm ? JSON.parse(selectedGoal.goalSettingForm) : {};
                                } catch {
                                    return {};
                                }
                            })()
                        }}
                        onSubmit={async (data) => {
                            if (!selectedGoal) return;
                            try {
                                const payload = {
                                    title: data.goalForYear || selectedGoal.title,
                                    description: data.reasonForGoal !== undefined ? data.reasonForGoal : selectedGoal.description,
                                    actionStep: data.actionStep !== undefined ? data.actionStep : selectedGoal.actionStep,
                                    pillar: data.pillarTag || selectedGoal.pillar,
                                    category: data.pillarTag || selectedGoal.category,
                                    campus: data.campus || selectedGoal.campus,
                                    dueDate: data.goalEndDate ? new Date(data.goalEndDate).toISOString() : selectedGoal.dueDate,
                                    goalSettingForm: JSON.stringify(data)
                                };
                                await api.patch(`/goals/${selectedGoal.id}`, payload);
                                toast.success(`Goal master form updated for ${selectedGoal.teacher}.`);
                                setSelectedGoal(null);
                                fetchGoals();
                            } catch (err) {
                                toast.error("Failed to update goal via master form.");
                            }
                        }}
                        onCancel={() => setSelectedGoal(null)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
