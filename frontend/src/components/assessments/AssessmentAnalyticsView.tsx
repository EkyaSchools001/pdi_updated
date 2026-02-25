import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { assessmentService } from "@/services/assessmentService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, CheckCircle, Clock } from 'lucide-react';

export const AssessmentAnalyticsView: React.FC = () => {
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const data = await assessmentService.getAnalytics();
            // Handle both old array structure and new object structure
            if (data && data.attempts) {
                setAnalytics(data.attempts);
            } else if (Array.isArray(data)) {
                setAnalytics(data);
            } else {
                setAnalytics([]);
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-zinc-400">Loading analytics...</div>;

    const totalAttempts = analytics.length;
    const completedAttempts = analytics.filter(a => a.status === 'SUBMITTED').length;
    const avgScore = totalAttempts > 0
        ? analytics.reduce((acc, a) => acc + (a.score || 0), 0) / totalAttempts
        : 0;

    const data = [
        { name: 'Completed', value: completedAttempts },
        { name: 'In Progress', value: totalAttempts - completedAttempts },
    ];

    const COLORS = ['#10b981', '#f59e0b'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-zinc-900 text-white">
                    <CardContent className="pt-6 space-y-2">
                        <Users className="w-8 h-8 text-primary mb-2" />
                        <p className="text-zinc-400 text-sm">Total Attempts</p>
                        <h3 className="text-3xl font-bold">{totalAttempts}</h3>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md">
                    <CardContent className="pt-6 space-y-2">
                        <TrendingUp className="w-8 h-8 text-emerald-500 mb-2" />
                        <p className="text-zinc-500 text-sm">Average Score</p>
                        <h3 className="text-3xl font-bold">{Math.round(avgScore)}%</h3>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md">
                    <CardContent className="pt-6 space-y-2">
                        <CheckCircle className="w-8 h-8 text-blue-500 mb-2" />
                        <p className="text-zinc-500 text-sm">Completion Rate</p>
                        <h3 className="text-3xl font-bold">{totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0}%</h3>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle>Completion Status</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg overflow-hidden">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {analytics.slice(0, 5).map((attempt, idx) => (
                                <div key={attempt.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-600">
                                            {attempt.user?.fullName?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{attempt.user?.fullName}</p>
                                            <p className="text-xs text-zinc-500">{attempt.assessment?.title}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge className={attempt.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                                            {attempt.status}
                                        </Badge>
                                        <p className="text-xs text-zinc-400 mt-1">{new Date(attempt.startTime).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
