import React, { useState, useEffect } from 'react';
import {
    Megaphone,
    Calendar,
    Bell,
    Plus,
    Filter,
    MoreVertical,
    Trash2,
    Edit,
    Eye,
    CheckCircle2,
    Clock,
    Pin,
    Archive,
    Search,
    User as UserIcon,
    Shield,
    Users
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/components/RoleBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { announcementService, Announcement } from '@/services/announcementService';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getSocket } from '@/lib/socket';
import { AnnouncementFormModal } from '@/components/announcements/AnnouncementFormModal';

const AnnouncementsPage: React.FC = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('all');

    const userRole = user?.role?.toUpperCase() || '';

    // Explicitly check for authorized roles to avoid accidental teacher access
    const isCreatorRole = ['ADMIN', 'SUPERADMIN', 'LEADER', 'SCHOOL_LEADER', 'MANAGEMENT', 'COORDINATOR', 'HOS'].includes(userRole) && userRole !== 'TEACHER';

    useEffect(() => {
        fetchAnnouncements();

        // Socket listener for new announcements
        const socket = getSocket();
        socket.on('announcement:new', (newAnn: Announcement) => {
            setAnnouncements(prev => {
                if (prev.some(a => a.id === newAnn.id)) return prev;
                return [newAnn, ...prev];
            });
            toast.info(`New Announcement: ${newAnn.title}`);
        });

        return () => {
            socket.off('announcement:new');
        };
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const data = await announcementService.getAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error('Failed to fetch announcements', error);
            toast.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (id: string) => {
        try {
            await announcementService.acknowledgeAnnouncement(id);
            setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isAcknowledged: true } : a));
            toast.success('Announcement acknowledged');
        } catch (error) {
            toast.error('Failed to acknowledge');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await announcementService.deleteAnnouncement(id);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            toast.success('Announcement deleted');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleCreateSuccess = (newAnn: Announcement) => {
        setAnnouncements(prev => {
            if (prev.some(a => a.id === newAnn.id)) return prev;
            return [newAnn, ...prev];
        });
    };

    const filteredAnnouncements = announcements.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = priorityFilter === 'all' || a.priority === priorityFilter;

        let matchesTab = true;
        if (activeTab === 'high') matchesTab = a.priority === 'High';
        if (activeTab === 'archived') matchesTab = a.status === 'Archived';
        if (activeTab === 'my') matchesTab = a.createdById === user?.id;
        if (activeTab === 'all') matchesTab = a.status !== 'Archived';

        return matchesSearch && matchesPriority && matchesTab;
    });

    const getPriorityBadge = (priority: string) => {
        if (priority === 'High') {
            return <Badge variant="destructive" className="bg-red-500 font-bold uppercase tracking-wider text-[10px]">High Priority</Badge>;
        }
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold uppercase tracking-wider text-[10px]">Normal</Badge>;
    };

    return (
        <DashboardLayout
            role={(user?.role?.toLowerCase() || 'teacher') as Role}
            userName={user?.fullName || 'User'}
        >
            <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <PageHeader
                        title="Announcements"
                        subtitle="Key updates, news, and communications for the PDI community"
                    />
                    {isCreatorRole && (
                        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2">
                            <Plus className="w-4 h-4" />
                            Post Announcement
                        </Button>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl border">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search announcements..."
                            className="pl-9 bg-background border-none shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-full md:w-40 bg-background border-none shadow-sm capitalize">
                                <SelectValue placeholder="Priority Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="High">High Priority</SelectItem>
                                <SelectItem value="Normal">Normal</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className="shrink-0 bg-background border-none shadow-sm" onClick={() => fetchAnnouncements()}>
                            <Clock className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-2xl mb-8">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="high">High Priority</TabsTrigger>
                        {isCreatorRole && <TabsTrigger value="my">My Posts</TabsTrigger>}
                        <TabsTrigger value="archived">Archived</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {loading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse border" />
                                ))
                            ) : filteredAnnouncements.length > 0 ? (
                                filteredAnnouncements.map((announcement) => (
                                    <Card key={announcement.id} className={cn(
                                        "group border-none shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden border-t-4",
                                        announcement.priority === 'High' ? "border-t-destructive" : "border-t-primary/40"
                                    )}>
                                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {announcement.isPinned && (
                                                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 gap-1 px-1.5 py-0">
                                                            <Pin className="w-3 h-3 fill-current" />
                                                            <span className="text-[9px] font-black uppercase">Pinned</span>
                                                        </Badge>
                                                    )}
                                                    {getPriorityBadge(announcement.priority)}
                                                    {announcement.isAcknowledged && (
                                                        <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100 font-bold uppercase tracking-wider text-[10px] gap-1">
                                                            <CheckCircle2 className="w-3 h-3" /> Acknowledged
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors cursor-pointer" onClick={() => {
                                                    setSelectedAnnouncement(announcement);
                                                    setIsViewModalOpen(true);
                                                }}>
                                                    {announcement.title}
                                                </CardTitle>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium pt-1">
                                                    <span className="flex items-center gap-1">
                                                        <UserIcon className="w-3.5 h-3.5" />
                                                        {announcement.createdBy?.fullName} ({announcement.createdBy?.role})
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {(announcement.createdById === user?.id || ['ADMIN', 'SUPERADMIN'].includes(userRole)) && (
                                                    <>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(announcement.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                                                {announcement.description}
                                            </p>
                                        </CardContent>
                                        <CardFooter className="flex justify-between items-center border-t bg-muted/5 pt-4">
                                            <Button variant="ghost" size="sm" className="text-xs font-bold text-primary hover:bg-primary/5 gap-1.5" onClick={() => {
                                                setSelectedAnnouncement(announcement);
                                                setIsViewModalOpen(true);
                                            }}>
                                                <Eye className="w-3.5 h-3.5" /> View Details
                                            </Button>

                                            {!announcement.isAcknowledged && (user?.role === 'TEACHER' || user?.role === 'LEADER') && (
                                                <Button size="sm" className="text-xs font-bold bg-primary hover:bg-primary/90 gap-1.5 px-4" onClick={() => handleAcknowledge(announcement.id)}>
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full py-20 bg-muted/20 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="p-4 rounded-full bg-muted/50">
                                        <Megaphone className="w-12 h-12 text-muted-foreground opacity-30" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground font-bold italic">No announcements found matching your criteria.</p>
                                        <Button variant="link" className="mt-2" onClick={() => {
                                            setSearchQuery('');
                                            setPriorityFilter('all');
                                            setActiveTab('all');
                                        }}>Clear all filters</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Create Modal */}
                <AnnouncementFormModal
                    isOpen={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                    onSuccess={handleCreateSuccess}
                    userRole={userRole}
                />

                {/* View Details Modal */}
                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                    <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl">
                        <DialogHeader className="sr-only">
                            <DialogTitle>{selectedAnnouncement?.title || "Announcement Details"}</DialogTitle>
                            <DialogDescription>
                                Detailed view of the selected announcement.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedAnnouncement && (
                            <div className="flex flex-col">
                                <div className={cn(
                                    "p-8 text-white",
                                    selectedAnnouncement.priority === 'High' ? "bg-destructive" : "bg-primary"
                                )}>
                                    <div className="flex justify-between items-start mb-4">
                                        {getPriorityBadge(selectedAnnouncement.priority)}
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 -mt-2 -mr-2" onClick={() => setIsViewModalOpen(false)}>
                                            <XCircle className="w-5 h-5 transition-transform hover:rotate-90" />
                                        </Button>
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tight">{selectedAnnouncement.title}</h2>
                                    <div className="flex flex-wrap items-center gap-4 mt-6 text-white/80 text-sm font-medium">
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                                            <UserIcon className="w-4 h-4" />
                                            {selectedAnnouncement.createdBy?.fullName}
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                                            <Calendar className="w-4 h-4" />
                                            {format(new Date(selectedAnnouncement.createdAt), 'MMMM d, yyyy')}
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                                            <Shield className="w-4 h-4" />
                                            {selectedAnnouncement.role || 'PDI'}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-background">
                                    <ScrollArea className="max-h-[400px]">
                                        <div className="prose prose-slate max-w-none">
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                                                {selectedAnnouncement.description}
                                            </p>
                                        </div>
                                    </ScrollArea>

                                    <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5">
                                                <Users className="w-4 h-4" />
                                                Target: {JSON.parse(selectedAnnouncement.targetRoles).length > 0
                                                    ? JSON.parse(selectedAnnouncement.targetRoles).join(', ')
                                                    : 'All Roles'}
                                            </span>
                                        </div>
                                        {!selectedAnnouncement.isAcknowledged && (user?.role === 'TEACHER' || user?.role === 'LEADER') && (
                                            <Button className="w-full md:w-auto px-10 py-6 text-lg font-black uppercase tracking-widest gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20" onClick={() => {
                                                handleAcknowledge(selectedAnnouncement.id);
                                                setIsViewModalOpen(false);
                                            }}>
                                                <CheckCircle2 className="w-6 h-6" /> Acknowledge This Update
                                            </Button>
                                        )}
                                        {selectedAnnouncement.isAcknowledged && (
                                            <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
                                                <CheckCircle2 className="w-5 h-5" />
                                                You have acknowledged this
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

// Internal icon for view modal cross
const XCircle: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
);

export default AnnouncementsPage;
