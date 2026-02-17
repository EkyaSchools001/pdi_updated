import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Download, UserCheck } from "lucide-react";


export default function EventAttendanceView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [eventData, setEventData] = useState<any>(null);

    useEffect(() => {
        fetchAttendance();
    }, [id]);

    const fetchAttendance = async () => {
        try {
            // Fetch event details first to show title
            // We could use a separate endpoint or just rely on attendance list meta if available.
            // But let's fetch event first for context.
            // Actually, constructing a dedicated hook or just two calls.
            // Trying to get event details from existing list might be cleaner if we had state management context, but here we just fetch again.
            // However, the `getEventAttendance` might not return event details. 
            // I'll assume I can blindly fetch attendance and maybe event details separately or just use attendance data if populated.
            // Let's just fetch the attendance list.

            const response = await api.get(`/attendance/${id}`);
            if (response.data.status === "success") {
                setAttendance(response.data.data.attendance);
            }
        } catch (error) {
            console.error("Failed to fetch attendance", error);
            toast.error("Failed to load attendance records");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Simple CSV export
        if (!attendance.length) return;

        const headers = ["Teacher Name", "Email", "School", "Submitted At", "Employee ID", "Department"];
        const rows = attendance.map(a => [
            a.teacherName,
            a.teacherEmail,
            a.schoolId || "N/A",
            format(new Date(a.submittedAt), "yyyy-MM-dd HH:mm:ss"),
            a.employeeId || "N/A",
            a.department || "N/A"
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(c => `"${c}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Attendance_${id}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Event Attendance
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {attendance.length} attendees recorded
                    </p>
                </div>
                <div className="ml-auto">
                    <Button variant="outline" onClick={handleExport} disabled={attendance.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-card">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Teacher Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Submitted At</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendance.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No attendance records found yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                attendance.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 bg-primary/10 rounded-full">
                                                    <UserCheck className="w-3 h-3 text-primary" />
                                                </div>
                                                {record.teacherName}
                                            </div>
                                        </TableCell>
                                        <TableCell>{record.teacherEmail}</TableCell>
                                        <TableCell>{format(new Date(record.submittedAt), "MMM d, h:mm a")}</TableCell>
                                        <TableCell>{record.department || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Present</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
