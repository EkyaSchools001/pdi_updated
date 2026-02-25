import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Users, Download, Loader2, MapPin, Clock } from "lucide-react";
import { trainingService } from "@/services/trainingService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

export function AttendanceRegister() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchEvents = async () => {
        try {
            setIsLoading(true);
            const data = await trainingService.getAllEvents();
            setEvents(data || []);
        } catch (error) {
            console.error("Failed to fetch events:", error);
            toast.error("Failed to load training events");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleExportPDF = (event: any) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text("Training Attendance Register", 14, 22);

        doc.setFontSize(12);
        doc.text(`Event: ${event.title}`, 14, 32);
        doc.text(`Date: ${event.date} | Time: ${event.time}`, 14, 40);
        doc.text(`Location: ${event.location}`, 14, 48);
        doc.text(`Instructor/Lead: ${event.instructor || 'N/A'}`, 14, 56);

        // Table
        const tableColumn = ["Name", "Role", "Signature", "Notes"];
        const tableRows = event.registrations?.map((reg: any) => [
            reg.user?.fullName || "Unknown",
            reg.user?.role || "N/A",
            "", // Empty for signature
            ""
        ]) || [];

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 65,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { minCellHeight: 15 } // Space for signature
        });

        doc.save(`attendance_${event.title.replace(/\s+/g, '_')}.pdf`);
        toast.success("Attendance register exported!");
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Attendance Register</h2>
                    <p className="text-muted-foreground">View registrations and export sign-in sheets.</p>
                </div>
                {!selectedEvent && (
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search events..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {selectedEvent ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
                    <Button variant="ghost" onClick={() => setSelectedEvent(null)} className="mb-2 pl-0 hover:pl-2 transition-all">
                        ← Back to Events
                    </Button>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{selectedEvent.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-4 mt-2">
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {selectedEvent.date}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedEvent.time}</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedEvent.location}</span>
                                    </CardDescription>
                                </div>
                                <Button onClick={() => handleExportPDF(selectedEvent)}>
                                    <Download className="mr-2 w-4 h-4" />
                                    Export PDF
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Participant Name</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Registration Date</TableHead>
                                            <TableHead className="text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedEvent.registrations && selectedEvent.registrations.length > 0 ? (
                                            selectedEvent.registrations.map((reg: any) => (
                                                <TableRow key={reg.userId}>
                                                    <TableCell className="font-medium">{reg.user?.fullName}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{reg.user?.role}</Badge>
                                                    </TableCell>
                                                    <TableCell>{format(new Date(reg.registrationDate || new Date()), "MMM d, yyyy")}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge className="bg-emerald-500 hover:bg-emerald-600">Registered</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    No registrations yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEvents.map((event) => (
                        <Card key={event.id} className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setSelectedEvent(event)}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge>{event.type}</Badge>
                                    <Badge variant={(event.registrations?.length || 0) >= event.capacity ? "destructive" : "secondary"}>
                                        {event.registrations?.length || 0} / {event.capacity}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg mt-2 line-clamp-1">{event.title}</CardTitle>
                                <CardDescription className="line-clamp-1">{event.topic}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {event.date}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        {event.location}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredEvents.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No events found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
