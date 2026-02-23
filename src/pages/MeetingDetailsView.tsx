import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Calendar,
    Clock,
    MapPin,
    Video,
    Users,
    FileText,
    CheckCircle2,
    Link as LinkIcon,
    User,
    Info,
    History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { meetingService, Meeting } from '@/services/meetingService';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Role } from '@/components/RoleBadge';
import { toast } from 'sonner';

export function MeetingDetailsView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchMeetingDetails();
        }
    }, [id]);

    const fetchMeetingDetails = async () => {
        try {
            setLoading(true);
            const data = await meetingService.getMeetingById(id!);
            setMeeting(data);
        } catch (error) {
            console.error('Failed to fetch meeting details', error);
            toast.error('Failed to load meeting details');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        try {
            await meetingService.completeMeeting(id!);
            toast.success('Meeting marked as completed');
            fetchMeetingDetails();
        } catch (error) {
            console.error('Failed to complete meeting', error);
            toast.error('Failed to mark meeting as completed');
        }
    };

    if (loading) {
        return (
            <DashboardLayout role={(user?.role?.toLowerCase() || 'teacher') as Role} userName={user?.fullName || 'User'}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!meeting) {
        return (
            <DashboardLayout role={(user?.role?.toLowerCase() || 'teacher') as Role} userName={user?.fullName || 'User'}>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <History className="w-16 h-16 text-gray-300 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Meeting Not Found</h2>
                    <p className="text-gray-500 mt-2">The meeting you are looking for does not exist or has been removed.</p>
                    <Button onClick={() => navigate('/meetings')} className="mt-6">
                        Back to Meetings
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const isCreator = meeting.createdById === user?.id;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    const canManage = isCreator || isAdmin;

    return (
        <DashboardLayout role={(user?.role?.toLowerCase() || 'teacher') as Role} userName={user?.fullName || 'User'}>
            <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
                {/* Navigation & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/meetings')}
                        className="w-fit -ml-2 hover:bg-primary/5 text-gray-600"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back to Meetings
                    </Button>
                    <div className="flex items-center gap-3">
                        {canManage && (meeting.status === 'Scheduled' || meeting.status === 'Ongoing') && (
                            <Button
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary/5"
                                onClick={handleComplete}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Mark Completed
                            </Button>
                        )}
                        {canManage && meeting.status === 'Draft' && (
                            <Button variant="outline" onClick={() => navigate(`/meetings/edit/${meeting.id}`)}>
                                Edit Meeting
                            </Button>
                        )}
                        {(canManage || meeting.momStatus === 'Published') && meeting.status === 'Completed' && (
                            <Button
                                className="bg-primary hover:bg-primary/90"
                                onClick={() => navigate(`/meetings/${meeting.id}/mom`)}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                {meeting.momStatus === 'Published' ? 'View MoM' : 'Create/Edit MoM'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Header Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Badge variant={meeting.status === 'Completed' ? 'default' : meeting.status === 'Draft' ? 'secondary' : 'outline'} className="px-3 py-1">
                            {meeting.status}
                        </Badge>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1">
                            {meeting.meetingType}
                        </Badge>
                    </div>
                    <PageHeader
                        title={meeting.title}
                        subtitle={meeting.description || 'No description provided for this meeting.'}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="overflow-hidden border-none shadow-md">
                            <div className="bg-primary/5 p-6 border-b border-primary/10">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Info className="w-5 h-5 text-primary" />
                                    Meeting Information
                                </h3>
                            </div>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Date</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">
                                                    {format(new Date(meeting.meetingDate), 'EEEE, MMMM do, yyyy')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Time</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">
                                                    {meeting.startTime} - {meeting.endTime}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-green-50 text-green-600">
                                                {meeting.mode === 'Online' ? <Video className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">
                                                    {meeting.mode === 'Online' ? 'Meeting Link' : 'Location'}
                                                </p>
                                                <div className="mt-1">
                                                    {meeting.mode === 'Online' && meeting.locationLink ? (
                                                        <a
                                                            href={meeting.locationLink.startsWith('http') ? meeting.locationLink : `https://${meeting.locationLink}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:underline font-bold flex items-center gap-1"
                                                        >
                                                            Join Microsoft Teams
                                                            <LinkIcon className="w-3 h-3" />
                                                        </a>
                                                    ) : (
                                                        <p className="text-base font-bold text-gray-900">
                                                            {meeting.locationLink || (meeting.mode === 'Online' ? 'TBD' : 'Main Office')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Organizer</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">
                                                    {meeting.createdBy?.fullName || 'Internal'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Attendees List */}
                        <Card className="border-none shadow-md overflow-hidden">
                            <div className="bg-gray-50 p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Users className="w-5 h-5 text-gray-500" />
                                    Invited Attendees
                                </h3>
                                <Badge variant="secondary" className="px-3">
                                    {meeting.attendees?.length || 0} Total
                                </Badge>
                            </div>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
                                    {meeting.attendees?.length === 0 ? (
                                        <div className="col-span-2 p-12 text-center text-gray-400 italic">
                                            No specific attendees invited yet.
                                        </div>
                                    ) : (
                                        meeting.attendees?.map((att, idx) => (
                                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {att.user.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{att.user.fullName}</p>
                                                        <p className="text-xs text-gray-500">{att.user.role} • {att.user.department || 'General'}</p>
                                                    </div>
                                                </div>
                                                <CheckCircle2 className="w-4 h-4 text-green-500 opacity-50" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar / Quick Actions */}
                    <div className="space-y-6">
                        <Card className="bg-gray-900 text-white border-none shadow-xl overflow-hidden p-6">
                            <h4 className="font-bold text-lg mb-4">Meeting Status</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">Status</span>
                                    <Badge className="bg-primary text-white border-none">
                                        {meeting.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">MoM Status</span>
                                    <Badge variant="outline" className="text-white border-white/20">
                                        {meeting.momStatus || 'Not Started'}
                                    </Badge>
                                </div>
                                <div className="h-px bg-white/10 my-2" />
                                {meeting.status !== 'Completed' ? (
                                    <p className="text-xs text-gray-400 leading-relaxed italic">
                                        Once the meeting is concluded, the organizer will be able to record and publish the Minutes of Meeting (MoM).
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-400 leading-relaxed italic">
                                        Meeting has concluded. You can access the official Minutes of Meeting using the button below.
                                    </p>
                                )}
                                {(canManage || meeting.momStatus === 'Published') && meeting.status === 'Completed' && (
                                    <Button
                                        className="w-full bg-primary hover:bg-primary/90 mt-2"
                                        onClick={() => navigate(`/meetings/${meeting.id}/mom`)}
                                    >
                                        {meeting.momStatus === 'Published' ? 'View MoM' : 'Access MoM'}
                                    </Button>
                                )}
                            </div>
                        </Card>

                        <div className="p-6 bg-pink-50 rounded-2xl border border-pink-100">
                            <h4 className="font-bold text-pink-900 flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4" />
                                Participation
                            </h4>
                            <p className="text-sm text-pink-800/80 leading-relaxed">
                                Please ensure you attend at the scheduled time. For online sessions, use the join link provided in the details.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
