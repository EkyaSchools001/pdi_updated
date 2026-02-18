import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { DynamicForm } from "@/components/DynamicForm";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { initialTemplates } from "@/lib/template-utils";
import { Observation } from "@/types/observation";
import { useFormFlow } from "@/hooks/useFormFlow";
import { useAuth } from "@/hooks/useAuth";

// Defined locally to fix missing import
const teamMembers: any[] = []; // Placeholder

function ObserveView({ setObservations, setTeam, team, observations }: {
    setObservations: React.Dispatch<React.SetStateAction<Observation[]>>,
    setTeam: React.Dispatch<React.SetStateAction<any[]>>,
    team: any[],
    observations: Observation[]
}) {
    const navigate = useNavigate();

    const { user } = useAuth();
    const { getRedirectionPath } = useFormFlow();
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const response = await api.get('/templates');
                if (response.data?.status === 'success') {
                    const templates = response.data.data.templates || [];
                    const active = templates.find((t: any) => t.type === 'Observation' && t.status === 'Active');
                    if (active) {
                        setTemplate(active);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch templates", error);
                toast.error("Failed to load observation template");
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, []);

    if (loading) {
        return <div className="p-12 text-center text-muted-foreground">Loading template...</div>;
    }

    if (!template) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <h3 className="text-xl font-semibold mb-2">Template Not Found</h3>
                <p className="text-muted-foreground mb-4">No active observation template found. Please contact an administrator.</p>
                <Button onClick={() => navigate("/leader")}>Return to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/leader")}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <PageHeader
                    title="New Observation"
                    subtitle="Record teacher performance using Master Template"
                />
            </div>
            <Card className="border-none shadow-xl bg-background overflow-hidden">
                <CardHeader className="bg-primary/5 border-b py-6">
                    <CardTitle className="text-xl font-bold">{template.title}</CardTitle>
                    <CardDescription>All fields are mandatory unless marked optional</CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                    <DynamicForm
                        fields={template.fields}
                        submitLabel="Submit Observation"
                        onCancel={() => navigate("/leader")}
                        onSubmit={async (data) => {
                            try {
                                // Map dynamic form data back to Observation structure for API
                                const payload = {
                                    teacher: data.t1,
                                    teacherEmail: data.t2,
                                    observerName: data.o1,
                                    observerRole: data.o3,
                                    date: data.o2 ? new Date(data.o2).toISOString() : new Date().toISOString(),
                                    // Time is data.o5
                                    domain: data.a1 || "General",
                                    score: Number(data.a2) || 0,
                                    notes: data.a3 || "",
                                    strengths: data.a4 || "", // Will be part of notes/feedback in backend or handled if schema updated? 
                                    // Backend schema has 'notes', 'actionStep', 'teacherReflection', 'detailedReflection'. 
                                    // It seems 'strengths' and 'improvements' might need to be concatenated into 'notes' or 'detailedReflection' if not explicitly supported.
                                    // Checking controller: it maps 'notes' -> 'notes'. 
                                    // Let's concatenate strengths/improvements into notes for now if backend doesn't support them directly, or send them as part of detailedReflection JSON.

                                    // Actually controller uses: notes: data.notes || data.feedback || ''
                                    // It doesn't seem to explicitly look for strengths/improvements in the root `createObservation`. 
                                    // However, let's look at `newObservationData` construction in controller.
                                    // It picks `notes`, `actionStep`, `teacherReflection`.
                                    // It doesn't pick `strengths` or `domains` array unless we send `domains`.

                                    // Wait, the controller handles `domains` array for `domainRatings`.
                                    // But here we are submitting a simplified form that seems to treat the whole observation as one domain?
                                    // The template has "Observation Domain" (a1) as a dropdown. 
                                    // So it is a single-domain observation?
                                    // Yes, `a1` is "Observation Domain".

                                    // Let's construct the payload expected by `createObservation` in `observationController.ts`.

                                    // Payload mapping:
                                    // teacherId: (optional, looked up by email) -> we send teacherEmail
                                    // teacherEmail: data.t2
                                    // date: data.o2
                                    // domain: data.a1
                                    // score: data.a2
                                    // notes: data.a3
                                    // campus: from team/user? Or maybe not in form? Template has no campus field? 
                                    // Wait, template has Block (c1), Grade (c2), etc.

                                    block: data.c1,
                                    grade: data.c2,
                                    section: data.c3,
                                    learningArea: data.c4,

                                    // detailedReflection: We can put extra fields here
                                    detailedReflection: JSON.stringify({
                                        strengths: data.a4,
                                        improvements: data.a5,
                                        teachingStrategies: data.a6,
                                        time: data.o5
                                    }),

                                    // For compat with "domains" array in schema if needed?
                                    // The controller creates `domainRatings` from `data.domains`. 
                                    // But the current form is single domain. 
                                    // We can just send the root fields.
                                };

                                const response = await api.post('/observations', payload);

                                if (response.data.status === 'success') {
                                    const newObs = response.data.data.observation;
                                    setObservations(prev => [newObs, ...prev]);
                                    toast.success(`Observation recorded successfully!`);

                                    const redirectPath = getRedirectionPath(template.title, user?.role || "");
                                    navigate(redirectPath || "/leader");
                                }
                            } catch (error) {
                                console.error("Failed to submit observation", error);
                                toast.error("Failed to submit observation. Please try again.");
                            }
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

export default ObserveView;
