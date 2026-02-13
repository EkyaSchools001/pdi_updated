function ObserveView({ setObservations, setTeam, team, observations }: {
    setObservations: React.Dispatch<React.SetStateAction<Observation[]>>,
    setTeam: React.Dispatch<React.SetStateAction<typeof teamMembers>>,
    team: typeof teamMembers,
    observations: Observation[]
}) {
    const navigate = useNavigate();

    // Get active template or fallback to master template (ID 1)
    const template = getActiveTemplateByType("Observation") || initialTemplates.find(t => t.id === 1);

    if (!template) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <h3 className="text-xl font-semibold mb-2">Template Not Found</h3>
                <p className="text-muted-foreground mb-4">The observation template could not be loaded.</p>
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
                        onSubmit={(data) => {
                            // Map dynamic form data back to Observation structure
                            // Keys correspond to field IDs in template-utils.ts (ID 1)
                            const newObs = {
                                id: Math.random().toString(36).substr(2, 9),
                                teacher: data.t1 || "Unknown Teacher",
                                domain: data.a1 || "General",
                                date: data.o2 ? new Date(data.o2).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                score: Number(data.a2) || 0,
                                notes: data.a3 || "",
                                observerName: data.o1 || "Dr. Sarah Johnson",
                                observerRole: data.o3 || "Head of School",
                                classroom: {
                                    block: data.c1 || "",
                                    grade: data.c2 || "",
                                    section: data.c3 || "",
                                    learningArea: data.c4 || ""
                                },
                                hasReflection: false,
                                reflection: "",
                                learningArea: data.c4 || "",
                                strengths: data.a4 || "",
                                improvements: data.a5 || "",
                                teachingStrategies: data.a6 ? (typeof data.a6 === 'string' ? data.a6.split(",").map((s: string) => s.trim()) : []) : [],
                            } as Observation;

                            setObservations(prev => [newObs, ...prev]);

                            // Update teacher stats
                            setTeam(prev => {
                                const teacherName = data.t1 as string;
                                if (!teacherName) return prev;

                                const existing = prev.find(t => t.name.toLowerCase() === teacherName.toLowerCase());
                                if (existing) {
                                    return prev.map(t => t.name.toLowerCase() === teacherName.toLowerCase() ? {
                                        ...t,
                                        observations: t.observations + 1,
                                        lastObserved: newObs.date,
                                        avgScore: Number(((t.avgScore * t.observations + newObs.score) / (t.observations + 1)).toFixed(1))
                                    } : t);
                                } else {
                                    return [...prev, {
                                        id: (prev.length + 1).toString(),
                                        name: teacherName,
                                        role: "Subject Teacher",
                                        observations: 1,
                                        lastObserved: newObs.date,
                                        avgScore: newObs.score,
                                        pdHours: 0,
                                        completionRate: 0
                                    }];
                                }
                            });

                            toast.success(`Observation recorded successfully!`);
                            navigate("/leader");
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
