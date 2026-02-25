import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, ClipboardList, XCircle, Eye } from "lucide-react";

export default function AttendanceRegister() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await api.get("/training");
            if (response.data.status === "success") {
                setEvents(response.data.data.events);
            }
        } catch (error) {
            console.error("Failed to fetch events", error);
            toast.error("Failed to load events");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAttendance = async (eventId: string, action: "enable" | "close") => {
        try {
            const response = await api.post(`/attendance/${eventId}/toggle`, { action });
            if (response.data.status === "success") {
                toast.success(action === "enable" ? "Attendance enabled successfully" : "Attendance closed successfully");
                fetchEvents(); // Refresh list
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update attendance status");
        }
    };

    const handleExport = (event: any) => {
        const registrants = event.registrants || [];
        if (!registrants.length) {
            toast.info("No registrants to export");
            return;
        }

        const headers = ["Name", "Email", "Role", "Campus", "Department", "Date Registered"];
        const rows = registrants.map((r: any) => [
            r.name,
            r.email,
            r.role || "N/A",
            r.campusId || "N/A",
            r.department || "N/A",
            r.dateRegistered
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(c => `"${c}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.body.appendChild(document.createElement("a"));
        link.href = url;
        link.download = `Registrants_${event.title}.csv`;
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("CSV exported successfully");
    };

    const getStatusBadge = (event: any) => {
        if (event.attendanceClosed) {
            return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">Closed</Badge>;
        }
        if (event.attendanceEnabled) {
            return <Badge variant="default" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 animate-pulse">Live</Badge>;
        }
        return <Badge variant="secondary" className="bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 border-gray-500/20">Not Enabled</Badge>;
    };

    // Filter events created by the logged-in user
    // Also consider showing all for ADMIN? Prompt says "Shows events created by the logged-in user."
    // But strictly, Admin might want to see all. Implementation plan says "Shows events created by the logged-in user."
    // I will stick to createdBy check for the main view to reduce clutter, or maybe filtered tabs.
    // Filter events: Admins see all, others see only what they created/proposed
    const myEvents = events.filter(e => {
        const isAdmin = ['ADMIN', 'SUPERADMIN', 'MANAGEMENT'].includes(user?.role?.toUpperCase() || '');
        const isOwner = e.createdById === user?.id || e.proposedById === user?.id;

        // Admins and Superadmins see all events
        if (isAdmin) return true;

        // Leaders and Others see only their own
        return isOwner;
    });

    // Sort by date (newest first)
    const sortedEvents = [...myEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Attendance Register
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage attendance for your training sessions and events.
                    </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                    <ClipboardList className="w-6 h-6 text-primary" />
                </div>
            </div>

            <Card className="border-none shadow-premium bg-card backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>My Events</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent border-border">
                                    <TableHead className="text-foreground">Event Name</TableHead>
                                    <TableHead className="text-foreground">Date</TableHead>
                                    <TableHead className="text-foreground">Status</TableHead>
                                    <TableHead className="text-foreground">Attendance</TableHead>
                                    <TableHead className="text-foreground">Registrants</TableHead>
                                    <TableHead className="text-right text-foreground">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedEvents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No events found. Create an event in the Calendar to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedEvents.map((event) => (
                                        <TableRow key={event.id} className="hover:bg-muted/30 border-border transition-colors">
                                            <TableCell className="font-medium text-foreground">
                                                {event.title}
                                                <div className="text-xs text-muted-foreground">{event.type}</div>
                                            </TableCell>
                                            <TableCell>{format(new Date(event.date), "MMM d, yyyy")}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    event.status === 'Completed' || event.status === 'COMPLETED' ? "border-green-500 text-green-600 font-medium" :
                                                        event.status === 'Ongoing' ? "border-blue-500 text-blue-600 font-medium" : "border-yellow-500 text-yellow-600 font-medium"
                                                }>
                                                    {event.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(event)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                    {event.registrants?.length || 0} Registered
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`${event.id}`)}
                                                    className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View
                                                </Button>

                                                {/* Close Attendance (If Enabled and Not Closed) */}
                                                {event.attendanceEnabled && !event.attendanceClosed && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleAttendance(event.id, 'close')}
                                                        className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Close
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
