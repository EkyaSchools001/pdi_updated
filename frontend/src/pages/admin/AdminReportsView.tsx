import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Filter, RefreshCw, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { AIAnalysisModal } from "@/components/AIAnalysisModal";
import { toast } from "sonner";
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { GrowthLayout } from "@/components/growth/GrowthLayout";

// Mock Data for Charts
const userGrowthData = [
    { name: 'Jan', teachers: 40, students: 24, total: 64 },
    { name: 'Feb', teachers: 45, students: 28, total: 73 },
    { name: 'Mar', teachers: 55, students: 35, total: 90 },
    { name: 'Apr', teachers: 70, students: 45, total: 115 },
    { name: 'May', teachers: 85, students: 55, total: 140 },
    { name: 'Jun', teachers: 100, students: 70, total: 170 },
];

const campusActivityData = [
    { name: 'North Campus', observations: 45, goals: 32 },
    { name: 'South Campus', observations: 30, goals: 25 },
    { name: 'West Campus', observations: 55, goals: 40 },
    { name: 'Main Office', observations: 15, goals: 10 },
];

const courseDistributionData = [
    { name: 'Pedagogy', value: 45, color: '#8884d8' },
    { name: 'Technology', value: 25, color: '#82ca9d' },
    { name: 'Leadership', value: 15, color: '#ffc658' },
    { name: 'Subject Specific', value: 15, color: '#ff8042' },
];

const academicPerformanceData = [
    { category: 'Core Academics', avgScore: 4.2, observations: 156 },
    { category: 'Non-Core Academics', avgScore: 3.9, observations: 89 },
];

export function AdminReportsView() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [timeRange, setTimeRange] = useState(searchParams.get("timeRange") || "6m");
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    // Sync state to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (timeRange && timeRange !== "6m") {
            params.set("timeRange", timeRange);
        } else {
            params.delete("timeRange");
        }
        setSearchParams(params, { replace: true });
    }, [timeRange]);

    const analyticsData = {
        userGrowth: userGrowthData,
        campusActivity: campusActivityData,
        courseDistribution: courseDistributionData,
        academicPerformance: academicPerformanceData,
        timeRange
    };

    const handleDownloadReport = () => {
        // Prepare CSV data
        let csvContent = "data:text/csv;charset=utf-8,";

        // 1. User Growth Data
        csvContent += "USER GROWTH OVERVIEW\n";
        csvContent += "Month,Teachers,Students,Total\n";
        userGrowthData.forEach(item => {
            csvContent += `${item.name},${item.teachers},${item.students},${item.total}\n`;
        });

        csvContent += "\n";

        // 2. Campus Activity Data
        csvContent += "CAMPUS ACTIVITY LEVELS\n";
        csvContent += "Campus,Observations,Goals\n";
        campusActivityData.forEach(item => {
            csvContent += `${item.name},${item.observations},${item.goals}\n`;
        });

        csvContent += "\n";

        // 3. Course Distribution Data
        csvContent += "COURSE ENROLLMENT BY CATEGORY\n";
        csvContent += "Category,Value\n";
        courseDistributionData.forEach(item => {
            csvContent += `${item.name},${item.value}\n`;
        });

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `admin_analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Analytics Report exported as CSV");
    };

    const handleRefresh = () => {
        toast.info("Refreshing data...");
    };

    return (
        <GrowthLayout allowedRoles={["ADMIN", "SUPERADMIN"]}>
            <div className="space-y-6 animate-in fade-in duration-500">
                <AIAnalysisModal
                    isOpen={isAIModalOpen}
                    onClose={() => setIsAIModalOpen(false)}
                    data={analyticsData}
                    type="admin"
                    title="System-Wide Performance Analysis"
                />
                <PageHeader
                    title="Reports & Analytics"
                    subtitle="Real-time system insights and performance metrics"
                    actions={
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setIsAIModalOpen(true)}
                                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/20 font-bold border-none"
                            >
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                AI System Analysis
                            </Button>
                            <Select value={timeRange} onValueChange={setTimeRange}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Select Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">Last 7 Days</SelectItem>
                                    <SelectItem value="30d">Last 30 Days</SelectItem>
                                    <SelectItem value="3m">Last 3 Months</SelectItem>
                                    <SelectItem value="6m">Last 6 Months</SelectItem>
                                    <SelectItem value="1y">Last Year</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={handleRefresh}>
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button onClick={handleDownloadReport}>
                                <Download className="w-4 h-4 mr-2" />
                                Export Report
                            </Button>
                        </div>
                    }
                />

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-muted-foreground"
                            >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+2350</div>
                            <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-muted-foreground"
                            >
                                <rect width="20" height="14" x="2" y="5" rx="2" />
                                <path d="M2 10h20" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+12,234</div>
                            <p className="text-xs text-muted-foreground">+19% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">PD Hours Logged</CardTitle>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-muted-foreground"
                            >
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+573</div>
                            <p className="text-xs text-muted-foreground">+201 since last hour</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="h-4 w-4 text-muted-foreground"
                            >
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">99.9%</div>
                            <p className="text-xs text-muted-foreground">+0.1% from last week</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                    {/* Main Area Chart */}
                    <Card className="col-span-1 lg:col-span-4">
                        <CardHeader>
                            <CardTitle>User Growth Overview</CardTitle>
                            <div className="text-sm text-muted-foreground">
                                Comparing teacher and student enrollment over the last 6 months.
                            </div>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${value}`} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="#8884d8" fillOpacity={1} fill="url(#colorTotal)" name="Total Users" />
                                        <Area type="monotone" dataKey="teachers" stroke="#82ca9d" fillOpacity={1} fill="url(#colorTeachers)" name="Teachers" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pie Chart */}
                    <Card className="col-span-1 lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Course Enrollment by Category</CardTitle>
                            <div className="text-sm text-muted-foreground">
                                Distribution of active enrollments across categories.
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={courseDistributionData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {courseDistributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar Chart */}
                    <Card className="col-span-2">
                        <CardHeader>
                            <CardTitle>Campus Activity Levels</CardTitle>
                            <div className="text-sm text-muted-foreground">
                                Observations and Goals created per campus.
                            </div>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={campusActivityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="observations" name="Observations" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="goals" name="Goals" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                    {/* Academic Performance Chart */}
                    <Card className="col-span-1 lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Academic Type Performance</CardTitle>
                            <div className="text-sm text-muted-foreground">
                                Average observation scores: Core vs Non-Core (Specialist).
                            </div>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={academicPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-muted" />
                                        <XAxis type="number" domain={[0, 5]} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis type="category" dataKey="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={150} />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                        />
                                        <Bar dataKey="avgScore" name="Avg Score" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </GrowthLayout>
    );
}
