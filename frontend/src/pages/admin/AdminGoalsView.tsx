import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { GoalWorkflowForms } from '@/components/GoalWorkflowForms';
import { GoalGovernance } from '@/components/GoalGovernance';
import { CAMPUS_OPTIONS } from '@/lib/constants';

export function AdminGoalsView() {
    const [goals, setGoals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isGoalSettingOpen, setIsGoalSettingOpen] = useState(true);

    const [selectedGoal, setSelectedGoal] = useState<any>(null);
    const [selectedCampusStats, setSelectedCampusStats] = useState<string | null>(null);

    useEffect(() => {
        fetchGoals();
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

    // Group goals by campus (or fallback)
    const campusStats = React.useMemo(() => {
        const grouped = CAMPUS_OPTIONS.reduce((acc, campus) => {
            acc[campus] = { totalGoals: 0, reflectionFilled: 0, settingFilled: 0, completed: 0 };
            return acc;
        }, {} as Record<string, { totalGoals: number; reflectionFilled: number; settingFilled: number; completed: number }>);

        goals.forEach(goal => {
            const campus = goal.campus;
            // Only process goals that belong to a valid predefined campus
            if (!campus || !CAMPUS_OPTIONS.includes(campus)) return;

            grouped[campus].totalGoals += 1;
            if (goal.selfReflectionForm) grouped[campus].reflectionFilled += 1;
            if (goal.goalSettingForm) grouped[campus].settingFilled += 1;
            if (goal.status === "COMPLETED") grouped[campus].completed += 1;
        });

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
            />

            <GoalGovernance />

            {/* Campus Aggregated Metrics */}
            <h3 className="text-xl font-bold mt-8 mb-4">Campus Goal Metrics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {campusStats.map(stat => (
                    <Card
                        key={stat.campus}
                        className="shadow-lg border-none hover:shadow-xl transition-all cursor-pointer bg-background/50 hover:bg-background/80 backdrop-blur-sm"
                        onClick={() => setSelectedCampusStats(stat.campus)}
                    >
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

            {selectedGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <GoalWorkflowForms
                        goal={selectedGoal}
                        role="ADMIN"
                        onComplete={() => {
                            setSelectedGoal(null);
                            fetchGoals();
                        }}
                        onClose={() => setSelectedGoal(null)}
                    />
                </div>
            )}

            <Dialog open={!!selectedCampusStats} onOpenChange={(open) => !open && setSelectedCampusStats(null)}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            {selectedCampusStats} - Goal Progress Details
                        </DialogTitle>
                        <DialogDescription>
                            Review which teachers have completed their goal forms.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 pr-4 -mr-4">
                        <div className="space-y-6 pt-4">
                            {(() => {
                                const campusGoals = goals.filter(g => (g.campus || "Unassigned") === selectedCampusStats);

                                const reflectionCompleted = campusGoals.filter(g => !!g.selfReflectionForm);
                                const reflectionPending = campusGoals.filter(g => !g.selfReflectionForm);

                                const settingCompleted = campusGoals.filter(g => !!g.goalSettingForm);
                                const settingPending = campusGoals.filter(g => !g.goalSettingForm);

                                return (
                                    <>
                                        <div className="space-y-4">
                                            <h4 className="font-bold flex items-center gap-2 text-sm uppercase text-muted-foreground border-b pb-2">
                                                <FileText className="w-4 h-4" /> Self-Reflection Status
                                            </h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                                                    <p className="text-xs font-bold text-emerald-700 uppercase mb-2">✅ Completed ({reflectionCompleted.length})</p>
                                                    <div className="space-y-1">
                                                        {reflectionCompleted.map(g => (
                                                            <div key={g.id} className="text-xs font-medium">{g.teacher}</div>
                                                        ))}
                                                        {reflectionCompleted.length === 0 && <div className="text-xs text-muted-foreground italic">None</div>}
                                                    </div>
                                                </div>

                                                <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg">
                                                    <p className="text-xs font-bold text-rose-700 uppercase mb-2">⏳ Pending ({reflectionPending.length})</p>
                                                    <div className="space-y-1">
                                                        {reflectionPending.map(g => (
                                                            <div key={g.id} className="text-xs font-medium">{g.teacher}</div>
                                                        ))}
                                                        {reflectionPending.length === 0 && <div className="text-xs text-muted-foreground italic">None</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-bold flex items-center gap-2 text-sm uppercase text-muted-foreground border-b pb-2">
                                                <Target className="w-4 h-4" /> Goal Setting Status
                                            </h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                                                    <p className="text-xs font-bold text-blue-700 uppercase mb-2">✅ Completed ({settingCompleted.length})</p>
                                                    <div className="space-y-1">
                                                        {settingCompleted.map(g => (
                                                            <div key={g.id} className="text-xs font-medium">{g.teacher}</div>
                                                        ))}
                                                        {settingCompleted.length === 0 && <div className="text-xs text-muted-foreground italic">None</div>}
                                                    </div>
                                                </div>

                                                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                                                    <p className="text-xs font-bold text-amber-700 uppercase mb-2">⏳ Pending ({settingPending.length})</p>
                                                    <div className="space-y-1">
                                                        {settingPending.map(g => (
                                                            <div key={g.id} className="text-xs font-medium">{g.teacher}</div>
                                                        ))}
                                                        {settingPending.length === 0 && <div className="text-xs text-muted-foreground italic">None</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
