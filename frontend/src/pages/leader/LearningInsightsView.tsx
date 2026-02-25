import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Award, BookOpen, Target, CheckCircle2, TrendingUp, Calendar, ChevronRight, FileText, Download, UserCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import { analyticsService } from '@/services/analyticsService';
import { learningFestivalService, LearningFestivalApplication } from '@/services/learningFestivalService';

export function LearningInsightsView() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const role = user?.role || 'TEACHER';

    // State for Self-Paced Learning Engagement
    const [engagementSummary, setEngagementSummary] = useState<any>(null);
    const [teachersStats, setTeachersStats] = useState<any[]>([]);

    // State for Learning Festival Applications
    const [festivalApps, setFestivalApps] = useState<LearningFestivalApplication[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'engagement' | 'applications' | 'shortlisted'>('engagement');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Dialog state for viewing/reviewing an app
    const [selectedApp, setSelectedApp] = useState<LearningFestivalApplication | null>(null);
    const [feedback, setFeedback] = useState('');

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

            setEngagementSummary(engagementData.summary);
            setTeachersStats(engagementData.teachers);
            setFestivalApps(appsData);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load learning insights.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        if (!selectedApp) return;
        try {
            const updated = await learningFestivalService.updateApplicationStatus(selectedApp.id, {
                status,
                feedback
            });
            setFestivalApps(prev => prev.map(a => a.id === updated.id ? updated : a));
            toast.success(`Application marked as ${status}`);
            setSelectedApp(null);
            setFeedback('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Submitted': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Submitted</Badge>;
            case 'Under Review': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
            case 'Shortlisted': return <Badge className="bg-green-600">Shortlisted</Badge>;
            case 'Confirmed': return <Badge className="bg-emerald-600">Confirmed</Badge>;
            case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Filter Logic
    const filteredTeachers = teachersStats.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchRole = roleFilter === 'all' || t.role === roleFilter;
        return matchSearch && matchRole;
    }).sort((a, b) => b.engagementPercent - a.engagementPercent);

    const filteredApps = festivalApps.filter(a => {
        const matchSearch = String(a.user?.fullName).toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = statusFilter === 'all' || a.status === statusFilter;
        // The AC/HOS roles only see their campus anyway due to backend filtering
        return matchSearch && matchStatus;
    });

    const shortlistedApps = festivalApps.filter(a => a.status === 'Shortlisted' || a.status === 'Confirmed');

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
                    title="Learning Insights"
                    subtitle={`Campus-wide professional development overview for ${user?.campusId || 'your campus'}.`}
                />
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Report
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
                    Learning Festival Applications
                </Button>
                <Button
                    variant={activeTab === 'shortlisted' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('shortlisted')}
                    className="gap-2 rounded-md"
                >
                    <Target className="w-4 h-4" />
                    Shortlisted Applications
                </Button>
            </div>

            {/* --- SECTION 1: Self Paced Engagement --- */}
            {activeTab === 'engagement' && (
                <div className="space-y-6 animate-in fade-in">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-white shadow-sm border-none">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-gray-500 uppercase">Campus Average Engagement</p>
                                        <h3 className="text-3xl font-black text-blue-900 mt-2">
                                            {engagementSummary?.campusAverageEngagement || 0}%
                                        </h3>
                                    </div>
                                    <TrendingUp className="w-6 h-6 text-blue-400" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-gray-100">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Teachers Enrolled</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                            {engagementSummary?.totalTeachersEnrolled || 0}
                                        </h3>
                                    </div>
                                    <BookOpen className="w-5 h-5 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-gray-100">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Teachers Active</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                            {engagementSummary?.totalTeachersActive || 0}
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
                                        <p className="text-sm font-medium text-gray-500">Avg Completion Rate</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                            {engagementSummary?.averageCourseCompletionRate || 0}%
                                        </h3>
                                    </div>
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Teacher Table Controls */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <Input
                                placeholder="Search by teacher name..."
                                className="pl-9 bg-gray-50 border-transparent"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Filter by Department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                <SelectItem value="Mathematics Teacher">Mathematics</SelectItem>
                                <SelectItem value="Science Teacher">Science</SelectItem>
                                <SelectItem value="English Teacher">English</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Teacher Table */}
                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Teacher Name</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Courses Enrolled</th>
                                        <th className="px-6 py-4">Courses Completed</th>
                                        <th className="px-6 py-4">Engagement %</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredTeachers.map(teacher => (
                                        <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{teacher.name}</div>
                                                <div className="text-xs text-gray-500">{teacher.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{teacher.role}</td>
                                            <td className="px-6 py-4 font-medium">{teacher.coursesEnrolled}</td>
                                            <td className="px-6 py-4 font-medium text-emerald-600">{teacher.coursesCompleted}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                                                        <div
                                                            className="bg-primary h-2 rounded-full"
                                                            style={{ width: `${teacher.engagementPercent}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="font-medium text-gray-700">{teacher.engagementPercent}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {teacher.isActive ? (
                                                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Active</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* --- SECTION 2: Festival Applications --- */}
            {activeTab === 'applications' && (
                <div className="space-y-6 animate-in fade-in">

                    {/* Overview Strip */}
                    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-none shadow-sm">
                        <CardContent className="p-6 flex flex-col md:flex-row gap-6 justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-indigo-900">Learning Festival Overview</h3>
                                <p className="text-sm text-indigo-700/70">Campus applications summary</p>
                            </div>
                            <div className="flex gap-8">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-indigo-600">{filteredApps.length}</p>
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Campus Apps</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-green-600">{shortlistedApps.length}</p>
                                    <p className="text-xs font-bold text-green-400 uppercase tracking-wider">Shortlisted</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-yellow-600">{filteredApps.filter(a => a.status === 'Submitted' || a.status === 'Under Review').length}</p>
                                    <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Pending Review</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row gap-4">
                        <Input
                            placeholder="Search applicant name..."
                            className="max-w-xs bg-gray-50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Submitted">Submitted</SelectItem>
                                <SelectItem value="Under Review">Under Review</SelectItem>
                                <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Teacher Name</th>
                                        <th className="px-6 py-4">Learning Festival Name</th>
                                        <th className="px-6 py-4">Application Date</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredApps.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-8 text-gray-400">No applications found.</td></tr>
                                    ) : (
                                        filteredApps.map(app => (
                                            <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{app.user?.fullName}</div>
                                                    <div className="text-xs text-gray-500">{app.user?.role}</div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-700">{app.festival?.name}</td>
                                                <td className="px-6 py-4 text-gray-500">{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}</td>
                                                <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)}>
                                                        View Details
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* --- SECTION 3: Shortlisted Applications --- */}
            {activeTab === 'shortlisted' && (
                <div className="space-y-6 animate-in fade-in">
                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Teacher Name</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Festival Name</th>
                                        <th className="px-6 py-4">Final Status</th>
                                        <th className="px-6 py-4">Remarks</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {shortlistedApps.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-gray-400">No shortlisted teachers found.</td></tr>
                                    ) : (
                                        shortlistedApps.map(app => (
                                            <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900">{app.user?.fullName}</td>
                                                <td className="px-6 py-4 text-gray-500">{app.user?.role}</td>
                                                <td className="px-6 py-4 font-medium">{app.festival?.name}</td>
                                                <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                                                <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate">{app.feedback || '-'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)}>
                                                        View
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* Application Review Dialog common across tabs */}
            {selectedApp && (
                <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Review Application Details</DialogTitle>
                            <DialogDescription>
                                Applicant: <strong>{selectedApp.user?.fullName}</strong> ({selectedApp.user?.campusId})
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4 text-sm">
                            <div className="space-y-2">
                                <p className="font-bold text-gray-500 uppercase">Preferred Strand</p>
                                <p className="font-medium text-gray-900">{selectedApp.preferredStrand || 'None Selected'}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="font-bold text-gray-500 uppercase">Statement of Purpose</p>
                                <div className="p-4 bg-gray-50 rounded-xl text-gray-800 leading-relaxed border whitespace-pre-wrap">
                                    {selectedApp.statementOfPurpose}
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t">
                                <label className="font-bold text-gray-900">Internal Remarks</label>
                                <Textarea
                                    placeholder="Add notes for the internal review..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                            <Button variant="outline" className="sm:mr-auto" onClick={() => setSelectedApp(null)}>
                                Close
                            </Button>

                            {/* Allow recommending / marking if role permits. Usually HOS can only Recommend or Reject */}
                            <Button variant="destructive" onClick={() => handleUpdateStatus('Rejected')}>
                                Reject
                            </Button>
                            <Button className="bg-primary hover:bg-primary/90" onClick={() => handleUpdateStatus('Shortlisted')}>
                                Recommend / Shortlist
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

        </div>
    );
}

