import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Video,
    Save,
    Calendar,
    Clock,
    Link as LinkIcon,
    MapPin,
    Users,
    ChevronLeft,
    CheckCircle,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { meetingService } from '@/services/meetingService';
import { userService, User } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Role } from '@/components/RoleBadge';

const MEETING_TYPES = [
    'Staff Meeting',
    'Department Meeting',
    'Management Meeting',
    'Academic Review',
    'Curriculum Planning',
    'PD Session',
    'Other'
];

export function CreateMeetingForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        meetingType: '',
        description: '',
        meetingDate: '',
        startTime: '',
        endTime: '',
        mode: 'Online' as 'Online' | 'Offline',
        locationLink: '',
        attendees: [] as string[]
    });

    useEffect(() => {
        fetchUsers();
        if (id) {
            fetchMeetingDetails();
        }
    }, [id]);

    const fetchMeetingDetails = async () => {
        try {
            setFetching(true);
            const meeting = await meetingService.getMeetingById(id!);
            setFormData({
                title: meeting.title,
                meetingType: meeting.meetingType,
                description: meeting.description || '',
                meetingDate: format(new Date(meeting.meetingDate), 'yyyy-MM-dd'),
                startTime: meeting.startTime,
                endTime: meeting.endTime,
                mode: meeting.mode as any,
                locationLink: meeting.locationLink || '',
                attendees: meeting.attendees?.map((a: any) => a.userId) || []
            });
        } catch (error) {
            console.error('Failed to fetch meeting details', error);
            toast.error('Failed to load meeting details');
        } finally {
            setFetching(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const users = await userService.getAllUsers();
            setAllUsers(users);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const handleInviteToggle = (userId: string) => {
        setFormData(prev => ({
            ...prev,
            attendees: prev.attendees.includes(userId)
                ? prev.attendees.filter(id => id !== userId)
                : [...prev.attendees, userId]
        }));
    };

    const handleSubmit = async (status: 'Draft' | 'Scheduled') => {
        if (!formData.title || !formData.meetingType || !formData.meetingDate || !formData.startTime || !formData.endTime) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            if (id) {
                await meetingService.updateMeeting(id, {
                    ...formData,
                    status
                } as any);
                toast.success(`Meeting updated successfully`);
            } else {
                await meetingService.createMeeting({
                    ...formData,
                    status
                } as any);
                toast.success(`Meeting ${status === 'Draft' ? 'saved as draft' : 'scheduled'} successfully`);
            }
            navigate('/meetings');
        } catch (error) {
            console.error('Failed to create meeting', error);
            toast.error('Failed to create meeting. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role={(user?.role?.toLowerCase() || 'teacher') as Role} userName={user?.fullName || 'User'}>
            <div className="container mx-auto py-8 px-4 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/meetings')}
                    className="mb-6 hover:bg-gray-100"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>

                <PageHeader
                    title="Schedule New Meeting"
                    subtitle="Organize a professional development session or department review."
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* SECTION 1 – Basic Details */}
                        <Card className="p-6 space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Info className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-lg">Basic Details</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Meeting Title <span className="text-red-500">*</span></Label>
                                    <Input
                                        placeholder="Enter subject or title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Meeting Type <span className="text-red-500">*</span></Label>
                                        <Select
                                            onValueChange={(val) => setFormData({ ...formData, meetingType: val })}
                                            value={formData.meetingType}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MEETING_TYPES.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Campus</Label>
                                        <Input value={user?.campusId || 'Self'} disabled className="bg-gray-50" />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* SECTION 2 – Schedule & Location */}
                        <Card className="p-6 space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Calendar className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-lg">Schedule & Location</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Date <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="date"
                                        value={formData.meetingDate}
                                        onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Start <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">End <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Mode <span className="text-red-500">*</span></Label>
                                    <Select
                                        onValueChange={(val: any) => setFormData({ ...formData, mode: val })}
                                        value={formData.mode}
                                    >
                                        <SelectTrigger>
                                            <Video className="w-4 h-4 mr-2" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Online">Online (Microsoft Teams)</SelectItem>
                                            <SelectItem value="Offline">Offline (In-Person)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">
                                        {formData.mode === 'Online' ? 'Meeting Link' : 'Location / Room'}
                                    </Label>
                                    <div className="relative">
                                        {formData.mode === 'Online' ? <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" /> : <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />}
                                        <Input
                                            className="pl-10"
                                            placeholder={formData.mode === 'Online' ? 'https://teams.microsoft.com/...' : 'Executive Conference Room'}
                                            value={formData.locationLink}
                                            onChange={(e) => setFormData({ ...formData, locationLink: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label className="text-sm font-semibold">Description (Optional)</Label>
                                <Textarea
                                    placeholder="Briefly describe the purpose of this meeting..."
                                    className="min-h-[100px]"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        {/* SECTION 3 – Add Attendees */}
                        <Card className="p-6 space-y-6 sticky top-8">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Users className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-lg">Invite Attendees</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Input placeholder="Search staff members..." className="bg-gray-50" />
                                </div>

                                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                                    {allUsers.map((u) => (
                                        <div
                                            key={u.id}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${formData.attendees.includes(u.id)
                                                ? 'bg-primary/5 border-primary shadow-sm'
                                                : 'bg-white border-gray-100 hover:border-primary/50'
                                                }`}
                                            onClick={() => handleInviteToggle(u.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${formData.attendees.includes(u.id) ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                                                    }`}>
                                                    {u.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold leading-none">{u.fullName}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{u.role} • {u.department || 'General'}</p>
                                                </div>
                                            </div>
                                            {formData.attendees.includes(u.id) && (
                                                <CheckCircle className="w-4 h-4 text-primary" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 space-y-3">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleSubmit('Draft')}
                                        disabled={loading}
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Draft
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={() => handleSubmit('Scheduled')}
                                        disabled={loading}
                                    >
                                        Schedule
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
