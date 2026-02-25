import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileText,
    Save,
    Send,
    Plus,
    Trash2,
    ChevronLeft,
    Users,
    CheckCircle2,
    MessageSquare,
    Paperclip,
    AlertCircle,
    Info,
    Calendar,
    Clock,
    MapPin,
    Share2,
    Lock,
    Eye,
    CheckSquare,
    Video,
    History as HistoryIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { meetingService, Meeting, MeetingActionItem } from '@/services/meetingService';
import { userService, User } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Role } from '@/components/RoleBadge';

const ROLES = ['TEACHER', 'LEADER', 'ADMIN', 'MANAGEMENT', 'COORDINATOR', 'HOS'];

export function MeetingMoMForm() {
    const { meetingId } = useParams<{ meetingId: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareData, setShareData] = useState({
        targetRoles: [] as string[],
        sendNotification: true
    });

    const [momData, setMomData] = useState({
        objective: '',
        agendaPoints: '',
        discussionSummary: '',
        decisions: '',
        attendanceCount: 0,
        attendanceSummary: '',
        departments: '',
        actionItems: [] as Partial<MeetingActionItem>[]
    });

    useEffect(() => {
        if (meetingId) {
            fetchData();
        }
    }, [meetingId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [meetingData, usersData] = await Promise.all([
                meetingService.getMeetingById(meetingId!),
                userService.getAllUsers()
            ]);

            setMeeting(meetingData);
            setAllUsers(usersData);

            if (meetingData.minutes) {
                setMomData({
                    objective: meetingData.minutes.objective || '',
                    agendaPoints: parseJSON(meetingData.minutes.agendaPoints),
                    discussionSummary: meetingData.minutes.discussionSummary || '',
                    decisions: parseJSON(meetingData.minutes.decisions),
                    attendanceCount: meetingData.minutes.attendanceCount || 0,
                    attendanceSummary: meetingData.minutes.attendanceSummary || '',
                    departments: parseJSON(meetingData.minutes.departments),
                    actionItems: meetingData.actionItems || []
                });
            } else {
                setMomData(prev => ({
                    ...prev,
                    attendanceCount: meetingData.attendees?.length || 0
                }));
            }
        } catch (error) {
            console.error('Failed to fetch MoM data', error);
            toast.error('Failed to load meeting details');
        } finally {
            setLoading(false);
        }
    };

    const parseJSON = (val: any) => {
        if (typeof val === 'string') {
            try { return val; } catch (e) { return val; }
        }
        return val;
    };

    const handleAddActionItem = () => {
        setMomData(prev => ({
            ...prev,
            actionItems: [
                ...prev.actionItems,
                { taskDescription: '', assignedTo: '', deadline: format(new Date(), 'yyyy-MM-dd'), priority: 'Medium', status: 'Pending' }
            ]
        }));
    };

    const handleRemoveActionItem = (index: number) => {
        setMomData(prev => ({
            ...prev,
            actionItems: prev.actionItems.filter((_, i) => i !== index)
        }));
    };

    const handleActionItemChange = (index: number, field: string, value: any) => {
        const newActionItems = [...momData.actionItems];
        newActionItems[index] = { ...newActionItems[index], [field]: value };
        setMomData(prev => ({ ...prev, actionItems: newActionItems }));
    };

    const handleSave = async (publish = false) => {
        if (!meeting) return;

        // Validation for Publish
        if (publish) {
            if (!momData.objective.trim() || !momData.discussionSummary.trim() || !momData.decisions.trim()) {
                toast.error('Please fill Objective, Discussion Summary, and Decisions before publishing.');
                return;
            }
        }

        try {
            setSaving(true);
            const payload: any = {
                ...momData,
                status: publish ? 'Published' : 'Draft'
            };

            if (meeting.minutes) {
                await meetingService.updateMoM(meetingId!, payload);
            } else {
                await meetingService.createMoM(meetingId!, payload);
            }

            if (publish) {
                await meetingService.publishMoM(meetingId!);
                toast.success('Minutes of Meeting Published Successfuly!');
                fetchData();
            } else {
                toast.success('Draft Saved Successfully');
                fetchData();
            }
        } catch (error) {
            console.error('Failed to save MoM', error);
            toast.error('Failed to save MoM');
        } finally {
            setSaving(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;

        try {
            await meetingService.addMoMReply(meetingId!, replyText);
            setReplyText('');
            toast.success('Reply added');
            fetchData();
        } catch (error) {
            toast.error('Failed to send reply');
        }
    };

    const handleShare = async () => {
        if (shareData.targetRoles.length === 0) {
            toast.error('Please select at least one role to share with.');
            return;
        }

        try {
            setSaving(true);
            await Promise.all(shareData.targetRoles.map(role =>
                meetingService.shareMoM(meetingId!, {
                    targetRole: role,
                    targetCampusId: meeting?.campusId,
                    sendNotification: shareData.sendNotification
                })
            ));
            toast.success(`MoM shared with ${shareData.targetRoles.length} roles.`);
            setIsShareModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to share MoM');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Analyzing meeting minutes context...</p>
        </div>
    );

    if (!meeting) return (
        <div className="p-12 text-center bg-red-50 rounded-2xl border border-red-100 max-w-2xl mx-auto my-20">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-red-900">Meeting Not Found</h2>
            <p className="text-red-700 mt-2">The meeting you are trying to access does not exist or has been removed.</p>
            <Button variant="outline" onClick={() => navigate('/meetings')} className="mt-6 border-red-200 text-red-700 hover:bg-red-100">
                Return to Meetings
            </Button>
        </div>
    );

    const isCreator = meeting.createdById === currentUser?.id;
    const isPublished = meeting.momStatus === 'Published';
    const canEdit = isCreator && (!isPublished || currentUser?.role === 'ADMIN');
    const isTeacher = currentUser?.role === 'TEACHER';
    const isManagement = currentUser?.role === 'MANAGEMENT';

    // Campus-based filtering for action items
    const filteredUsers = allUsers.filter(u => !meeting.campusId || u.campusId === meeting.campusId);

    return (
        <DashboardLayout role={(currentUser?.role?.toLowerCase() || 'teacher') as Role} userName={currentUser?.fullName || 'User'}>
            <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500 min-h-screen bg-gray-50/30">
                <div className="flex items-center justify-between mb-8 group">
                    <Button variant="ghost" onClick={() => navigate('/meetings')} className="hover:bg-primary/5 -ml-2">
                        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Button>

                    <div className="flex items-center gap-3">
                        {isPublished ? (
                            <Badge className="px-3 py-1 bg-green-600 hover:bg-green-700 animate-in zoom-in duration-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                PUBLISHED
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="px-3 py-1 bg-yellow-100 text-yellow-800 border-yellow-200">
                                <HistoryIcon className="w-3 h-3 mr-1" />
                                DRAFT
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                            {isPublished ? "Minutes of Meeting" : "Draft Minutes of Meeting"}
                        </h1>
                        <p className="text-gray-500 mt-2 flex items-center gap-2">
                            <Video className="w-4 h-4 text-primary" />
                            Official record for: <span className="font-semibold text-gray-800">{meeting.title}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {canEdit && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => handleSave(false)}
                                    disabled={saving}
                                    className="flex-1 md:flex-none border-primary/20 hover:bg-primary/5"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Draft
                                </Button>
                                <Button
                                    onClick={() => handleSave(true)}
                                    disabled={saving}
                                    className="flex-1 md:flex-none bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Publish MoM
                                </Button>
                            </>
                        )}
                        {(isPublished && (isCreator || currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGEMENT' || (currentUser?.role === 'LEADER' && currentUser.campusId === meeting.campusId))) && (
                            <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100">
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Share MoM
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Share Minutes of Meeting</DialogTitle>
                                        <DialogDescription>
                                            Share the published MoM with specific roles within your campus.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Select Roles</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {ROLES.map(role => (
                                                    <div key={role} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`role-${role}`}
                                                            checked={shareData.targetRoles.includes(role)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setShareData(prev => ({ ...prev, targetRoles: [...prev.targetRoles, role] }));
                                                                } else {
                                                                    setShareData(prev => ({ ...prev, targetRoles: prev.targetRoles.filter(r => r !== role) }));
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor={`role-${role}`} className="text-sm font-medium leading-none cursor-pointer">
                                                            {role}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 border-t pt-4">
                                            <Checkbox
                                                id="notify"
                                                checked={shareData.sendNotification}
                                                onCheckedChange={(checked) => setShareData(prev => ({ ...prev, sendNotification: !!checked }))}
                                            />
                                            <label htmlFor="notify" className="text-sm font-medium text-gray-500">
                                                Send in-app notification to all members of selected roles
                                            </label>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsShareModalOpen(false)}>Cancel</Button>
                                        <Button onClick={handleShare} disabled={saving}>Share Now</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* SECTION 1 – Auto-Filled Meeting Info (ReadOnly) */}
                        <Card className="p-0 border-none shadow-premium overflow-hidden bg-gradient-to-br from-white to-gray-50">
                            <div className="bg-primary/5 border-b border-primary/10 p-4 px-6">
                                <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Section 1: Meeting Metadata
                                </h3>
                            </div>
                            <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Meeting Type</p>
                                    <p className="font-bold text-gray-800">{meeting.meetingType}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Campus/Branch</p>
                                    <p className="font-bold text-gray-800">{meeting.campusId || 'Multiple / HO'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Date of Conduct</p>
                                    <p className="font-bold text-gray-800">{format(new Date(meeting.meetingDate), 'PPP')}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Meeting Organizer</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                            {meeting.createdBy?.fullName.charAt(0)}
                                        </div>
                                        <p className="font-bold text-gray-800 text-sm">{meeting.createdBy?.fullName}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Mode</p>
                                    <p className="font-bold text-gray-800">{meeting.mode}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Meeting Status</p>
                                    <Badge variant="secondary" className="mt-1">{meeting.status}</Badge>
                                </div>
                            </div>
                        </Card>

                        {/* SECTION 2 & 3 – Overview & Decisions */}
                        <Card className="p-8 space-y-8 shadow-premium border-gray-100">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        {canEdit ? <div className="w-1.5 h-1.5 rounded-full bg-primary" /> : <Eye className="w-4 h-4 text-primary" />}
                                        Meeting Objective
                                    </Label>
                                    {canEdit ? (
                                        <Input
                                            placeholder="Enter the primary objective of this meeting..."
                                            value={momData.objective}
                                            onChange={(e) => setMomData({ ...momData, objective: e.target.value })}
                                            className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all h-12"
                                        />
                                    ) : (
                                        <div className="p-4 bg-gray-50 rounded-xl text-gray-700 min-h-[48px] border border-gray-100 shadow-sm leading-relaxed">
                                            {momData.objective || 'Not specified.'}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        {canEdit ? <div className="w-1.5 h-1.5 rounded-full bg-primary" /> : <Eye className="w-4 h-4 text-primary" />}
                                        Agenda Points Discussed
                                    </Label>
                                    {canEdit ? (
                                        <Textarea
                                            placeholder="List the key agenda points that were addressed..."
                                            className="min-h-[120px] bg-gray-50/50 border-gray-200 focus:bg-white transition-all resize-none"
                                            value={momData.agendaPoints}
                                            onChange={(e) => setMomData({ ...momData, agendaPoints: e.target.value })}
                                        />
                                    ) : (
                                        <div className="p-5 border rounded-xl bg-gray-50 whitespace-pre-wrap text-gray-700 border-gray-100 shadow-sm leading-relaxed">
                                            {momData.agendaPoints || 'No agenda recorded.'}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        {canEdit ? <div className="w-1.5 h-1.5 rounded-full bg-primary" /> : <Eye className="w-4 h-4 text-primary" />}
                                        Detailed Discussion Summary
                                    </Label>
                                    {canEdit ? (
                                        <Textarea
                                            placeholder="Provide a comprehensive summary of the discussions..."
                                            className="min-h-[200px] bg-gray-50/50 border-gray-200 focus:bg-white transition-all resize-none"
                                            value={momData.discussionSummary}
                                            onChange={(e) => setMomData({ ...momData, discussionSummary: e.target.value })}
                                        />
                                    ) : (
                                        <div className="p-5 border rounded-xl bg-gray-50 whitespace-pre-wrap text-gray-700 border-gray-100 shadow-sm leading-relaxed">
                                            {momData.discussionSummary || 'No discussion summary available.'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100 space-y-4">
                                <Label className="text-base font-bold text-green-700 flex items-center gap-2">
                                    <CheckSquare className="w-5 h-5" />
                                    Section 3: Key Decisions Taken
                                </Label>
                                {canEdit ? (
                                    <Textarea
                                        placeholder="Enumerate the final decisions reached during the session..."
                                        className="min-h-[120px] bg-green-50/20 border-green-100 focus:bg-white transition-all text-green-900"
                                        value={momData.decisions}
                                        onChange={(e) => setMomData({ ...momData, decisions: e.target.value })}
                                    />
                                ) : (
                                    <div className="p-5 border rounded-xl bg-green-50/30 text-green-900 border-green-100 font-medium leading-relaxed italic">
                                        {momData.decisions || 'No specific decisions were recorded.'}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* SECTION 4 – Action Items */}
                        <Card className="shadow-premium border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                    Section 4: Action Item Tracking
                                </h3>
                                {canEdit && (
                                    <Button size="sm" variant="outline" onClick={handleAddActionItem} className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add New Task
                                    </Button>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50/80">
                                        <TableRow>
                                            <TableHead className="font-bold">Task Description</TableHead>
                                            <TableHead className="font-bold">Assigned To</TableHead>
                                            <TableHead className="font-bold">Deadline</TableHead>
                                            <TableHead className="font-bold">Priority</TableHead>
                                            <TableHead className="font-bold">Status</TableHead>
                                            {canEdit && <TableHead className="w-[50px]"></TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {momData.actionItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={canEdit ? 6 : 5} className="text-center py-12 text-gray-400">
                                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                    No action items have been assigned yet.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            momData.actionItems.map((item, idx) => (
                                                <TableRow key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <TableCell className="min-w-[200px]">
                                                        {canEdit ? (
                                                            <Input
                                                                value={item.taskDescription}
                                                                onChange={(e) => handleActionItemChange(idx, 'taskDescription', e.target.value)}
                                                                className="bg-transparent border-none focus:ring-1 focus:ring-primary h-10"
                                                            />
                                                        ) : <span className="text-sm text-gray-700">{item.taskDescription}</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        {canEdit ? (
                                                            <Select
                                                                value={item.assignedTo}
                                                                onValueChange={(val) => handleActionItemChange(idx, 'assignedTo', val)}
                                                            >
                                                                <SelectTrigger className="h-10 bg-transparent">
                                                                    <SelectValue placeholder="Select Assignee" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {filteredUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.fullName} ({u.role})</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : <span className="text-sm font-medium text-gray-700">{allUsers.find(u => u.id === item.assignedTo)?.fullName || 'Unassigned'}</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        {canEdit ? (
                                                            <Input
                                                                type="date"
                                                                value={item.deadline}
                                                                onChange={(e) => handleActionItemChange(idx, 'deadline', e.target.value)}
                                                                className="h-10 bg-transparent"
                                                            />
                                                        ) : <span className="text-sm text-gray-600 font-mono">{item.deadline}</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        {canEdit ? (
                                                            <Select
                                                                value={item.priority}
                                                                onValueChange={(val) => handleActionItemChange(idx, 'priority', val)}
                                                            >
                                                                <SelectTrigger className="h-10 bg-transparent">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="High">High</SelectItem>
                                                                    <SelectItem value="Medium">Medium</SelectItem>
                                                                    <SelectItem value="Low">Low</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Badge variant={item.priority === 'High' ? 'destructive' : 'secondary'} className={cn(
                                                                item.priority === 'Medium' && 'bg-blue-600 text-white',
                                                                item.priority === 'Low' && 'bg-gray-400 text-white'
                                                            )}>
                                                                {item.priority}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={item.status === 'Completed' ? 'default' : item.status === 'Pending' ? 'secondary' : 'outline'}>
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                    {canEdit && (
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveActionItem(idx)} className="hover:bg-red-50 text-red-400 hover:text-red-600">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar Info Area */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* SECTION 5 – Attendance Summary */}
                        <Card className="p-6 space-y-6 shadow-premium border-gray-100">
                            <h3 className="font-bold text-gray-900 border-b pb-4 flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                Section 5: Attendance
                            </h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-400 font-bold uppercase">Scheduled</Label>
                                        <div className="text-2xl font-black text-gray-300">
                                            {meeting.attendees?.length || 0}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-primary font-bold uppercase">Actual Present</Label>
                                        {canEdit ? (
                                            <Input
                                                type="number"
                                                value={momData.attendanceCount}
                                                onChange={(e) => setMomData({ ...momData, attendanceCount: parseInt(e.target.value) || 0 })}
                                                className="h-10 text-xl font-bold"
                                            />
                                        ) : (
                                            <div className="text-2xl font-black text-primary">{momData.attendanceCount}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700">Departments Represented</Label>
                                    {canEdit ? (
                                        <Input
                                            placeholder="e.g. Science, HR, Management"
                                            value={momData.departments}
                                            onChange={(e) => setMomData({ ...momData, departments: e.target.value })}
                                            className="bg-gray-50/50"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            {momData.departments || 'Specific departments not listed.'}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold text-gray-700">Attendance Remarks</Label>
                                    {canEdit ? (
                                        <Textarea
                                            placeholder="Add any specific attendance notes..."
                                            value={momData.attendanceSummary}
                                            onChange={(e) => setMomData({ ...momData, attendanceSummary: e.target.value })}
                                            className="bg-gray-50/50 min-h-[80px]"
                                        />
                                    ) : (
                                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]">
                                            {momData.attendanceSummary || 'No additional remarks.'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* SECTION 6 – Attachments */}
                        <Card className="p-6 space-y-4 shadow-premium border-gray-100">
                            <h3 className="font-bold text-gray-900 border-b pb-4 flex items-center gap-2">
                                <Paperclip className="w-4 h-4 text-primary" />
                                Section 6: Attachments
                            </h3>
                            <div className="space-y-4">
                                {canEdit && (
                                    <div className="group border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all">
                                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                            <Plus className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-600">Upload Files</p>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Support PDF, Doc, Image (Max 5)</p>
                                    </div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <div className="text-center py-6 text-gray-400 text-xs italic bg-gray-50/50 rounded-xl border border-gray-100">
                                        No documents attached to this MoM.
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* REPLY SYSTEM */}
                        {isPublished && (
                            <Card className="p-6 space-y-6 shadow-premium border-gray-100 bg-white">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-primary" />
                                        Section 8: Replies & Comments
                                    </h3>
                                    <Badge variant="outline" className="text-[10px] uppercase">{meeting.replies?.length || 0} Replies</Badge>
                                </div>

                                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {(meeting.replies || []).length === 0 ? (
                                        <div className="text-center py-10">
                                            <MessageSquare className="w-12 h-12 mx-auto text-gray-100 mb-2" />
                                            <p className="text-gray-400 text-sm italic">No official replies have been recorded yet.</p>
                                        </div>
                                    ) : (
                                        meeting.replies?.map((r, i) => (
                                            <div key={i} className={cn(
                                                "p-4 rounded-2xl relative transition-all hover:shadow-md border",
                                                r.userId === currentUser?.id ? 'bg-primary/5 border-primary/10 ml-6' : 'bg-gray-50 border-gray-100 mr-6'
                                            )}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold border">
                                                            {r.user?.fullName.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-xs text-gray-800">{r.user?.fullName}</span>
                                                    </div>
                                                    <span className="text-[9px] text-gray-400 font-mono">{format(new Date(r.createdAt), 'PP p')}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed">{r.replyText}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {!isManagement && (
                                    <div className="pt-4 border-t space-y-3">
                                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Leave a reply</Label>
                                        <div className="flex flex-col gap-3">
                                            <Textarea
                                                placeholder="Write your comment or question here..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                className="min-h-[80px] bg-gray-50 border-gray-200 resize-none"
                                            />
                                            <Button onClick={handleSendReply} className="w-full bg-gray-900 hover:bg-black text-white">
                                                Post Reply
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
