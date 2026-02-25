import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Target, Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

export function ManagementGoalsView() {
    const [goals, setGoals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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
                title="Management: Goals Overview"
                subtitle="Read-only view of goal setting, reflections, and metrics per campus"
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

            <h3 className="text-xl font-bold mt-10 mb-4">Goal Registry</h3>
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
                                </TableRow>
                            ))}
                            {filteredGoals.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">No goals found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
