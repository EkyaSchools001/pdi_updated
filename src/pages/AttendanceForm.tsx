import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useFormFlow } from "@/hooks/useFormFlow";

export default function AttendanceForm() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { getRedirectionPath } = useFormFlow();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [event, setEvent] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [confirmed, setConfirmed] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        mobile: "",
        employeeId: "",
        department: ""
    });

    useEffect(() => {
        const userStr = localStorage.getItem("user_data");
        if (userStr) {
            const u = JSON.parse(userStr);
            setUser(u);
            setFormData(prev => ({
                ...prev,
                department: u.department || "",
                // Could pre-fill from user profile if available
            }));
        }
        fetchEvent();
    }, [eventId]);

    const fetchEvent = async () => {
        try {
            // Fetch all to find the event - simplistic but works with existing API
            // Ideally fetching single event endpoint
            const response = await api.get("/training");
            if (response.data.status === "success") {
                const found = response.data.data.events.find((e: any) => e.id === eventId);
                if (found) {
                    setEvent(found);
                    if (!found.attendanceEnabled || found.attendanceClosed) {
                        toast.error("Attendance is not active for this event.");
                        navigate("/teacher/attendance");
                    }
                } else {
                    toast.error("Event not found");
                    navigate("/teacher/attendance");
                }
            }
        } catch (error) {
            console.error("Failed to load event", error);
            toast.error("Failed to load event details");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmed) {
            toast.error("Please confirm your attendance");
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post(`/attendance/${eventId}/submit`, {
                ...formData
            });

            if (response.data.status === "success") {
                toast.success("Attendance submitted successfully!");
                const redirectPath = getRedirectionPath("Attendance Submission", user?.role || "");
                navigate(redirectPath || "/teacher/attendance");
            }
        } catch (error: any) {
            if (error.response?.status === 409) {
                toast.error("You have already submitted attendance for this event.");
            } else {
                toast.error(error.response?.data?.message || "Failed to submit attendance");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!event) return null;

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <Card className="w-full max-w-lg border-none shadow-premium bg-card backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" className="-ml-3 h-8 w-8 p-0" onClick={() => navigate("/teacher/attendance")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Badge variant="outline" className="border-primary/20 text-primary">Attendance Form</Badge>
                    </div>
                    <CardTitle className="text-2xl text-foreground">{event.title}</CardTitle>
                    <CardDescription className="text-muted-foreground font-medium">
                        {format(new Date(event.date), "MMMM d, yyyy")} • {event.location}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Teacher Name</Label>
                                <Input value={user?.fullName} disabled className="bg-muted/50" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={user?.email} disabled className="bg-muted/50" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="school">School/Campus</Label>
                            <Input id="school" value={user?.campusId || event.schoolId || "N/A"} disabled className="bg-muted/50" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mobile">Mobile Number</Label>
                            <Input
                                id="mobile"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                placeholder="Enter your mobile number"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="employeeId">Employee ID</Label>
                                <Input
                                    id="employeeId"
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="e.g. Science"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-4 border-t border-border">
                            <Checkbox
                                id="confirm"
                                checked={confirmed}
                                onCheckedChange={(c) => setConfirmed(c as boolean)}
                            />
                            <Label htmlFor="confirm" className="text-sm font-normal cursor-pointer text-foreground">
                                I confirm that I attended this training session in person/virtually.
                            </Label>
                        </div>

                        <Button type="submit" className="w-full mt-4" disabled={submitting || !confirmed}>
                            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Submit Attendance
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
