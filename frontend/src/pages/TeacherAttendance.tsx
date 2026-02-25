import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, ClipboardList, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default function TeacherAttendance() {
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

    // Filter events:
    // 1. Status is Completed or Live or attendance enabled
    // 2. School matches
    // 3. User is registered
    const relevantEvents = events.filter(e => {
        if (!user?.id) return false; // Ensure user is loaded

        const isCompletedOrLive = e.status === 'Completed' || e.status === 'COMPLETED' || e.attendanceEnabled;
        const matchesSchool = !e.schoolId || e.schoolId === user?.campusId;
        const isRegistered = e.registrants?.some((r: any) => r.id === user?.id);

        return isCompletedOrLive && matchesSchool && isRegistered;
    });

    // Sort by date desc
    const sortedEvents = [...relevantEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Attendance
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Mark your attendance for completed training sessions.
                    </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                    <ClipboardList className="w-6 h-6 text-primary" />
                </div>
            </div>

            <Card className="border-none shadow-premium bg-card backdrop-blur-sm">
                <CardContent className="pt-6">
                    <div className="rounded-md border border-border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent border-border">
                                    <TableHead className="text-foreground">Event Name</TableHead>
                                    <TableHead className="text-foreground">Date</TableHead>
                                    <TableHead className="text-foreground">Location</TableHead>
                                    <TableHead className="text-foreground">Status</TableHead>
                                    <TableHead className="text-right text-foreground">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedEvents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No completed events found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedEvents.map((event) => (
                                        <TableRow key={event.id} className="hover:bg-muted/30 border-border transition-colors">
                                            <TableCell className="font-medium text-foreground">
                                                {event.title}
                                                <div className="text-xs text-muted-foreground">{event.topic}</div>
                                            </TableCell>
                                            <TableCell>{format(new Date(event.date), "MMM d, yyyy")}</TableCell>
                                            <TableCell>{event.location}</TableCell>
                                            <TableCell>
                                                {event.attendanceClosed ? (
                                                    <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">Closed</Badge>
                                                ) : event.attendanceEnabled ? (
                                                    <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">Live</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-gray-500/10 text-gray-400 border-gray-500/20">Not Enabled</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => navigate(`/teacher/attendance/${event.id}`)}
                                                    disabled={!event.attendanceEnabled || event.attendanceClosed}
                                                    className={event.attendanceEnabled && !event.attendanceClosed
                                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                        : "bg-muted text-muted-foreground hover:bg-muted"}
                                                >
                                                    Mark Attendance
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
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
