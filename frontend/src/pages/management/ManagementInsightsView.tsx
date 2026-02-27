import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Search, BookOpen, Award, Target, TrendingUp, CheckCircle2, UserCircle, Download, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import { analyticsService } from '@/services/analyticsService';
import { learningFestivalService, LearningFestivalApplication } from '@/services/learningFestivalService';
import { CAMPUS_OPTIONS } from '@/lib/constants';

export function ManagementInsightsView() {
    const { user } = useAuth();

    // State
    const [teachersStats, setTeachersStats] = useState<any[]>([]);
    const [festivalApps, setFestivalApps] = useState<LearningFestivalApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'engagement' | 'applications' | 'shortlisted'>('engagement');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [campusFilter, setCampusFilter] = useState('all');

    useEffect(() => {
        fetchInsightsData();
    }, []);

    const fetchInsightsData = async () => {
        setLoading(true);
        try {
            const [engagementData, appsData] = await Promise.all([
                analyticsService.getCampusEngagement(),
                learningFestivalService.getApplications()
            ]);

            setTeachersStats(engagementData.teachers || []);
            setFestivalApps(appsData || []);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load management insights.");
        } finally {
            setLoading(false);
        }
    };

    // --- AGGREGATION LOGIC ---

    // 1. Campus-wise Engagement Data
    const campusEngagementData = useMemo(() => {
        const campusMap = new Map<string, { teachers: any[], totalEnrolled: number, totalCompleted: number }>();
        const validTeachers = teachersStats.filter(t => t.campusId);

        validTeachers.forEach(t => {
            if (!campusMap.has(t.campusId)) {
                campusMap.set(t.campusId, { teachers: [], totalEnrolled: 0, totalCompleted: 0 });
            }
            const data = campusMap.get(t.campusId)!;
            data.teachers.push(t);
            data.totalEnrolled += t.coursesEnrolled || 0;
            data.totalCompleted += t.coursesCompleted || 0;
        });

        const mapped = Array.from(campusMap.entries()).map(([campusId, data]) => {
            const activeTeachers = data.teachers.filter(t => t.isActive).length;
            const engagementSum = data.teachers.reduce((sum, t) => sum + (t.engagementPercent || 0), 0);
            const avgEngagement = data.teachers.length > 0 ? Math.round(engagementSum / data.teachers.length) : 0;

            let status: 'High' | 'Medium' | 'Low' = 'Low';
            if (avgEngagement >= 70) status = 'High';
            else if (avgEngagement >= 40) status = 'Medium';

            return {
                campusId,
                totalTeachers: data.teachers.length,
                activeTeachers,
                avgEngagement,
                coursesOffered: data.totalEnrolled, // For simplicity in mock logic
                coursesCompleted: data.totalCompleted,
                status
            };
        });

        return mapped.sort((a, b) => b.avgEngagement - a.avgEngagement);
    }, [teachersStats]);

    const globalEngagementSummary = useMemo(() => {
        const totalCampuses = campusEngagementData.length;
        const totalAvg = totalCampuses > 0
            ? Math.round(campusEngagementData.reduce((sum, c) => sum + c.avgEngagement, 0) / totalCampuses)
            : 0;
        const totalEnrolled = campusEngagementData.reduce((sum, c) => sum + c.coursesOffered, 0);
        const totalActive = campusEngagementData.reduce((sum, c) => sum + c.activeTeachers, 0);
        return { totalAvg, totalEnrolled, totalActive };
    }, [campusEngagementData]);

    // 2. Campus-wise Festival Applications
    const campusApplicationData = useMemo(() => {
        const campusMap = new Map<string, { total: number, underReview: number, shortlisted: number, rejected: number }>();

        festivalApps.forEach(app => {
            const campusId = app.user?.campusId || 'Unknown';
            if (!campusMap.has(campusId)) {
                campusMap.set(campusId, { total: 0, underReview: 0, shortlisted: 0, rejected: 0 });
            }
            const data = campusMap.get(campusId)!;
            data.total += 1;

            if (app.status === 'Under Review' || app.status === 'Submitted') data.underReview += 1;
            if (app.status === 'Shortlisted' || app.status === 'Confirmed') data.shortlisted += 1;
            if (app.status === 'Rejected') data.rejected += 1;
        });

        return Array.from(campusMap.entries()).map(([campusId, stats]) => ({
            campusId,
            ...stats
        })).sort((a, b) => b.total - a.total);
    }, [festivalApps]);

    // Filtered Lists for Drilldowns
    const filteredTeachers = teachersStats.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCampus = campusFilter === 'all' || t.campusId === campusFilter;
        return matchSearch && matchCampus;
    }).sort((a, b) => b.engagementPercent - a.engagementPercent);

    const filteredApps = festivalApps.filter(a => {
        const matchSearch = String(a.user?.fullName).toLowerCase().includes(searchQuery.toLowerCase());
        const matchCampus = campusFilter === 'all' || a.user?.campusId === campusFilter;
        return matchSearch && matchCampus;
    });

    const shortlistedApps = filteredApps.filter(a => a.status === 'Shortlisted' || a.status === 'Confirmed');

    const handleExport = () => {
        // Implement simulated CSV export by printing available table data to console / triggering print
        window.print();
        toast.success("Ready for print/PDF export");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Management Insights"
                    subtitle="Read-only cross-campus overview of Learning Engagement and Festival outcomes."
                />
                <Button onClick={handleExport} variant="outline" className="gap-2 bg-white">
                    <Download className="w-4 h-4" />
                    Export PDF/CSV Segment
                </Button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-muted/50 rounded-lg w-fit">
                <Button
                    variant={activeTab === 'engagement' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('engagement')}
                    className="gap-2 rounded-md"
                >
                    <BookOpen className="w-4 h-4" />
                    Self-Paced Learning Engagement
                </Button>
                <Button
                    variant={activeTab === 'applications' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('applications')}
                    className="gap-2 rounded-md"
                >
                    <Award className="w-4 h-4" />
                    Learning Festival Demand
                </Button>
                <Button
                    variant={activeTab === 'shortlisted' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('shortlisted')}
                    className="gap-2 rounded-md"
                >
                    <Target className="w-4 h-4" />
                    Shortlisted Outcomes
                </Button>
            </div>

            {/* --- SECTION 1: Self Paced Engagement (Aggregated) --- */}
            {activeTab === 'engagement' && (
                <div className="space-y-8 animate-in fade-in">

                    {/* Global KPI Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-indigo-50 to-white shadow-sm border-none">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-gray-500 uppercase">Overall Network Engagement</p>
                                        <h3 className="text-3xl font-black text-indigo-900 mt-2">
                                            {globalEngagementSummary.totalAvg}%
                                        </h3>
                                    </div>
                                    <TrendingUp className="w-6 h-6 text-indigo-400" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-gray-100">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Network Active Teachers</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                            {globalEngagementSummary.totalActive}
                                        </h3>
                                    </div>
                                    <UserCircle className="w-5 h-5 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-gray-100">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Course Enrollments</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                            {globalEngagementSummary.totalEnrolled}
                                        </h3>
                                    </div>
                                    <BookOpen className="w-5 h-5 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Campus-Wise Engagement Aggregation */}
                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50/50 border-b">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-500" />
                                Campus-Wise Engagement Overviews
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white text-gray-600 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">Campus Name</th>
                                        <th className="px-6 py-4">Total Teachers</th>
                                        <th className="px-6 py-4">Active Teachers</th>
                                        <th className="px-6 py-4">Campus Avg Engagement</th>
                                        <th className="px-6 py-4">Engagement Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {campusEngagementData.map(c => (
                                        <tr key={c.campusId} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-indigo-900">{c.campusId}</td>
                                            <td className="px-6 py-4 font-medium">{c.totalTeachers}</td>
                                            <td className="px-6 py-4 text-emerald-600 font-medium">{c.activeTeachers}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-gray-800 w-8">{c.avgEngagement}%</span>
                                                    <div className="w-full bg-gray-100 rounded-full h-2 max-w-[100px]">
                                                        <div
                                                            className={`h-2 rounded-full ${c.avgEngagement >= 70 ? 'bg-emerald-500' : c.avgEngagement >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${c.avgEngagement}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={`
                                                    ${c.status === 'High' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : ''}
                                                    ${c.status === 'Medium' ? 'text-amber-700 bg-amber-50 border-amber-200' : ''}
                                                    ${c.status === 'Low' ? 'text-rose-700 bg-rose-50 border-rose-200' : ''}
                                                `}>{c.status}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Teacher-Wise Drill Drilldown */}
                    <div className="pt-4 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input
                                placeholder="Search teacher across network..."
                                className="max-w-xs bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Select value={campusFilter} onValueChange={setCampusFilter}>
                                <SelectTrigger className="w-[180px] bg-white">
                                    <SelectValue placeholder="All Campuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Campuses</SelectItem>
                                    {CAMPUS_OPTIONS.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Card className="shadow-sm border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">Teacher Name</th>
                                            <th className="px-6 py-4">Campus</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Courses Enrolled</th>
                                            <th className="px-6 py-4">Engagement %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredTeachers.slice(0, 50).map(teacher => ( // Limit view if large list for UI performance
                                            <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{teacher.name}</div>
                                                    <div className="text-xs text-gray-500">{teacher.email}</div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-700">{teacher.campusId}</td>
                                                <td className="px-6 py-4 text-gray-600">{teacher.role}</td>
                                                <td className="px-6 py-4 font-medium">{teacher.coursesEnrolled}</td>
                                                <td className="px-6 py-4 font-bold text-indigo-600">{teacher.engagementPercent}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                </div>
            )}

            {/* --- SECTION 2: Learning Festival Application Demand --- */}
            {activeTab === 'applications' && (
                <div className="space-y-6 animate-in fade-in">

                    {/* Overall Summary */}
                    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-none shadow-sm">
                        <CardContent className="p-6 flex flex-col md:flex-row gap-6 justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-indigo-900">Network-Wide Festival Demand</h3>
                                <p className="text-sm text-indigo-700/70">Total application breakdown</p>
                            </div>
                            <div className="flex gap-8">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-indigo-600">{festivalApps.length}</p>
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Received</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-blue-600">{campusApplicationData.length}</p>
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Campuses Applied</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-yellow-600">{campusApplicationData.reduce((acc, c) => acc + c.underReview, 0)}</p>
                                    <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Pending Campus Review</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Campus-Wise Breakdowns */}
                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50/50 border-b">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-purple-500" />
                                Demand by Campus
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white text-gray-600 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">Campus Name</th>
                                        <th className="px-6 py-4">Total Applications</th>
                                        <th className="px-6 py-4">Under Review</th>
                                        <th className="px-6 py-4 text-emerald-600">Shortlisted</th>
                                        <th className="px-6 py-4 text-rose-600">Rejected</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {campusApplicationData.map(c => (
                                        <tr key={c.campusId} className="hover:bg-purple-50/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-indigo-900">{c.campusId}</td>
                                            <td className="px-6 py-4 font-bold text-purple-700">{c.total}</td>
                                            <td className="px-6 py-4 font-medium text-amber-600">{c.underReview}</td>
                                            <td className="px-6 py-4 font-medium text-emerald-600">{c.shortlisted}</td>
                                            <td className="px-6 py-4 font-medium text-rose-600">{c.rejected}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* --- SECTION 3: Shortlisted Outcomes --- */}
            {activeTab === 'shortlisted' && (
                <div className="space-y-6 animate-in fade-in">

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input
                            placeholder="Search shortlisted teacher..."
                            className="max-w-xs bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Select value={campusFilter} onValueChange={setCampusFilter}>
                            <SelectTrigger className="w-[180px] bg-white">
                                <SelectValue placeholder="All Campuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Campuses</SelectItem>
                                {CAMPUS_OPTIONS.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Teacher Name</th>
                                        <th className="px-6 py-4">Campus</th>
                                        <th className="px-6 py-4">Festival Name</th>
                                        <th className="px-6 py-4">Current Status</th>
                                        <th className="px-6 py-4">Campus Remarks (Read-Only)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {shortlistedApps.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-8 text-gray-400">No shortlisted teachers found.</td></tr>
                                    ) : (
                                        shortlistedApps.map(app => (
                                            <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900">{app.user?.fullName}</td>
                                                <td className="px-6 py-4 text-gray-600 font-medium">{app.user?.campusId}</td>
                                                <td className="px-6 py-4 font-medium">{app.festival?.name}</td>
                                                <td className="px-6 py-4">
                                                    <Badge className="bg-emerald-600 hover:bg-emerald-600">{app.status}</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate">{app.feedback || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

        </div>
    );
}

