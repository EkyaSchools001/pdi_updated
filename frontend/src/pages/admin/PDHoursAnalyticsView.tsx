import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Clock,
    Users,
    CheckCircle2,
    ChevronRight,
    Download,
    Filter,
    BarChart3,
    PieChart as PieChartIcon,
    ArrowLeft,
    TrendingUp,
    MessageSquare,
    ClipboardCheck
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function PDHoursAnalyticsView() {
    const [loading, setLoading] = useState(true);
    const [avgHoursData, setAvgHoursData] = useState<any[]>([]);
    const [cutoffStats, setCutoffStats] = useState<any[]>([]);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [feedbackData, setFeedbackData] = useState<any>({ events: [], globalAverage: 0 });
    const [engagementData, setEngagementData] = useState<any>({ summary: {}, teachers: [] });

    const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
    const [campusTeachers, setCampusTeachers] = useState<any[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);

    const [cutoff, setCutoff] = useState(20);
    const [viewMode, setViewMode] = useState<'overview' | 'drilldown'>('overview');

    useEffect(() => {
        fetchData();
    }, [cutoff]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [avgRes, cutoffRes, attendRes, feedbackRes, engageRes] = await Promise.all([
                api.get('/analytics/avg-hours-school'),
                api.get(`/analytics/cutoff-stats?cutoff=${cutoff}`),
                api.get('/analytics/attendance'),
                api.get('/analytics/feedback'),
                api.get('/analytics/engagement')
            ]);

            setAvgHoursData(avgRes.data.data.results);
            setCutoffStats(cutoffRes.data.data.results);
            setAttendanceData(attendRes.data.data.events);
            setFeedbackData(feedbackRes.data.data);
            setEngagementData(engageRes.data.data);
        } catch (error) {
            console.error("Failed to fetch PD analytics:", error);
            toast.error("Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    };

    const handleCampusClick = async (campus: string) => {
        setSelectedCampus(campus);
        setViewMode('drilldown');
        setLoadingTeachers(true);
        try {
            const res = await api.get(`/analytics/teacher-hours/${campus}`);
            setCampusTeachers(res.data.data.teachers);
        } catch (error) {
            toast.error("Failed to load teacher details");
        } finally {
            setLoadingTeachers(false);
        }
    };

    const stats = useMemo(() => {
        const totalAvg = avgHoursData.length > 0
            ? (avgHoursData.reduce((acc, curr) => acc + curr.avgHours, 0) / avgHoursData.length).toFixed(1)
            : "0";

        const totalAbove = cutoffStats.reduce((acc, curr) => acc + (curr.abovePercent * curr.total / 100), 0);
        const totalTeachers = cutoffStats.reduce((acc, curr) => acc + curr.total, 0);
        const percentMeetingGoal = totalTeachers > 0 ? ((totalAbove / totalTeachers) * 100).toFixed(1) : "0";

        const avgAttend = attendanceData.length > 0
            ? (attendanceData.reduce((acc, curr) => acc + curr.attendanceRate, 0) / attendanceData.length).toFixed(1)
            : "0";

        return {
            avgHours: totalAvg,
            percentMeetingGoal,
            avgAttendance: avgAttend,
            globalFeedback: feedbackData.globalAverage || 0
        };
    }, [avgHoursData, cutoffStats, attendanceData, feedbackData]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-80 rounded-xl" />
                    <Skeleton className="h-80 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Professional Development Analytics"
                    subtitle="Comprehensive insights into teacher training and growth"
                />
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
                        <span className="text-xs font-medium px-2">Goal Cutoff (Hrs):</span>
                        <Input
                            type="number"
                            value={cutoff}
                            onChange={(e) => setCutoff(parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-xs bg-background"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button size="sm" className="bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20">
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                    </Button>
                </div>
            </div>

            {viewMode === 'overview' ? (
                <>
                    {/* Top Row Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatSummaryCard
                            title="Avg. PD Hours"
                            value={`${stats.avgHours}h`}
                            subtitle="Global average per teacher"
                            icon={Clock}
                            color="blue"
                        />
                        <StatSummaryCard
                            title="Goal Achievement"
                            value={`${stats.percentMeetingGoal}%`}
                            subtitle={`Teachers meeting ${cutoff}h goal`}
                            icon={CheckCircle2}
                            color="green"
                        />
                        <StatSummaryCard
                            title="Avg. Attendance"
                            value={`${stats.avgAttendance}%`}
                            subtitle="Participation in live training"
                            icon={Users}
                            color="purple"
                        />
                        <StatSummaryCard
                            title="Feedback Score"
                            value={`${stats.globalFeedback}/5`}
                            subtitle="Global event rating average"
                            icon={MessageSquare}
                            color="amber"
                        />
                    </div>

                    {/* Main Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="glass-card shadow-xl overflow-hidden border-none bg-background/50 backdrop-blur-xl">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-lg">Average PD Hours by Campus</CardTitle>
                                    <CardDescription>Click a bar to view individual teacher hours</CardDescription>
                                </div>
                                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={avgHoursData} onClick={(data) => data && data.activeLabel && handleCampusClick(data.activeLabel)}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="campus" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                        />
                                        <Bar
                                            dataKey="avgHours"
                                            fill="hsl(var(--primary))"
                                            radius={[6, 6, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="glass-card shadow-xl overflow-hidden border-none bg-background/50 backdrop-blur-xl">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-lg">Goal Compliance ( {cutoff}h )</CardTitle>
                                    <CardDescription>Teachers meeting mandatory PD hour requirements</CardDescription>
                                </div>
                                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cutoffStats} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="campus" type="category" axisLine={false} tickLine={false} width={100} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="abovePercent" name="Meeting Goal" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="belowPercent" name="Needs Hours" stackId="a" fill="#eab308" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Secondary Metrics Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 glass-card shadow-xl overflow-hidden border-none bg-background/50 backdrop-blur-xl">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-lg">Training Event Performance</CardTitle>
                                    <CardDescription>Attendance rates for recent PD sessions</CardDescription>
                                </div>
                                <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={attendanceData}>
                                        <defs>
                                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="title" hide />
                                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="attendanceRate" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRate)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="glass-card shadow-xl overflow-hidden border-none bg-background/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-lg">Event Feedback</CardTitle>
                                <CardDescription>Top rated sessions this semester</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {feedbackData.events.slice(0, 5).sort((a: any, b: any) => b.avgRating - a.avgRating).map((event: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 transition-all hover:bg-muted/60">
                                        <div className="truncate pr-4">
                                            <p className="text-sm font-medium truncate">{event.title}</p>
                                            <p className="text-xs text-muted-foreground">{event.feedbackCount} responses</p>
                                        </div>
                                        <Badge variant={event.avgRating >= 4 ? "secondary" : "outline"} className="shrink-0 bg-primary/10 text-primary border-none">
                                            {event.avgRating} ★
                                        </Badge>
                                    </div>
                                ))}
                                {feedbackData.events.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">No feedback data yet</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : (
                /* Drill Down View */
                <div className="animate-in slide-in-from-right-5 duration-500">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="sm" onClick={() => setViewMode('overview')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Overview
                        </Button>
                        <h2 className="text-2xl font-bold">{selectedCampus} - Detailed Teacher PD Hours</h2>
                    </div>

                    <Card className="glass-card shadow-xl border-none bg-background/50 backdrop-blur-xl overflow-hidden">
                        <CardHeader>
                            <CardTitle>Teacher PD Registry</CardTitle>
                            <CardDescription>Individual hours breakdown for {selectedCampus}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead>Teacher Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="text-right">Total PD Hours</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingTeachers ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                                <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                                <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto rounded-full" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        campusTeachers.map((teacher: any) => (
                                            <TableRow key={teacher.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-medium">{teacher.fullName}</TableCell>
                                                <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                                                <TableCell className="text-right font-bold">{teacher.totalHours}h</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge className={teacher.totalHours >= cutoff ? "bg-green-100 text-green-700 hover:bg-green-100 border-none px-3" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none px-3"}>
                                                        {teacher.totalHours >= cutoff ? "Requirement Met" : "Hours Pending"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                                        <ChevronRight className="w-4 h-4" />
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
            )}
        </div>
    );
}

function StatSummaryCard({ title, value, subtitle, icon: Icon, color }: any) {
    const colorClasses: any = {
        blue: "bg-blue-500/10 text-blue-600",
        green: "bg-green-500/10 text-green-600",
        purple: "bg-purple-500/10 text-purple-600",
        amber: "bg-amber-500/10 text-amber-600",
    };

    return (
        <Card className="glass-card shadow-lg border-none bg-background/50 backdrop-blur-xl hover:translate-y-[-4px] transition-all duration-300">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                </div>
                <div className="space-y-1">
                    <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function RefreshCw(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    );
}
