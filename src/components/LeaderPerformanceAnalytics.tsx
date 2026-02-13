
import { useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area
} from "recharts";
import {
    TrendingUp, TrendingDown, Users, Target, Calendar, Filter, Download,
    ChevronDown, ArrowUpRight, ArrowDownRight, Activity, Award, BarChart3, PieChart, Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { Observation } from "@/types/observation";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { AIAnalysisModal } from "./AIAnalysisModal";
import { Sparkles } from "lucide-react";

interface TeamMember {
    id: string;
    name: string;
    role: string;
    avgScore: number;
    observations: number;
    lastObserved: string;
    pdHours: number;
}

interface LeaderPerformanceAnalyticsProps {
    team: TeamMember[];
    observations: Observation[];
}

export function LeaderPerformanceAnalytics({ team, observations }: LeaderPerformanceAnalyticsProps) {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    // Extract unique roles, excluding Super Admin
    const analyticsTeam = team.filter(t => t.role !== "Super Admin");
    const roles = Array.from(new Set(analyticsTeam.map(t => t.role)));

    // Filter Logic
    const filteredTeam = analyticsTeam.filter(t => {
        const matchesRole = selectedRole === "all" || t.role === selectedRole;
        const matchesStatus = selectedStatus === "all" ||
            (selectedStatus === "high" && t.avgScore >= 4.0) ||
            (selectedStatus === "proficient" && t.avgScore >= 3.0 && t.avgScore < 4.0) ||
            (selectedStatus === "needs-support" && t.avgScore < 3.0);
        return matchesRole && matchesStatus;
    });

    const filteredObservations = observations.filter(o => filteredTeam.some(t => t.name === o.teacher));

    // --- Dynamic Data Calculation (Using Filtered Data) ---

    // 1. Calculate Average Score
    const currentAvgScore = filteredTeam.length > 0
        ? filteredTeam.reduce((acc, curr) => acc + curr.avgScore, 0) / filteredTeam.length
        : 0;

    // 2. Trend Data Aggregation (Monthly)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendMap = new Map<string, { total: number; count: number }>();

    filteredObservations.forEach(obs => {
        const dateParts = obs.date.split(" ");
        let month = dateParts[0];
        if (!monthNames.includes(month)) {
            try {
                const d = new Date(obs.date);
                if (!isNaN(d.getTime())) month = monthNames[d.getMonth()];
            } catch (e) { }
        }
        if (month) {
            const current = trendMap.get(month) || { total: 0, count: 0 };
            trendMap.set(month, {
                total: current.total + (obs.score || 0),
                count: current.count + 1
            });
        }
    });

    const academicYearOrder = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    const trendData = academicYearOrder.map(month => {
        const data = trendMap.get(month);
        const districtBase = 3.2;
        const districtVariation = (academicYearOrder.indexOf(month) * 0.05);
        return {
            month,
            score: data ? Number((data.total / data.count).toFixed(1)) : null,
            district: Number((districtBase + districtVariation).toFixed(1))
        };
    }).filter(d => d.score !== null || d.month === "Jan");

    if (trendData.length === 0) trendData.push({ month: 'Jan', score: 0, district: 3.5 });

    // 3. Domain Data Aggregation
    const domainMap = new Map<string, { total: number; count: number }>();
    filteredObservations.forEach(obs => {
        if (obs.domain) {
            const current = domainMap.get(obs.domain) || { total: 0, count: 0 };
            domainMap.set(obs.domain, {
                total: current.total + (obs.score || 0),
                count: current.count + 1
            });
        }
    });

    const allDomains = ["Instruction", "Planning", "Environment", "Professionalism", "Assessment"];
    const domainData = allDomains.map(subject => {
        const data = domainMap.get(subject);
        return {
            subject,
            A: data ? Number((data.total / data.count).toFixed(1)) : 0,
            fullMark: 5
        };
    });

    const totalObservations = filteredObservations.length;
    const growth = 5.2; // Mock

    // Teachers Lists (from filtered team)
    const focusTeachers = filteredTeam.filter(t => t.avgScore < 4.0);
    const topTeachers = filteredTeam.filter(t => t.avgScore >= 4.0).sort((a, b) => b.avgScore - a.avgScore);

    const handleExport = () => {
        const headers = ["Name", "Role", "Average Score", "Observations", "Last Observed", "PD Hours"];
        const rows = filteredTeam.map(t => [
            t.name,
            t.role,
            t.avgScore.toString(),
            t.observations.toString(),
            t.lastObserved,
            t.pdHours.toString()
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `performance_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/leader")}>
                        <ChevronDown className="w-5 h-5 rotate-90" />
                    </Button>
                    <PageHeader
                        title="Performance Analytics"
                        subtitle="Deep dive into school-wide teaching effectiveness and growth trends."
                    />
                </div>

                <div className="flex items-center gap-2">
                    <AIAnalysisModal
                        isOpen={isAIModalOpen}
                        onClose={() => setIsAIModalOpen(false)}
                        data={{ team: filteredTeam, observations: filteredObservations }}
                        type="admin"
                        title="Performance Trends AI Analysis"
                    />
                    <Button
                        onClick={() => setIsAIModalOpen(true)}
                        variant="outline"
                        className="gap-2 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border-indigo-200 text-indigo-700 font-bold"
                    >
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        AI Smart Insights
                    </Button>
                    {/* Role Filter */}
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-[150px]">
                            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            {roles.map(role => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-[160px]">
                            <Activity className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="high">High Performing (4.0+)</SelectItem>
                            <SelectItem value="proficient">Proficient (3.0-3.9)</SelectItem>
                            <SelectItem value="needs-support">Needs Support (&lt;3.0)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" className="gap-2" onClick={handleExport}>
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-3xl font-bold text-primary">{currentAvgScore.toFixed(1)}</h3>
                                    <span className="text-sm font-medium text-green-600 flex items-center">
                                        <ArrowUpRight className="w-3 h-3 mr-1" />
                                        +{growth}%
                                    </span>
                                </div>
                            </div>
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Activity className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                        <div className="mt-4 h-1 w-full bg-primary/20 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${(currentAvgScore / 5) * 100}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Vs. District Avg (3.5)</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Observations</p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-3xl font-bold">{totalObservations}</h3>
                                    <span className="text-sm font-medium text-green-600 flex items-center">
                                        <ArrowUpRight className="w-3 h-3 mr-1" />
                                        +12%
                                    </span>
                                </div>
                            </div>
                            <div className="p-2 bg-muted rounded-lg">
                                <Eye className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">Across {analyticsTeam.length} teachers</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Proficiency Rate</p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-3xl font-bold">{analyticsTeam.length > 0 ? Math.round((topTeachers.length / analyticsTeam.length) * 100) : 0}%</h3>
                                    <span className="text-sm font-medium text-muted-foreground flex items-center">
                                        <ArrowUpRight className="w-3 h-3 mr-1" />
                                        0%
                                    </span>
                                </div>
                            </div>
                            <div className="p-2 bg-muted rounded-lg">
                                <Award className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">Teachers rated 4.0+</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Goal Completion</p>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <h3 className="text-3xl font-bold">82%</h3>
                                    <span className="text-sm font-medium text-green-600 flex items-center">
                                        <ArrowUpRight className="w-3 h-3 mr-1" />
                                        +12%
                                    </span>
                                </div>
                            </div>
                            <div className="p-2 bg-muted rounded-lg">
                                <Target className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">On track for AY targets</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Trend Chart */}
                <Card className="col-span-1 lg:col-span-2 shadow-md border-none">
                    <CardHeader>
                        <CardTitle>Instructional Quality Trend</CardTitle>
                        <CardDescription>Average observation scores over time vs district benchmark</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                    <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#2563eb"
                                        fillOpacity={1}
                                        fill="url(#colorScore)"
                                        strokeWidth={3}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="district"
                                        stroke="#9ca3af"
                                        strokeDasharray="5 5"
                                        dot={false}
                                        strokeWidth={2}
                                        connectNulls
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Domain Radar Chart */}
                <Card className="shadow-md border-none">
                    <CardHeader>
                        <CardTitle>Domain Proficiency</CardTitle>
                        <CardDescription>Current performance across key domains</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart outerRadius={90} data={domainData}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                    <Radar
                                        name="School"
                                        dataKey="A"
                                        stroke="#2563eb"
                                        fill="#2563eb"
                                        fillOpacity={0.5}
                                    />
                                    <RechartsTooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Top Growth
                        </CardTitle>
                        <CardDescription>Teachers showing significant improvement this quarter</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topTeachers.map((t, i) => (
                                <div key={t.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer group" onClick={() => navigate(`/leader/team/${t.id}`)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold border border-green-200">
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{t.name}</p>
                                            <p className="text-xs text-muted-foreground">{t.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-foreground">{t.avgScore}</span>
                                        <p className="text-xs text-muted-foreground">Avg Score</p>
                                    </div>
                                </div>
                            ))}
                            {topTeachers.length === 0 && <p className="text-muted-foreground text-sm">No data available.</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-500" />
                            Focus Required
                        </CardTitle>
                        <CardDescription>Teachers who may need additional coaching support</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {focusTeachers.map((t, i) => (
                                <div key={t.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer group" onClick={() => navigate(`/leader/team/${t.id}`)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold border border-yellow-200">
                                            !
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{t.name}</p>
                                            <p className="text-xs text-muted-foreground">{t.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Button size="sm" variant="outline" className="h-8">Schedule Check-in</Button>
                                    </div>
                                </div>
                            ))}
                            {focusTeachers.length === 0 && (
                                <div className="text-center py-4 bg-green-50 rounded-lg border border-green-100">
                                    <p className="text-green-700 font-medium text-sm">All teachers are performing above benchmark! 🎉</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
