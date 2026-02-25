import React, { useState, useEffect } from 'react';
import { learningFestivalService, LearningFestival, LearningFestivalApplication } from '@/services/learningFestivalService';
import { analyticsService } from '@/services/analyticsService';
import { useAuth } from '@/hooks/useAuth';

import { Role } from '@/components/RoleBadge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Search, Filter, CheckCircle2, XCircle, Award, Target, FileText, Download, ArrowLeft, BookOpen, TrendingUp, UserCircle, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function FestivalManagementDashboard() {
    const { user } = useAuth();
    const role = user?.role || 'TEACHER';

    const [festivals, setFestivals] = useState<LearningFestival[]>([]);
    const [applications, setApplications] = useState<LearningFestivalApplication[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedFestival, setSelectedFestival] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedApp, setSelectedApp] = useState<LearningFestivalApplication | null>(null);
    const [feedback, setFeedback] = useState('');

    const [activeTab, setActiveTab] = useState<'festival' | 'self-paced'>('festival');
    const [engagementSummary, setEngagementSummary] = useState<any>(null);
    const [teachersStats, setTeachersStats] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fests, apps, engagementData] = await Promise.all([
                learningFestivalService.getFestivals(),
                learningFestivalService.getApplications(),
                analyticsService.getCampusEngagement()
            ]);
            setFestivals(fests);
            setApplications(apps);
            setEngagementSummary(engagementData.summary);
            setTeachersStats(engagementData.teachers);

            if (fests.length > 0 && selectedFestival === 'all') {
                setSelectedFestival(fests[0].id);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load festival data.");
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
            setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
            toast.success(`Application marked as ${status}`);
            setSelectedApp(null);
            setFeedback('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    const filteredApps = applications.filter(app => {
        const matchFest = selectedFestival === 'all' || app.festivalId === selectedFestival;
        const matchStatus = statusFilter === 'all' || app.status === statusFilter;
        const matchSearch = (app.user?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.user?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchFest && matchStatus && matchSearch;
    });

    // Counts for stat cards
    const totalApps = filteredApps.length;
    const shortlistedCount = filteredApps.filter(a => a.status === 'Shortlisted').length;
    const confirmedCount = filteredApps.filter(a => a.status === 'Confirmed').length;

    // Check if user has permission to manage festival events globally
    const isAdminOrMgmt = ['ADMIN', 'SUPERADMIN', 'MANAGEMENT'].includes(role);

    // Group applications by campus
    const appsByCampus = filteredApps.reduce((acc, app) => {
        const campus = app.user?.campusId || 'Main Campus';
        if (!acc[campus]) {
            acc[campus] = { total: 0, shortlisted: 0 };
        }
        acc[campus].total += 1;
        if (app.status === 'Shortlisted' || app.status === 'Confirmed') {
            acc[campus].shortlisted += 1;
        }
        return acc;
    }, {} as Record<string, { total: number; shortlisted: number }>);

    // Self-paced learning filtering
    const [roleFilter, setRoleFilter] = useState('all');
    const filteredTeachers = teachersStats.filter(t => {
        const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchRole = roleFilter === 'all' || t.role === roleFilter;
        return matchSearch && matchRole;
    }).sort((a, b) => b.engagementPercent - a.engagementPercent);

    const handleExportCSV = () => {
        if (filteredApps.length === 0) {
            toast.error("No applications to export.");
            return;
        }

        const headers = ['Applicant Name', 'Email', 'Campus', 'Festival', 'Strand', 'Status', 'Submitted At'];

        const csvRows = filteredApps.map(app => [
            `"${app.user?.fullName || ''}"`,
            `"${app.user?.email || ''}"`,
            `"${app.user?.campusId || ''}"`,
            `"${festivals.find(f => f.id === app.festivalId)?.title || app.festivalId}"`,
            `"${app.preferredStrand || ''}"`,
            `"${app.status || ''}"`,
            `"${app.createdAt ? format(new Date(app.createdAt), 'MMM dd, yyyy') : ''}"`
        ]);

        const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `learning_festival_applications_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Exported successfuly!");
    };

    return (
        <div className="container mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        // Dynamically route back based on user role
                        if (role === 'SUPERADMIN' || role === 'ADMIN') {
                            window.location.href = '/admin/courses';
                        } else {
                            window.location.href = '/leader/courses';
                        }
                    }}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Courses
                </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Learning Festival Tracker"
                    subtitle={isAdminOrMgmt ? "Strategic overview and application management across all campuses." : `Manage learning festival applications for ${user?.campusId || 'your campus'}.`}
                />

                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-muted/50 rounded-lg w-fit">
                <Button
                    variant={activeTab === 'festival' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('festival')}
                    className="gap-2 rounded-md"
                >
                    <Award className="w-4 h-4" />
                    Learning Festival
                </Button>
                <Button
                    variant={activeTab === 'self-paced' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('self-paced')}
                    className="gap-2 rounded-md"
                >
                    <BookOpen className="w-4 h-4" />
                    Self-Paced Learning
                </Button>
            </div>

            {activeTab === 'festival' && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-blue-50 to-white border-none shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-gray-500 uppercase">Total Applications</p>
                                        <h3 className="text-3xl font-black text-blue-900 mt-2">{totalApps}</h3>
                                    </div>
                                    <div className="p-3 bg-blue-100/50 rounded-xl text-blue-600">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-white border-none shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-gray-500 uppercase">Shortlisted</p>
                                        <h3 className="text-3xl font-black text-green-700 mt-2">{shortlistedCount}</h3>
                                    </div>
                                    <div className="p-3 bg-green-100/50 rounded-xl text-green-600">
                                        <Target className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-50 to-white border-none shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-bold text-gray-500 uppercase">Confirmed Participants</p>
                                        <h3 className="text-3xl font-black text-emerald-800 mt-2">{confirmedCount}</h3>
                                    </div>
                                    <div className="p-3 bg-emerald-100/50 rounded-xl text-emerald-600">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Campus-wise Festival Analytics (For Admins/Mgmt) */}
                    {isAdminOrMgmt && Object.keys(appsByCampus).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            {Object.entries(appsByCampus).map(([campus, stats]) => (
                                <Card key={campus} className="shadow-sm border-gray-100 bg-white hover:border-blue-100 transition-colors">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                                            <Target className="w-4 h-4 text-blue-500" />
                                            {campus}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg">
                                                <span className="text-xs font-medium text-gray-600">Total Apps Received</span>
                                                <span className="font-bold text-blue-700">{stats.total}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-green-50/50 p-2 rounded-lg">
                                                <span className="text-xs font-medium text-gray-600">Shortlisted Apps</span>
                                                <span className="font-bold text-green-700">{stats.shortlisted}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4 mt-6">
                        <div className="flex-1 relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <Input
                                placeholder="Search by teacher name or email..."
                                className="pl-9 bg-gray-50 border-transparent focus-visible:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Select value={selectedFestival} onValueChange={setSelectedFestival}>
                            <SelectTrigger className="w-full md:w-[250px] bg-white">
                                <SelectValue placeholder="Select Festival" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Festivals</SelectItem>
                                {festivals.map(f => (
                                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[180px] bg-white">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Submitted">Submitted</SelectItem>
                                <SelectItem value="Under Review">Under Review</SelectItem>
                                <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                                <SelectItem value="Confirmed">Confirmed</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Data Table */}
                    <Card className="shadow-sm border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Applicant Profile</th>
                                        {isAdminOrMgmt && <th className="px-6 py-4">Campus</th>}
                                        <th className="px-6 py-4">Selected Strand</th>
                                        <th className="px-6 py-4">Applied Date</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-gray-400">Loading applications...</td>
                                        </tr>
                                    ) : filteredApps.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-gray-400">
                                                No applications match the given criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredApps.map(app => (
                                            <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{app.user?.fullName}</div>
                                                    <div className="text-xs text-gray-500">{app.user?.email}</div>
                                                </td>
                                                {isAdminOrMgmt && (
                                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                                        {app.user?.campusId || 'Main Campus'}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                                                        {app.preferredStrand || 'N/A'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {app.appliedAt ? format(new Date(app.appliedAt), 'MMM dd, yyyy') : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={
                                                        app.status === 'Shortlisted' ? 'default' :
                                                            app.status === 'Confirmed' ? 'default' :
                                                                app.status === 'Rejected' ? 'destructive' :
                                                                    app.status === 'Under Review' ? 'secondary' : 'outline'
                                                    } className={
                                                        app.status === 'Confirmed' ? 'bg-emerald-600' :
                                                            app.status === 'Shortlisted' ? 'bg-green-600' : ''
                                                    }>
                                                        {app.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)}>
                                                        Review
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Review Dialog */}
                    {selectedApp && (
                        <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Review Application</DialogTitle>
                                    <DialogDescription>
                                        Applicant: <strong>{selectedApp.user?.fullName}</strong> ({selectedApp.user?.campusId})
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-4">
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-gray-500 uppercase">Preferred Strand</p>
                                        <p className="font-medium text-gray-900">{selectedApp.preferredStrand || 'None Selected'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-gray-500 uppercase">Statement of Purpose</p>
                                        <div className="p-4 bg-gray-50 rounded-xl text-gray-800 text-sm leading-relaxed border">
                                            {selectedApp.statementOfPurpose}
                                        </div>
                                    </div>
                                    {selectedApp.relevantExperience && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-bold text-gray-500 uppercase">Relevant Experience</p>
                                            <div className="p-4 bg-gray-50 rounded-xl text-gray-800 text-sm leading-relaxed border">
                                                {selectedApp.relevantExperience}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3 pt-4 border-t">
                                        <label className="text-sm font-bold text-gray-900">Reviewer Feedback (Optional)</label>
                                        <Textarea
                                            placeholder="Add notes for the teacher or internal review..."
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                                    <Button variant="outline" className="sm:mr-auto" onClick={() => setSelectedApp(null)}>
                                        Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={() => handleUpdateStatus('Rejected')}>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                    {(role === 'ADMIN' || role === 'SUPERADMIN' || role === 'MANAGEMENT') && selectedApp.status === 'Shortlisted' ? (
                                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateStatus('Confirmed')}>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Confirm Selection
                                        </Button>
                                    ) : (
                                        <Button className="bg-primary hover:bg-primary/90" onClick={() => handleUpdateStatus('Shortlisted')}>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Shortlist
                                        </Button>
                                    )}
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </>
            )}

            {activeTab === 'self-paced' && (
                <div className="space-y-6">
                    {/* Engagement Overview KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-indigo-50 to-white border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-gray-500 uppercase">System Avg Engagement</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-indigo-700">
                                    {engagementSummary?.campusAverageEngagement || 0}%
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Average course completion rate</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-white border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-gray-500 uppercase">Enrolled Teachers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-blue-700">
                                    {engagementSummary?.totalTeachersEnrolled || 0}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Teachers tracking self-paced goals</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-white border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-gray-500 uppercase">Active Participants</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-green-700">
                                    {engagementSummary?.totalTeachersActive || 0}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Recently active on platform</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters for Self-Paced */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <Input
                                placeholder="Search teachers..."
                                className="pl-9 bg-gray-50/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <select
                                    className="pl-9 h-10 w-[180px] rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="Primary Teacher">Primary</option>
                                    <option value="Middle School Teacher">Middle School</option>
                                    <option value="Senior School Teacher">Senior School</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Teachers Engagement Table */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/80 text-gray-500 uppercase text-xs font-semibold border-b">
                                    <tr>
                                        <th className="px-6 py-4">Teacher Profile</th>
                                        {isAdminOrMgmt && <th className="px-6 py-4">Campus</th>}
                                        <th className="px-6 py-4">Courses Enrolled</th>
                                        <th className="px-6 py-4">Completed</th>
                                        <th className="px-6 py-4">Engagement %</th>
                                        <th className="px-6 py-4 text-right">Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTeachers.map((teacher: any) => (
                                        <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                                                        {teacher.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{teacher.name}</p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <UserCircle className="w-3 h-3" />
                                                            {teacher.role || 'Teacher'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            {isAdminOrMgmt && (
                                                <td className="px-6 py-4 text-gray-600 font-medium">
                                                    {teacher.campus || 'N/A'}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-gray-600 font-mono">
                                                {teacher.coursesEnrolled}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-mono">
                                                {teacher.coursesCompleted}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-full bg-gray-100 rounded-full h-2 max-w-[100px]">
                                                        <div
                                                            className={`h-2 rounded-full ${teacher.engagementPercent >= 75 ? 'bg-green-500' :
                                                                teacher.engagementPercent >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${Math.min(teacher.engagementPercent, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="font-bold text-gray-700 font-mono">{teacher.engagementPercent}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Badge variant={teacher.isActive ? 'default' : 'secondary'} className={teacher.isActive ? 'bg-emerald-100 text-emerald-800' : ''}>
                                                    {teacher.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTeachers.length === 0 && (
                                        <tr>
                                            <td colSpan={isAdminOrMgmt ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <BookOpen className="w-12 h-12 text-gray-300" />
                                                    <p className="text-lg font-medium">No engagement data found</p>
                                                    <p className="text-sm">Adjust your filters to see more results.</p>
                                                </div>
                                            </td>
                                        </tr>
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

