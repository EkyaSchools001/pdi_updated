
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Clock, MapPin, Map, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

// Mock Data (Reusing structure for consistency)
const initialTrainingEvents = [
    {
        id: "1",
        title: "Differentiated Instruction Workshop",
        topic: "Pedagogy",
        type: "Pedagogy",
        date: "Feb 15, 2026",
        time: "09:00 AM",
        location: "Auditorium A",
        registered: 12,
        capacity: 20,
        status: "Approved",
        spotsLeft: 8,
        isAdminCreated: true,
        registrants: [
            { id: "u1", name: "Teacher One", email: "teacher1.btmlayout@pdi.com", dateRegistered: "Jan 12, 2026" },
            { id: "u2", name: "Teacher Two", email: "teacher2.jpnagar@pdi.com", dateRegistered: "Jan 14, 2026" },
            { id: "u3", name: "Teacher Three", email: "teacher3.itpl@pdi.com", dateRegistered: "Jan 15, 2026" },
        ]
    },
    {
        id: "2",
        title: "Digital Literacy in Classroom",
        topic: "Technology",
        type: "Technology",
        date: "Feb 18, 2026",
        time: "02:00 PM",
        location: "Computer Lab 1",
        registered: 18,
        capacity: 25,
        status: "Approved",
        spotsLeft: 7,
        isAdminCreated: true,
        registrants: [
            { id: "u4", name: "Teacher Three", email: "teacher3.itpl@pdi.com", dateRegistered: "Jan 20, 2026" },
            { id: "u5", name: "Teacher Two", email: "teacher2.jpnagar@pdi.com", dateRegistered: "Jan 21, 2026" },
        ]
    },
    { id: "3", title: "Social-Emotional Learning Hub", topic: "Culture", type: "Culture", date: "Feb 22, 2026", time: "11:00 AM", location: "Conference Room B", registered: 8, capacity: 15, status: "Approved", spotsLeft: 7, isAdminCreated: true, registrants: [] },
    { id: "4", title: "Advanced Formative Assessment", topic: "Assessment", type: "Assessment", date: "Feb 25, 2026", time: "03:30 PM", location: "Main Library", registered: 15, capacity: 20, status: "Pending", spotsLeft: 5, isAdminCreated: true, registrants: [] },
];

export function AdminCalendarView() {
    const [training, setTraining] = useState(() => {
        try {
            const saved = localStorage.getItem('training_events_data');
            return saved ? JSON.parse(saved) : initialTrainingEvents;
        } catch (e) {
            console.error("Failed to parse training events", e);
            return initialTrainingEvents;
        }
    });

    useEffect(() => {
        localStorage.setItem('training_events_data', JSON.stringify(training));
        // Dispatch custom event for same-window updates
        window.dispatchEvent(new Event('training-events-updated'));
    }, [training]);

    // Listen for updates from other dashboards/tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'training_events_data' && e.newValue) {
                try {
                    setTraining(JSON.parse(e.newValue));
                } catch (err) {
                    console.error("Failed to sync training data", err);
                }
            }
        };

        const handleCustomEvent = () => {
            const saved = localStorage.getItem('training_events_data');
            if (saved) {
                try {
                    const newData = JSON.parse(saved);
                    setTraining((prev: any) => {
                        // Prevent infinite loops by comparing with current state
                        if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;
                        return newData;
                    });
                } catch (err) {
                    console.error("Failed to sync training data via custom event", err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('training-events-updated', handleCustomEvent);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('training-events-updated', handleCustomEvent);
        };
    }, []);

    const [searchQuery, setSearchQuery] = useState("");
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 1, 15)); // Default to Feb 15, 2026
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isRegistrantsOpen, setIsRegistrantsOpen] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<any>(null);
    const [selectedRegistrants, setSelectedRegistrants] = useState<any[]>([]);
    const [newEvent, setNewEvent] = useState({ title: "", type: "Pedagogy", date: new Date(2026, 1, 15), time: "09:00 AM", location: "" });

    // Helper to format Date object to "MMM d, yyyy" string
    const formatDateStr = (d: Date) => {
        return format(d, "MMM d, yyyy");
    };

    const handleScheduleEvent = () => {
        if (!newEvent.title || !newEvent.date) {
            toast.error("Please fill in required fields");
            return;
        }
        const event = {
            id: (training.length > 0 ? Math.max(...training.map((t: any) => parseInt(t.id) || 0)) + 1 : 1).toString(),
            ...newEvent,
            date: formatDateStr(newEvent.date),
            registered: 0,
            capacity: 30,
            status: "Approved",
            isAdminCreated: true,
            spotsLeft: 30,
            registrants: []
        };
        setTraining([...training, event]);
        setIsScheduleOpen(false);
        setNewEvent({ title: "", type: "Pedagogy", date: new Date(2026, 1, 15), time: "09:00 AM", location: "" });
        toast.success("Event scheduled successfully");
    };

    const handleEditEvent = () => {
        if (!currentEvent?.title || !currentEvent?.date) {
            toast.error("Please fill in required fields");
            return;
        }

        const updatedEvent = {
            ...currentEvent,
            date: typeof currentEvent.date === 'string' ? currentEvent.date : formatDateStr(currentEvent.date),
            topic: currentEvent.type // Sync topic with type
        };

        setTraining(training.map((t: any) => t.id === updatedEvent.id ? updatedEvent : t));
        setIsEditOpen(false);
        toast.success("Event updated successfully");
    };

    const handleDeleteEvent = () => {
        if (!currentEvent) return;
        setTraining(training.filter(t => t.id !== currentEvent.id));
        setIsDeleteOpen(false);
        toast.success("Event deleted successfully");
    };

    const handleManageSession = (event: any) => {
        setCurrentEvent({
            ...event,
            type: event.type || event.topic || "Pedagogy",
            topic: event.topic || event.type || "Pedagogy"
        });
        setIsEditOpen(true);
    }

    const handleViewRegistrants = (event: any) => {
        setSelectedRegistrants(event.registrants || []);
        setCurrentEvent(event);
        setIsRegistrantsOpen(true);
    }

    // Helper to parse "MMM d, yyyy" string to Date object
    const parseEventDate = (dateStr: string) => {
        try {
            const parts = dateStr.includes(',') ? dateStr : `${dateStr}, 2026`;
            return new Date(parts);
        } catch (e) {
            return new Date();
        }
    };

    const filteredEvents = training.filter((e: any) => {
        const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.topic || e.type || "").toLowerCase().includes(searchQuery.toLowerCase());

        let matchesDate = true;
        if (date) {
            matchesDate = e.date === formatDateStr(date);
        }

        return matchesSearch && matchesDate;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="Training Calendar"
                subtitle="Schedule and manage professional development sessions"
                actions={
                    <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Schedule Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Schedule Training Event</DialogTitle>
                                <DialogDescription>Add a new session to the PD calendar.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="event-title">Event Title</Label>
                                    <Input id="event-title" placeholder="Workshop Name" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="event-type">Type</Label>
                                        <Select value={newEvent.type} onValueChange={v => setNewEvent({ ...newEvent, type: v })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Pedagogy">Pedagogy</SelectItem>
                                                <SelectItem value="Technology">Technology</SelectItem>
                                                <SelectItem value="Assessment">Assessment</SelectItem>
                                                <SelectItem value="Culture">Culture</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !newEvent.date && "text-muted-foreground"
                                                    )}
                                                >
                                                    {newEvent.date ? (
                                                        formatDateStr(newEvent.date)
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <Clock className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={newEvent.date}
                                                    onSelect={(d) => d && setNewEvent({ ...newEvent, date: d })}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="event-time">Time</Label>
                                        <Input id="event-time" placeholder="09:00 AM" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="event-location">Location</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="event-location" className="pl-9" placeholder="Room/Lab" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                                <Button onClick={handleScheduleEvent}>Schedule</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            <div className="flex flex-col gap-8">
                {/* Calendar Widget - Refactored to Horizontal Layout */}
                <Card className="border-none shadow-2xl bg-zinc-950 text-white overflow-hidden relative">
                    {/* decorative gradient blob */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-20 -translate-x-20 pointer-events-none" />

                    <CardContent className="p-8 md:p-10 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10 items-start">
                            {/* Left side: Header and Calendar */}
                            <div className="lg:col-span-7 space-y-8">
                                <div className="text-left w-full">
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
                                        Activity Summary
                                    </h3>
                                    <p className="text-zinc-400 text-sm uppercase tracking-widest font-bold mt-1">
                                        {formatDateStr(new Date())}
                                    </p>
                                </div>

                                <CalendarComponent
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="rounded-3xl border-none bg-zinc-900/50 p-8 w-full shadow-inner"
                                    classNames={{
                                        months: "flex flex-col space-y-6",
                                        month: "space-y-6 w-full",
                                        caption: "flex justify-center pt-1 relative items-center mb-6",
                                        caption_label: "text-lg font-bold text-white",
                                        nav: "space-x-2 flex items-center",
                                        nav_button: "h-9 w-9 bg-transparent p-0 text-zinc-400 hover:text-white border-zinc-700 hover:bg-zinc-800 rounded-xl transition-all",
                                        nav_button_previous: "absolute left-2",
                                        nav_button_next: "absolute right-2",
                                        table: "w-full border-collapse",
                                        head_row: "flex w-full mt-2",
                                        head_cell: "text-zinc-500 rounded-md w-full font-bold text-[0.85rem] uppercase tracking-wider flex items-center justify-center",
                                        row: "flex w-full mt-4",
                                        cell: "h-12 w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-zinc-800/50 first:[&:has([aria-selected])]:rounded-l-xl last:[&:has([aria-selected])]:rounded-r-xl focus-within:relative focus-within:z-20",
                                        day: "h-12 w-12 p-0 font-medium aria-selected:opacity-100 text-white hover:bg-zinc-800 rounded-2xl transition-all flex items-center justify-center mx-auto",
                                        day_selected: "bg-gradient-to-br from-pink-500 to-red-600 text-white hover:bg-red-600 focus:bg-red-600 shadow-xl shadow-red-500/40 font-bold scale-110",
                                        day_today: "bg-zinc-800/80 text-white font-black ring-2 ring-zinc-700/50",
                                        day_outside: "text-zinc-600 opacity-30",
                                    }}
                                    modifiers={{
                                        pedagogy: training.filter((e: any) => (e.topic || e.type) === "Pedagogy").map((e: any) => parseEventDate(e.date)),
                                        technology: training.filter((e: any) => (e.topic || e.type) === "Technology").map((e: any) => parseEventDate(e.date)),
                                        assessment: training.filter((e: any) => (e.topic || e.type) === "Assessment").map((e: any) => parseEventDate(e.date)),
                                        other: training.filter((e: any) => !["Pedagogy", "Technology", "Assessment"].includes(e.topic || e.type)).map((e: any) => parseEventDate(e.date)),
                                    }}
                                    modifiersStyles={{
                                        pedagogy: { border: '2px solid #3b82f6', color: 'white' }, // Blue
                                        technology: { border: '2px solid #10b981', color: 'white' }, // Green
                                        assessment: { border: '2px solid #f43f5e', color: 'white' }, // Red
                                        other: { border: '2px solid #eab308', color: 'white' } // Yellow
                                    }}
                                />
                            </div>

                            {/* Right side: Legend and Filters */}
                            <div className="lg:col-span-5 h-full flex flex-col justify-center pt-8 lg:pt-20">
                                <div className="bg-zinc-900/40 rounded-3xl p-8 border border-zinc-800/50 backdrop-blur-sm space-y-8">
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Training Legend</h4>
                                        <Badge variant="outline" className="bg-white/5 border-zinc-700 text-zinc-300">
                                            {training.length} Total
                                        </Badge>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between group cursor-default">
                                            <span className="flex items-center gap-4 text-zinc-300 group-hover:text-white transition-colors font-medium">
                                                <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]"></span> Pedagogy
                                            </span>
                                            <span className="font-mono text-zinc-100 bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/20">
                                                {training.filter((t: any) => (t.topic || t.type) === 'Pedagogy').length}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between group cursor-default">
                                            <span className="flex items-center gap-4 text-zinc-300 group-hover:text-white transition-colors font-medium">
                                                <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"></span> Technology
                                            </span>
                                            <span className="font-mono text-zinc-100 bg-green-500/10 px-3 py-1 rounded-xl border border-green-500/20">
                                                {training.filter((t: any) => (t.topic || t.type) === 'Technology').length}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between group cursor-default">
                                            <span className="flex items-center gap-4 text-zinc-300 group-hover:text-white transition-colors font-medium">
                                                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]"></span> Assessment
                                            </span>
                                            <span className="font-mono text-zinc-100 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20">
                                                {training.filter((t: any) => (t.topic || t.type) === 'Assessment').length}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-zinc-800 flex flex-col gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-zinc-400 italic">
                                            Tip: Select a date on the calendar to filter the sessions list below.
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-2xl transition-all font-bold"
                                            onClick={() => setDate(undefined)}
                                            disabled={!date}
                                        >
                                            Clear Date Filter
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Events List - Fixed duplication */}
                <Card className="border-none shadow-2xl bg-background/60 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-muted/20">
                    <CardHeader className="px-8 py-8 border-b bg-muted/5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <CardTitle className="text-2xl font-black text-foreground tracking-tight">
                                    {date ? `Sessions for ${formatDateStr(date)}` : "Upcoming Training Sessions"}
                                </CardTitle>
                                <p className="text-sm font-medium text-muted-foreground mt-1">
                                    {filteredEvents.length} session{filteredEvents.length !== 1 && 's'} identified for this period
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Search sessions..."
                                        className="pl-12 w-[280px] h-12 bg-muted/40 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl transition-all font-medium"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-muted/10 border-b">
                                        <th className="text-left px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Session Details</th>
                                        <th className="text-left px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Type</th>
                                        <th className="text-left px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Time & Location</th>
                                        <th className="text-left px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Status</th>
                                        <th className="text-right px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/10">
                                    {filteredEvents.length > 0 ? (
                                        filteredEvents.map((session) => (
                                            <tr key={session.id} className="hover:bg-primary/[0.02] transition-colors group">
                                                <td className="px-8 py-7">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{session.title}</span>
                                                        {!date && <span className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-1.5 uppercase tracking-wide">
                                                            <Clock className="w-3 h-3" /> {session.date}
                                                        </span>}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-7">
                                                    <Badge variant="outline" className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20">
                                                        {session.topic || session.type}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-7">
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-bold text-foreground flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                                                <Clock className="w-4 h-4 text-orange-500" />
                                                            </div>
                                                            {session.time}
                                                        </div>
                                                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2.5 pl-0.5">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                                <MapPin className="w-4 h-4 text-blue-500" />
                                                            </div>
                                                            {session.location}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-7">
                                                    <span className={cn(
                                                        "inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm",
                                                        session.status === "Approved"
                                                            ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20"
                                                            : "bg-amber-500/5 text-amber-600 border-amber-500/20"
                                                    )}>
                                                        {session.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-7 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 px-4 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold flex items-center gap-2"
                                                            onClick={() => handleViewRegistrants(session)}
                                                        >
                                                            <Users className="w-4 h-4" />
                                                            Registrants
                                                        </Button>
                                                        <Button variant="ghost" className="h-10 px-6 rounded-xl hover:bg-primary hover:text-white transition-all font-bold" onClick={() => handleManageSession(session)}>
                                                            Manage
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground">
                                                        <Users className="w-8 h-8" />
                                                    </div>
                                                    <p className="text-muted-foreground font-bold italic">No sessions found for this selection.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Event Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Training Event</DialogTitle>
                        <DialogDescription>Modify the details of this professional development session.</DialogDescription>
                    </DialogHeader>
                    {currentEvent && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-event-title">Event Title</Label>
                                <Input id="edit-event-title" value={currentEvent.title} onChange={e => setCurrentEvent({ ...currentEvent, title: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-event-type">Type</Label>
                                    <Select
                                        value={currentEvent.type || currentEvent.topic}
                                        onValueChange={v => setCurrentEvent({ ...currentEvent, type: v, topic: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pedagogy">Pedagogy</SelectItem>
                                            <SelectItem value="Technology">Technology</SelectItem>
                                            <SelectItem value="Assessment">Assessment</SelectItem>
                                            <SelectItem value="Culture">Culture</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !currentEvent.date && "text-muted-foreground"
                                                )}
                                            >
                                                {currentEvent.date ? (
                                                    typeof currentEvent.date === 'string' ? currentEvent.date : formatDateStr(currentEvent.date)
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <Clock className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarComponent
                                                mode="single"
                                                selected={typeof currentEvent.date === 'string' ? parseEventDate(currentEvent.date) : currentEvent.date}
                                                onSelect={(d) => d && setCurrentEvent({ ...currentEvent, date: d })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-event-time">Time</Label>
                                    <Input id="edit-event-time" value={currentEvent.time} onChange={e => setCurrentEvent({ ...currentEvent, time: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-event-location">Location</Label>
                                    <Input id="edit-event-location" value={currentEvent.location} onChange={e => setCurrentEvent({ ...currentEvent, location: e.target.value })} />
                                </div>
                            </div>
                            <div className="pt-4 border-t mt-2">
                                <Button variant="destructive" size="sm" className="w-full" onClick={() => { setIsEditOpen(false); setIsDeleteOpen(true); }}>
                                    Delete Event
                                </Button>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditEvent}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Registrants Dialog */}
            <Dialog open={isRegistrantsOpen} onOpenChange={setIsRegistrantsOpen}>
                <DialogContent className="sm:max-w-[700px] rounded-[2rem] overflow-hidden border-none shadow-2xl p-0">
                    <div className="bg-zinc-950 text-white p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                                Registered Participants
                            </h2>
                            <p className="text-zinc-400 font-medium text-sm mt-1 uppercase tracking-[0.2em]">
                                {currentEvent?.title}
                            </p>
                        </div>
                    </div>
                    <div className="p-8 bg-background">
                        <div className="rounded-2xl border border-muted/20 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/5">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-black uppercase tracking-widest text-[10px] py-4">Participant Name</TableHead>
                                        <TableHead className="font-black uppercase tracking-widest text-[10px] py-4">Contact Detail</TableHead>
                                        <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 text-right">Registration Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedRegistrants.length > 0 ? (
                                        selectedRegistrants.map((registrant) => (
                                            <TableRow key={registrant.id} className="hover:bg-primary/5 transition-colors group">
                                                <TableCell className="py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm group-hover:bg-primary group-hover:text-white transition-all">
                                                            {registrant.name.split(' ').map((n: string) => n[0]).join('')}
                                                        </div>
                                                        <span className="font-bold text-foreground">{registrant.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-muted-foreground">{registrant.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5 text-right font-medium text-muted-foreground">
                                                    {registrant.dateRegistered}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                    <div className="w-16 h-16 rounded-3xl bg-muted/50 flex items-center justify-center">
                                                        <Users className="w-8 h-8 opacity-20" />
                                                    </div>
                                                    <p className="font-bold italic">No registrations for this event yet.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <Button
                                className="h-12 px-8 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-xs"
                                onClick={() => setIsRegistrantsOpen(false)}
                            >
                                Close View
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{currentEvent?.title}</strong>? This will remove it from the calendar for all staff members.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteEvent}>Confirm Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
