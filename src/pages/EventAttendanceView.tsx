import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { trainingService } from "@/services/trainingService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Download, UserCheck, Users } from "lucide-react";


export default function EventAttendanceView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState<any[]>([]);
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("attendance");

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [attendanceRes, eventData] = await Promise.all([
                api.get(`/attendance/${id}`),
                trainingService.getEvent(id!)
            ]);

            if (attendanceRes.data.status === "success") {
                setAttendance(attendanceRes.data.data.attendance);
            }
            if (eventData) {
                setEvent(eventData);
            }
        } catch (error: any) {
            console.error("Failed to fetch data", error);
            const msg = error.response?.data?.message || error.message || "Failed to load records";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (activeTab === "attendance") {
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
            downloadCSV(headers, rows, `Attendance_${event?.title || id}.csv`);
        } else {
            const registrants = event?.registrants || [];
            if (!registrants.length) return;
            const headers = ["Name", "Email", "Role", "Campus", "Department", "Date Registered"];
            const rows = registrants.map((r: any) => [
                r.name,
                r.email,
                r.role || "N/A",
                r.campusId || "N/A",
                r.department || "N/A",
                r.dateRegistered
            ]);
            downloadCSV(headers, rows, `Registrants_${event?.title || id}.csv`);
        }
    };

    const downloadCSV = (headers: string[], rows: any[][], fileName: string) => {
        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(c => `"${c}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
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
                        {event?.title || "Event Attendance"}
                    </h1>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-muted-foreground">
                            {attendance.length} attended
                        </p>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-muted-foreground">
                            {event?.registrants?.length || 0} registered
                        </p>
                    </div>
                </div>
                <div className="ml-auto">
                    <Button variant="outline" onClick={handleExport} disabled={activeTab === "attendance" ? attendance.length === 0 : !event?.registrants?.length}>
                        <Download className="w-4 h-4 mr-2" />
                        Export {activeTab === "attendance" ? "Attendance" : "Registrants"} CSV
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="attendance" className="gap-2">
                        <UserCheck className="w-4 h-4" />
                        Recorded Attendance
                    </TabsTrigger>
                    <TabsTrigger value="registrants" className="gap-2">
                        <Users className="w-4 h-4" />
                        Registered Participants
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="attendance">
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
                </TabsContent>

                <TabsContent value="registrants">
                    <Card className="border-none shadow-sm bg-card">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Reg. Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(!event?.registrants || event.registrants.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                No registrants found for this event.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        event.registrants.map((registrant: any) => (
                                            <TableRow key={registrant.id}>
                                                <TableCell className="font-medium">
                                                    {registrant.name}
                                                </TableCell>
                                                <TableCell>{registrant.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{registrant.role || "Teacher"}</Badge>
                                                </TableCell>
                                                <TableCell>{registrant.department || "-"}</TableCell>
                                                <TableCell>{registrant.dateRegistered}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
