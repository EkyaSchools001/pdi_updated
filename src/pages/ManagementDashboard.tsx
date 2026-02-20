import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/StatCard";
import { MeetingsDashboard } from './MeetingsDashboard';
import { MeetingMoMForm } from './MeetingMoMForm';
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard,
    HeartPulse,
    Building2,
    GraduationCap,
    TrendingUp,
    Users,
    AlertTriangle,
    FileText,
    Target,
    CheckCircle2,
    AlertCircle,
    HelpCircle,
    ArrowUpRight,
    Download,
    FileSpreadsheet,
    Calendar,
    Zap,
    ShieldCheck,
    Filter,
    Clock,
    Megaphone,
    Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, AreaChart, Area
} from 'recharts';
import { cn } from "@/lib/utils";
import { AnnouncementFormModal } from "@/components/announcements/AnnouncementFormModal";
import { announcementService, Announcement } from "@/services/announcementService";
import { useEffect } from "react";
import { format } from 'date-fns';
import SurveyPage from "@/pages/SurveyPage";

// --- Mock Data ---

const overviewTrendData = [
    { name: 'Sep', progress: 45 },
    { name: 'Oct', progress: 52 },
    { name: 'Nov', progress: 48 },
    { name: 'Dec', progress: 61 },
    { name: 'Jan', progress: 65 },
    { name: 'Feb', progress: 72 },
];

const pillarGoalDistribution = [
    { name: 'Pedagogy', value: 35 },
    { name: 'Classroom Mgmt', value: 25 },
    { name: 'Subject Knowledge', value: 20 },
    { name: 'Leadership', value: 15 },
    { name: 'Well-being', value: 5 },
];

const pillarHealthData = [
    { name: 'Pedagogy', current: 72, target: 80 },
    { name: 'Classroom Mgmt', current: 65, target: 80 },
    { name: 'Subject Knowledge', current: 88, target: 80 },
    { name: 'Leadership', current: 45, target: 70 },
    { name: 'Well-being', current: 92, target: 85 },
];

const campusBenchmarking = [
    { campus: 'JP Nagar', completion: 78, interventionNeeded: 5, growth: 12 },
    { campus: 'Kanakapura', completion: 64, interventionNeeded: 12, growth: 8 },
    { campus: 'ITPL', completion: 82, interventionNeeded: 3, growth: 15 },
    { campus: 'CKC', completion: 55, interventionNeeded: 18, growth: 4 },
];

const impactCorrelation = [
    { x: 10, y: 30, z: 200, name: 'Low PD' },
    { x: 30, y: 45, z: 400, name: 'Med PD' },
    { x: 50, y: 75, z: 600, name: 'High PD' },
    { x: 70, y: 88, z: 800, name: 'Premium PD' },
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

// --- Helper Components ---

function InfoTooltip({ content }: { content: string }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px]">
                    <p className="text-xs">{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// --- Main Pages ---

function RecentAnnouncements() {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const data = await announcementService.getAnnouncements();
                setAnnouncements(data.slice(0, 3)); // Show top 3
            } catch (error) {
                console.error('Failed to fetch recent announcements', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecent();
    }, []);

    if (loading) return <div className="h-[200px] animate-pulse bg-muted rounded-xl" />;
    if (announcements.length === 0) return null;

    return (
        <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-primary" />
                        Recent Announcements
                    </CardTitle>
                    <CardDescription>Latest updates from the organization</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 font-bold" onClick={() => navigate('/announcements')}>
                    View All
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {announcements.map((ann) => (
                    <div key={ann.id} className="flex gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-muted cursor-default">
                        <div className={cn(
                            "w-1 h-auto rounded-full",
                            ann.priority === 'High' ? "bg-destructive" : "bg-primary/40"
                        )} />
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-sm line-clamp-1">{ann.title}</h4>
                                <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                                    {format(new Date(ann.createdAt), 'MMM d')}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {ann.description}
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function Overview(props: { onPostAnnouncement: () => void }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <PageHeader
                    title="Executive Overview"
                    subtitle="Strategic organization-level PDI health and growth trends"
                />
                <div className="pb-8 flex items-center gap-3">
                    <Button
                        onClick={() => props.onPostAnnouncement()}
                        className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
                    >
                        <Megaphone className="w-4 h-4" />
                        Post Announcement
                    </Button>
                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-3 py-1">
                        AY 2025-26 • Quarter 3
                    </Badge>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard title="Total Campuses" value="4" icon={Building2} />
                <StatCard title="Total Teachers" value="361" icon={Users} />
                <StatCard
                    title="% Teachers with Active Goals"
                    value="88%"
                    subtitle="318/361 teachers"
                    icon={Target}
                    trend={{ value: 12, isPositive: true }}
                />
                <StatCard
                    title="% Goals On Track"
                    value="65%"
                    icon={CheckCircle2}
                    trend={{ value: 5, isPositive: true }}
                />
                <StatCard
                    title="% Goals At Risk"
                    value="25%"
                    icon={AlertCircle}
                    trend={{ value: 8, isPositive: false }}
                    className="border-warning/20 bg-warning/5"
                />
                <StatCard
                    title="Avg PD Completion %"
                    value="72%"
                    icon={GraduationCap}
                    trend={{ value: 15, isPositive: true }}
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Progress Trend */}
                <Card className="lg:col-span-2 border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">PDI Progress Trend</CardTitle>
                            <CardDescription>Aggregate teacher growth across the academic year</CardDescription>
                        </div>
                        <InfoTooltip content="This tracks the average progress percentage of all active professional development goals across time." />
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={overviewTrendData}>
                                <defs>
                                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="progress" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorProgress)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Announcements */}
                <RecentAnnouncements />
            </div>

            {/* CEO Insight Callouts */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-success bg-success/5 shadow-sm">
                    <CardContent className="p-4 pt-4">
                        <div className="flex gap-3">
                            <Zap className="text-success w-5 h-5 shrink-0" />
                            <div>
                                <p className="text-xs font-bold uppercase text-success/70 tracking-wider">Strongest Pillar</p>
                                <p className="font-semibold text-foreground">Teacher Well-being</p>
                                <p className="text-xs text-muted-foreground mt-1">92% progress efficiency across all campuses.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-indigo-600 bg-indigo-600/5 shadow-sm">
                    <CardContent className="p-4 pt-4">
                        <div className="flex gap-3">
                            <TrendingUp className="text-indigo-600 w-5 h-5 shrink-0" />
                            <div>
                                <p className="text-xs font-bold uppercase text-indigo-600/70 tracking-wider">Most Improved</p>
                                <p className="font-semibold text-foreground">ITPL Campus</p>
                                <p className="text-xs text-muted-foreground mt-1">Completion rate increased by 22% this quarter.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-warning bg-warning/5 shadow-sm">
                    <CardContent className="p-4 pt-4">
                        <div className="flex gap-3">
                            <AlertCircle className="text-warning w-5 h-5 shrink-0" />
                            <div>
                                <p className="text-xs font-bold uppercase text-warning/70 tracking-wider">Key Risk</p>
                                <p className="font-semibold text-foreground">Leadership Coaching</p>
                                <p className="text-xs text-muted-foreground mt-1">Only 45% of leadership goals are on track.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function PDIHealth() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="PDI Health Index"
                subtitle="Deeper metrics on governance, goal quality, and pillar distribution"
            />

            <div className="grid md:grid-cols-4 gap-4">
                <StatCard title="Total Goals Created" value="1,248" icon={FileText} />
                <StatCard title="Goal Completion Rate" value="74%" icon={CheckCircle2} trend={{ value: 4, isPositive: true }} />
                <StatCard title="Avg Goal Progress" value="62%" icon={TrendingUp} />
                <div className="p-4 rounded-xl bg-card border shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Goal Quality Score</p>
                        <InfoTooltip content="Based on SMART criteria alignment and depth of evidence provided." />
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-success">High</span>
                        <span className="text-xs text-muted-foreground mb-1">Scale: H/M/L</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Goal Health Across Pillars</CardTitle>
                        <CardDescription>Current performance vs. organization targets by focus area</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pillarHealthData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#E2E8F0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} width={120} />
                                <RechartsTooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="current" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="target" fill="#E2E8F0" radius={[0, 4, 4, 0]} barSize={10} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Pillar-wise Goal Distribution</CardTitle>
                        <CardDescription>Volume of professional growth goals per pillar</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pillarGoalDistribution}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}%`}
                                >
                                    {pillarGoalDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="p-6 rounded-2xl bg-indigo-600/5 border border-indigo-600/10">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    Governance Methodology
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-sm font-bold">Goal Health (On Track)</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-success" /> ≥ 75% progress vs timeframe
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold">Goal Health (At Risk)</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-warning" /> 40% - 74% progress
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold">Goal Health (Critical)</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-destructive" /> &lt; 40% progress
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CampusPerformance() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <PageHeader
                    title="Campus Performance"
                    subtitle="Aggregated benchmarking and resource utilization"
                />
                <div className="flex gap-2 mb-8">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="w-4 h-4" /> Filter Campuses
                    </Button>
                    <Button size="sm" className="gap-2">
                        <Download className="w-4 h-4" /> Full Audit
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Goal Completion vs. Growth</CardTitle>
                        <CardDescription>Performance comparison across organization units</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={campusBenchmarking}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="campus" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Bar name="Completion %" dataKey="completion" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar name="Growth Score" dataKey="growth" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Staff Distribution</CardTitle>
                        <CardDescription>Aggregated teacher count per campus</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-[350px]">
                        <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'JP Nagar', value: 112 },
                                        { name: 'Kanakapura', value: 88 },
                                        { name: 'ITPL', value: 95 },
                                        { name: 'CKC', value: 66 },
                                    ]}
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {[0, 1, 2, 3].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="text-center mt-2">
                            <p className="text-3xl font-bold">361</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">Total Staff</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg">Campus Registry</CardTitle>
                    <CardDescription>Organization-wide performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs font-bold uppercase text-muted-foreground bg-muted/20">
                                <tr>
                                    <th className="px-6 py-4">Campus Name</th>
                                    <th className="px-6 py-4">Current Completion</th>
                                    <th className="px-6 py-4">Goals At Risk</th>
                                    <th className="px-6 py-4">Growth %</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {campusBenchmarking.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 font-semibold">{item.campus}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 w-[120px]">
                                                <Progress value={item.completion} className="h-1.5" />
                                                <span className="text-xs">{item.completion}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={cn(item.interventionNeeded > 10 ? "text-destructive border-destructive/20 bg-destructive/5" : "text-muted-foreground")}>
                                                {item.interventionNeeded} teachers
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-success font-medium">+{item.growth}%</td>
                                        <td className="px-6 py-4">
                                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">View Trends</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function Pillars() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Teaching & Learning Pillars"
                subtitle="Strategic focus area alignment and improvement tracking"
            />

            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Goals by Focus Pillar</CardTitle>
                        <CardDescription>Priority distribution across professional domains</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Pedagogy & Instruction', value: 450 },
                                        { name: 'Classroom Environment', value: 310 },
                                        { name: 'Subject Expertise', value: 280 },
                                        { name: 'Professionalism', value: 120 },
                                        { name: 'Strategic Leadership', value: 88 },
                                    ]}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {[0, 1, 2, 3, 4].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Pillar Improvement Trend</CardTitle>
                        <CardDescription>Progress growth per quarter by focus area</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[
                                { name: 'Q1', pedagogy: 40, env: 35, subject: 50 },
                                { name: 'Q2', pedagogy: 55, env: 42, subject: 58 },
                                { name: 'Q3', pedagogy: 72, env: 65, subject: 88 },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Line type="monotone" dataKey="pedagogy" stroke="#6366f1" strokeWidth={3} />
                                <Line type="monotone" dataKey="env" stroke="#ec4899" strokeWidth={3} />
                                <Line type="monotone" dataKey="subject" stroke="#10b981" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-success/5 border border-success/10 space-y-2">
                    <p className="text-xs font-bold uppercase text-success/70 tracking-tighter">Strongest Alignment</p>
                    <h4 className="text-xl font-bold">Subject Expertise</h4>
                    <p className="text-sm text-muted-foreground leading-snug">Highest average goal quality scores and completion rates across all campuses.</p>
                </div>
                <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-2">
                    <p className="text-xs font-bold uppercase text-destructive/70 tracking-tighter">Weakest Link</p>
                    <h4 className="text-xl font-bold">Strategic Leadership</h4>
                    <p className="text-sm text-muted-foreground leading-snug">Requires targeted PD intervention; lowest volume of goals and slowest progress.</p>
                </div>
                <div className="p-6 rounded-2xl bg-indigo-600/5 border border-indigo-600/10 space-y-2">
                    <p className="text-xs font-bold uppercase text-indigo-600/70 tracking-tighter">Most Selected Area</p>
                    <h4 className="text-xl font-bold">Inquiry-Based Learning</h4>
                    <p className="text-sm text-muted-foreground leading-snug">The most common goal sub-category; 42% of teachers are currently focusing here.</p>
                </div>
            </div>
        </div>
    );
}

function PDImpact() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="PD Impact Analysis"
                subtitle="Correlating professional development hours with goal improvement"
            />

            <div className="grid md:grid-cols-3 gap-4">
                <StatCard title="Avg Goal Improvement" value="+18%" subtitle="Across all teachers" icon={TrendingUp} />
                <StatCard title="% Teachers Showing Growth" value="82%" subtitle="Positive growth trajectory" icon={Users} />
                <StatCard title="High-Impact PD Sessions" value="24" subtitle="Top 10% effectiveness" icon={Zap} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg">PD Hours vs. Goal Growth</CardTitle>
                        <CardDescription>Correlation between training attendance and classroom improvement</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid />
                                <XAxis type="number" dataKey="x" name="PD Hours" unit="h" />
                                <YAxis type="number" dataKey="y" name="Growth" unit="%" />
                                <ZAxis type="number" range={[100, 1000]} />
                                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Impact Data" data={impactCorrelation} fill="#6366f1" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg">PD Effectiveness by Pillar</CardTitle>
                        <CardDescription>Training efficiency mapped to focus areas</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { pillar: 'Pedagogy', efficiency: 85 },
                                { pillar: 'Environment', efficiency: 62 },
                                { pillar: 'Leadership', efficiency: 45 },
                                { pillar: 'ICT', efficiency: 92 },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="pillar" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="efficiency" fill="#ec4899" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-success" />
                    Key Insight: Premium Content Impact
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Data shows a strong correlation (+0.82) between teachers attending more than 50 hours of "Inquiry-Based Learning" PD and achieving their goals 1.5x faster than the organizational average. Recommended focus: scale this module to ITPL and Kanakapura campuses next quarter.
                </p>
            </div>
        </div>
    );
}

function Leadership() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Leadership Effectiveness"
                subtitle="Benchmarking campus leader engagement and coaching outcomes"
            />

            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg">Leader Benchmarking</CardTitle>
                        <CardDescription>Coaching engagement and team growth scores</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/20 text-xs font-bold uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4">Leader Name</th>
                                        <th className="px-6 py-4">Observation Rate</th>
                                        <th className="px-6 py-4">Coaching Quality</th>
                                        <th className="px-6 py-4">Team Growth</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {[
                                        { name: 'Rohit', obs: '98%', quality: 'High', growth: '+15%' },
                                        { name: 'Michael Chen', obs: '82%', quality: 'Medium', growth: '+8%' },
                                        { name: 'Anita Rao', obs: '92%', quality: 'High', growth: '+12%' },
                                    ].map((leader, i) => (
                                        <tr key={i} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-4 font-semibold">{leader.name}</td>
                                            <td className="px-6 py-4 text-primary font-medium">{leader.obs}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={cn(leader.quality === "High" ? "text-success border-success/20 bg-success/5" : "text-warning border-warning/20 bg-warning/5")}>
                                                    {leader.quality}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-success font-medium">{leader.growth}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Follow-up Index vs. Goal Progress</CardTitle>
                        <CardDescription>How coaching consistency drives teacher success</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { campus: 'JP Nagar', followUp: 90, progress: 85 },
                                { campus: 'ITPL', followUp: 85, progress: 82 },
                                { campus: 'Kanakapura', followUp: 60, progress: 55 },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="campus" />
                                <YAxis />
                                <RechartsTooltip />
                                <Legend />
                                <Bar name="Coaching Follow-up" dataKey="followUp" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar name="Teacher Progress" dataKey="progress" fill="#ec4899" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="p-6 rounded-2xl bg-indigo-600/5 border border-indigo-600/10 container">
                <div className="flex flex-col md:flex-row gap-6 md:items-center">
                    <div className="space-y-2 flex-1">
                        <h4 className="text-lg font-bold flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                            Leadership Insight
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            A direct correlation of 0.9 exists between leader coaching follow-up and teacher goal progress. Leaders at the Kanakapura campus currently have a follow-up index of 60%, reflecting a slower teacher growth trajectory.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Risk() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Risk & Intervention Watch"
                subtitle="Early warning signs and critical performance alerts"
            />

            <div className="grid md:grid-cols-4 gap-4">
                <StatCard title="Critical Campuses" value="1" subtitle="CKC High Alert" icon={AlertTriangle} className="border-destructive/20 bg-destructive/5" />
                <StatCard title="Stagnant Goals" value="18" subtitle="No movement in 30 days" icon={Clock} />
                <StatCard title="Observ. Deficit" value="12%" subtitle="Below monthly target" icon={AlertCircle} />
                <StatCard title="Interventions Logged" value="5" subtitle="This Quarter" icon={ShieldCheck} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Risk Severity by Campus</CardTitle>
                        <CardDescription>Early indicator heatmap across organization</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'JP Nagar', low: 80, med: 15, high: 5 },
                                { name: 'ITPL', low: 85, med: 12, high: 3 },
                                { name: 'Kanakapura', low: 60, med: 30, high: 10 },
                                { name: 'CKC', low: 45, med: 35, high: 20 },
                            ]} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} />
                                <RechartsTooltip />
                                <Legend />
                                <Bar dataKey="low" stackId="a" fill="#10b981" barSize={30} />
                                <Bar dataKey="med" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="high" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="text-lg text-destructive flex items-center gap-2">
                                <Zap className="w-5 h-5" /> Critical Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-destructive/5 border border-destructive/10 rounded-lg">
                                <p className="text-sm font-bold">Incomplete Peer Reviews: CKC Campus</p>
                                <p className="text-xs text-muted-foreground">Peer feedback is 3 weeks overdue for 12 faculty members.</p>
                            </div>
                            <div className="p-3 bg-warning/5 border border-warning/10 rounded-lg">
                                <p className="text-sm font-bold">Goal Stagnation Detected</p>
                                <p className="text-xs text-muted-foreground">15 goals at Kanakapura haven't had an evidence update in 45 days.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Reports() {
    const handleExport = (format: string) => {
        toast.success(`Generating ${format} board report...`);
        setTimeout(() => {
            toast.success(`${format} report ready for download.`);
        }, 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Reports & Exports"
                subtitle="Download board-ready summaries and comprehensive PDI datasets"
            />

            <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" /> Board-Ready PDF Report
                        </CardTitle>
                        <CardDescription>Professional summary for stakeholders</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <p className="text-muted-foreground">Comprehensive executive summary including:</p>
                        <ul className="grid grid-cols-2 gap-2 text-xs font-medium">
                            <li className="flex items-center gap-2">• Organization KPIs</li>
                            <li className="flex items-center gap-2">• Risk Assessments</li>
                            <li className="flex items-center gap-2">• Resource Allocation</li>
                            <li className="flex items-center gap-2">• AY Growth Targets</li>
                        </ul>
                        <Button className="w-full gap-2 mt-4" onClick={() => handleExport('PDF')}>
                            <Download className="w-4 h-4" /> Download Board PDF
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-background/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-success" /> Raw Data Export (Excel/CSV)
                        </CardTitle>
                        <CardDescription>Detailed datasets for custom analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <select className="w-full p-2 text-sm rounded-lg border bg-background">
                            <option>Full Teacher Dataset (AY 2025-26)</option>
                            <option>Campus-wise Performance Flat File</option>
                            <option>PD Impact Metrics (Aggregated)</option>
                        </select>
                        <Button variant="outline" className="w-full gap-2" onClick={() => handleExport('Excel')}>
                            <FileSpreadsheet className="w-4 h-4" /> Download Dataset
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-dashed border-2 bg-muted/20">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-muted-foreground" /> Academic Year Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-8 items-center justify-between py-12">
                    <div className="text-center group cursor-default">
                        <p className="text-4xl font-black text-primary leading-tight">72%</p>
                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mt-1">Growth Index</p>
                    </div>
                    <div className="w-px h-16 bg-muted-foreground/20 hidden md:block" />
                    <div className="text-center group cursor-default">
                        <p className="text-4xl font-black text-success leading-tight">36</p>
                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mt-1">Certifications</p>
                    </div>
                    <div className="w-px h-16 bg-muted-foreground/20 hidden md:block" />
                    <div className="text-center group cursor-default">
                        <p className="text-4xl font-black text-indigo-600 leading-tight">1.2k</p>
                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mt-1">Goals Closed</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ManagementDashboard() {
    const { user } = useAuth();
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

    const handleAnnouncementSuccess = (announcement: Announcement) => {
        toast.success(`Announcement "${announcement.title}" posted successfully!`);
    };

    if (!user) return null;

    const userName = user.fullName;
    const role = user.role;

    return (
        <DashboardLayout role={role.toLowerCase() as any} userName={userName}>
            <div className="container mx-auto py-8 px-4">
                <Routes>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<Overview onPostAnnouncement={() => setIsAnnouncementModalOpen(true)} />} />
                    <Route path="pdi-health" element={<PDIHealth />} />
                    <Route path="campus-performance" element={<CampusPerformance />} />
                    <Route path="pillars" element={<Pillars />} />
                    <Route path="pd-impact" element={<PDImpact />} />
                    <Route path="meetings" element={<MeetingsDashboard />} />
                    <Route path="meetings/:meetingId/mom" element={<MeetingMoMForm />} />
                    <Route path="meetings/:meetingId" element={<MeetingMoMForm />} />
                    <Route path="leadership" element={<Leadership />} />
                    <Route path="risk" element={<Risk />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="survey" element={<SurveyPage />} />
                </Routes>
            </div>

            <AnnouncementFormModal
                isOpen={isAnnouncementModalOpen}
                onOpenChange={setIsAnnouncementModalOpen}
                onSuccess={handleAnnouncementSuccess}
                userRole="MANAGEMENT"
            />
        </DashboardLayout>
    );
}
