import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Eye, TrendingUp, Info, BookOpen, MessageSquare, ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ObservationCard } from "@/components/ObservationCard";
import { ReflectionForm } from "@/components/ReflectionForm";
import api from "@/lib/api";
import { Observation, DetailedReflection } from "@/types/observation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

const GrowthPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [observations, setObservations] = useState<Observation[]>([]);
    const [selectedReflectObs, setSelectedReflectObs] = useState<Observation | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'quick'>('all');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDomain, setSelectedDomain] = useState("all");

    useEffect(() => {
        if (user) {
            if (user.role === 'TEACHER') {
                fetchObservations();
            } else if (user.role === 'LEADER' || user.role === 'SCHOOL_LEADER') {
                navigate("/leader/growth");
            } else if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
                navigate("/admin/growth-analytics");
            } else {
                setLoading(false);
            }
        }
    }, [user, navigate]);

    const fetchObservations = async () => {
        try {
            const response = await api.get('/observations');
            if (response.data?.status === 'success') {
                const apiObservations = (response.data?.data?.observations || []).map((obs: any) => ({
                    ...obs,
                    teacher: obs.teacher?.fullName || obs.teacherEmail || 'Unknown Teacher'
                }));

                const teacherObservations = apiObservations.filter(
                    (obs: Observation) => obs.teacherId === user?.id || obs.teacherEmail === user?.email || obs.teacher === user?.fullName
                );
                setObservations(teacherObservations);
            }
        } catch (err) {
            console.error("Failed to fetch observations:", err);
            toast.error("Failed to load observations");
        } finally {
            setLoading(false);
        }
    };

    const handleReflectionSubmit = async (reflection: DetailedReflection) => {
        if (!selectedReflectObs) return;
        try {
            await api.patch(`/observations/${selectedReflectObs.id}`, {
                hasReflection: true,
                teacherReflection: reflection.comments,
                detailedReflection: reflection,
                status: "Submitted"
            });

            setObservations(prev => prev.map(obs =>
                obs.id === selectedReflectObs.id
                    ? { ...obs, hasReflection: true, teacherReflection: reflection.comments, detailedReflection: reflection, status: "Submitted" }
                    : obs
            ));
            setSelectedReflectObs(null);
            toast.success("Reflection submitted successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit reflection");
        }
    };

    const domains = useMemo(() => {
        const uniqueDomains = new Set(observations.map(obs => obs.domain));
        return Array.from(uniqueDomains).sort();
    }, [observations]);

    const filteredObservations = useMemo(() => {
        return observations.filter(obs => {
            const matchesType = filterType === 'quick' ? (obs.type === 'Quick Feedback' || obs.domain === 'Quick Feedback') : true;
            const matchesDomain = selectedDomain === 'all' ? true : obs.domain === selectedDomain;
            const searchTerm = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                obs.domain?.toLowerCase().includes(searchTerm) ||
                obs.observerName?.toLowerCase().includes(searchTerm) ||
                (obs.learningArea || "").toLowerCase().includes(searchTerm) ||
                (obs.notes || "").toLowerCase().includes(searchTerm);

            return matchesType && matchesDomain && matchesSearch;
        });
    }, [observations, filterType, selectedDomain, searchQuery]);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedDomain("all");
        setFilterType("all");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user || user.role !== 'TEACHER') {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold">Growth Module</h1>
                <p className="text-muted-foreground">Redirecting to appropriate dashboard...</p>
            </div>
        );
    }

    return (
        <DashboardLayout role={user.role.toLowerCase() as any} userName={user.fullName}>
            <div className="p-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/teacher/dashboard')}
                        className="w-fit gap-2 -ml-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-bold tracking-tight">My Observations</h1>
                        <p className="text-muted-foreground">
                            Manage and reflect on your classroom observations
                        </p>
                    </div>
                </div>

                <div className="grid gap-8">
                    {/* Information Card about the Framework */}
                    <Card className="border-none shadow-sm bg-blue-50/50 border border-blue-100">
                        <CardContent className="p-6">
                            <div className="flex gap-4">
                                <div className="p-2 rounded-lg bg-blue-100 h-fit">
                                    <Info className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-blue-900">Ekya Danielson Framework</h3>
                                    <p className="text-sm text-blue-700 leading-relaxed">
                                        This dashboard utilizes the <strong>Unified Observation, Feedback & Improvement Form</strong>.
                                        It is a standard Danielson-based academic observation framework designed to support your professional growth through structured feedback and collaborative reflection.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Eye className="w-5 h-5 text-primary" />
                                Observation History
                            </h2>
                            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search subject, observer..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-10 rounded-xl"
                                    />
                                </div>
                                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                                    <SelectTrigger className="w-full md:w-48 h-10 rounded-xl">
                                        <SelectValue placeholder="Domain" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Domains</SelectItem>
                                        {domains.map(d => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={filterType === 'all' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setFilterType('all')}
                                        className="rounded-full h-9"
                                    >
                                        All
                                    </Button>
                                    <Button
                                        variant={filterType === 'quick' ? 'secondary' : 'outline'}
                                        size="sm"
                                        onClick={() => setFilterType('quick')}
                                        className={cn("rounded-full h-9 gap-2", filterType === 'quick' && "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200")}
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Quick
                                    </Button>
                                </div>
                                {(searchQuery || selectedDomain !== "all" || filterType !== "all") && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="h-9 gap-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-4 h-4" />
                                        Clear
                                    </Button>
                                )}
                                <Badge variant="outline" className="font-medium whitespace-nowrap">
                                    {filteredObservations.length} Results
                                </Badge>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {filteredObservations.length > 0 ? (
                                filteredObservations.map((obs) => (
                                    <ObservationCard
                                        key={obs.id}
                                        observation={obs}
                                        onReflect={() => setSelectedReflectObs(obs)}
                                        onView={() => navigate(`/teacher/observations/${obs.id}`)}
                                    />
                                ))
                            ) : (
                                <Card className="border-dashed py-12">
                                    <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
                                        <div className="p-4 rounded-full bg-muted/50">
                                            <BookOpen className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-foreground">No observations yet</p>
                                            <p className="text-sm text-muted-foreground max-w-xs">
                                                Your classroom observations will appear here once they are recorded by your school leader.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Reflection Dialog */}
            {selectedReflectObs && (
                <ReflectionForm
                    isOpen={!!selectedReflectObs}
                    onClose={() => setSelectedReflectObs(null)}
                    onSubmit={handleReflectionSubmit}
                    observation={selectedReflectObs}
                    teacherName={user.fullName}
                    teacherEmail={user.email || ""}
                />
            )}
        </DashboardLayout>
    );
};

export default GrowthPage;
