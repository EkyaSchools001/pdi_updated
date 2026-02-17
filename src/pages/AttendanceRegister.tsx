import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, ClipboardList, CheckCircle2, XCircle, Eye } from "lucide-react";

export default function AttendanceRegister() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user_data");
        if (userStr) {
            setUserData(JSON.parse(userStr));
        }
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
    const myEvents = events.filter(e => e.createdById === userData?.id || e.proposedById === userData?.id);

    // Sort by date (newest first)
    const sortedEvents = [...myEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
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

            <Card className="border-none shadow-premium bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>My Events</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-white/5 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="hover:bg-transparent border-white/5">
                                    <TableHead className="text-gray-400">Event Name</TableHead>
                                    <TableHead className="text-gray-400">Date</TableHead>
                                    <TableHead className="text-gray-400">Status</TableHead>
                                    <TableHead className="text-gray-400">Attendance</TableHead>
                                    <TableHead className="text-right text-gray-400">Actions</TableHead>
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
                                        <TableRow key={event.id} className="hover:bg-white/5 border-white/5 transition-colors">
                                            <TableCell className="font-medium text-white">
                                                {event.title}
                                                <div className="text-xs text-muted-foreground">{event.type}</div>
                                            </TableCell>
                                            <TableCell>{format(new Date(event.date), "MMM d, yyyy")}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    event.status === 'Completed' || event.status === 'COMPLETED' ? "border-green-500 text-green-500" :
                                                        event.status === 'Ongoing' ? "border-blue-500 text-blue-500" : "border-yellow-500 text-yellow-500"
                                                }>
                                                    {event.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(event)}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {/* View Button */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`${event.id}`)}
                                                    className="text-gray-400 hover:text-white hover:bg-white/10"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View
                                                </Button>

                                                {/* Enable Attendance (Only if Completed and Not Enabled) */}
                                                {!event.attendanceEnabled && (event.status === 'Completed' || event.status === 'COMPLETED') && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleAttendance(event.id, 'enable')}
                                                        className="border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Enable
                                                    </Button>
                                                )}

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
