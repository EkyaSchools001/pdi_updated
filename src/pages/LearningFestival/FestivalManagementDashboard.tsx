import React, { useState, useEffect } from 'react';
import { learningFestivalService, LearningFestival, LearningFestivalApplication } from '@/services/learningFestivalService';
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
import { Search, Filter, CheckCircle2, XCircle, Award, Target, FileText, Download } from 'lucide-react';
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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fests, apps] = await Promise.all([
                learningFestivalService.getFestivals(),
                learningFestivalService.getApplications()
            ]);
            setFestivals(fests);
            setApplications(apps);

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

    return (
        <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Learning Festival Tracker"
                    subtitle={isAdminOrMgmt ? "Strategic overview and application management across all campuses." : `Manage learning festival applications for ${user?.campusId || 'your campus'}.`}
                />

                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                    {isAdminOrMgmt && (
                        <Button className="bg-primary hover:bg-primary/90 gap-2">
                            <Award className="w-4 h-4" />
                            Create Festival
                        </Button>
                    )}
                </div>
            </div>

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

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4">
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
        </div>
    );
}
