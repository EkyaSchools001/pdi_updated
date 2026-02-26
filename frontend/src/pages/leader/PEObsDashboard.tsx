import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Plus, Search, Calendar, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { toast } from "sonner";
import { GrowthLayout } from "@/components/growth/GrowthLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare } from "lucide-react";

const RATING_COLORS: Record<number, string> = {
    1: "bg-red-100 text-red-700",
    2: "bg-yellow-100 text-yellow-700",
    3: "bg-blue-100 text-blue-700",
    4: "bg-green-100 text-green-700",
};
const RATING_LABELS: Record<number, string> = {
    1: "Basic", 2: "Developing", 3: "Effective", 4: "Highly Effective",
};

const PEObsDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const teacherId = searchParams.get("teacherId");
    const [observations, setObservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState(searchParams.get("q") || "");
    const [blockFilter, setBlockFilter] = useState(searchParams.get("block") || "");
    const [gradeFilter, setGradeFilter] = useState(searchParams.get("grade") || "");
    const [ratingFilter, setRatingFilter] = useState(searchParams.get("rating") || "");

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (searchText) params.set("q", searchText); else params.delete("q");
        if (blockFilter) params.set("block", blockFilter); else params.delete("block");
        if (gradeFilter) params.set("grade", gradeFilter); else params.delete("grade");
        if (ratingFilter) params.set("rating", ratingFilter); else params.delete("rating");
        setSearchParams(params, { replace: true });
    }, [searchText, blockFilter, gradeFilter, ratingFilter]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const params: any = { moduleType: 'PHYSICAL_EDUCATION' };
                const res = await api.get("/growth/observations", { params });
                
                const mappedObservations = (res.data?.data?.observations || []).map((obs: any) => {
                    let formPayload = obs.formPayload;
                    if (typeof formPayload === 'string') {
                      try { formPayload = JSON.parse(formPayload); } catch(e) { formPayload = {}; }
                    }
                    return {
                        id: obs.id,
                        observationDate: obs.observationDate,
                        teacherName: obs.teacher?.fullName || obs.teacherEmail || formPayload?.teacherName || "Unknown Teacher",
                        block: formPayload?.block || "",
                        grade: formPayload?.grade || "",
                        overallRating: obs.overallRating || formPayload?.overallRating || "",
                        observerName: obs.observer?.fullName || formPayload?.observer || formPayload?.observerName || "Unknown Observer",
                        hasReflection: obs.hasReflection || false,
                        teacherReflection: obs.teacherReflection || "",
                        detailedReflection: obs.detailedReflection ? (typeof obs.detailedReflection === 'string' ? JSON.parse(obs.detailedReflection) : obs.detailedReflection) : null
                    };
                });
                
                setObservations(mappedObservations);
            } catch {
                toast.error("Failed to load PE observations");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (!user) return null;

    const filtered = observations.filter(o => {
        const name = (o.teacherName || "").toLowerCase();
        return (
            (!searchText || name.includes(searchText.toLowerCase())) &&
            (!blockFilter || o.block === blockFilter) &&
            (!gradeFilter || o.grade === gradeFilter) &&
            (!ratingFilter || String(o.overallRating) === ratingFilter)
        );
    });

    const teacherName = searchParams.get("teacherName");
    const teacherEmail = searchParams.get("teacherEmail");

    let newPath = "/leader/pe-obs/new";
    if (teacherId) {
        const params = new URLSearchParams();
        params.set("teacherId", teacherId);
        if (teacherName) params.set("teacherName", teacherName);
        if (teacherEmail) params.set("teacherEmail", teacherEmail);
        newPath += `?${params.toString()}`;
    }

    return (
        <DashboardLayout role={user.role.toLowerCase() as any} userName={user.fullName}>
            <GrowthLayout allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                <div className="animate-in fade-in duration-500" style={{ background: "#F5F5EF", minHeight: "100vh", padding: "0 0 40px" }}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl text-white" style={{ background: "#1F2839" }}>
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold" style={{ color: "#1F2839" }}>Physical Education Observation</h1>
                                <p className="text-sm text-muted-foreground">AY 25-26 Physical Education Observation_Master</p>
                            </div>
                        </div>
                        <Button onClick={() => navigate(newPath)} style={{ background: "#B69D74", color: "white" }} className="hover:opacity-90 flex items-center gap-2 font-semibold">
                            <Plus className="w-4 h-4" /> New Observation
                        </Button>
                    </div>

                    <Card className="mb-6 border-none shadow-sm">
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input placeholder="Search teacher..." className="pl-9" value={searchText} onChange={e => setSearchText(e.target.value)} />
                                </div>
                                <Select value={blockFilter} onValueChange={v => setBlockFilter(v === "all" ? "" : v)}>
                                    <SelectTrigger><SelectValue placeholder="All Blocks" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Blocks</SelectItem>
                                        {["Early Years", "Primary", "Middle", "Senior"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={gradeFilter} onValueChange={v => setGradeFilter(v === "all" ? "" : v)}>
                                    <SelectTrigger><SelectValue placeholder="All Grades" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Grades</SelectItem>
                                        {["Nursery", "LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={ratingFilter} onValueChange={v => setRatingFilter(v === "all" ? "" : v)}>
                                    <SelectTrigger><SelectValue placeholder="All Ratings" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Ratings</SelectItem>
                                        <SelectItem value="1">1 – Basic</SelectItem>
                                        <SelectItem value="2">2 – Developing</SelectItem>
                                        <SelectItem value="3">3 – Effective</SelectItem>
                                        <SelectItem value="4">4 – Highly Effective</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="py-3 px-4 border-b" style={{ background: "#1F2839" }}>
                            <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-white uppercase tracking-wider">
                                <span>Date</span>
                                <span className="col-span-2">Teacher</span>
                                <span>Block</span>
                                <span>Grade</span>
                                <span>Rating</span>
                                <span>Reflection</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center py-16 text-muted-foreground">Loading observations...</div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                    <Activity className="w-12 h-12 opacity-20" />
                                    <p className="font-medium">No PE observations yet</p>
                                    <Button variant="outline" onClick={() => navigate(newPath)}><Plus className="w-4 h-4 mr-2" /> Start First Observation</Button>
                                </div>
                            ) : (
                                filtered.map((obs, idx) => (
                                    <div key={obs.id} className={`grid grid-cols-7 gap-2 px-4 py-3 items-center hover:bg-amber-50 cursor-pointer border-b transition-colors text-sm ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                                        onClick={() => navigate(`/leader/pe-obs/new?teacherId=${obs.teacherEmail}`)}>
                                        <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{obs.observationDate}</span>
                                        <span className="col-span-2 font-medium text-slate-800">{obs.teacherName}</span>
                                        <span>{obs.block || "—"}</span>
                                        <span>{obs.grade || "—"}</span>
                                        <span>
                                            {obs.overallRating ? (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${RATING_COLORS[obs.overallRating] || "bg-slate-100 text-slate-700"}`}>
                                                    <Star className="w-3 h-3" />{RATING_LABELS[obs.overallRating] || obs.overallRating}
                                                </span>
                                            ) : "—"}
                                        </span>
                                        <span onClick={(e) => e.stopPropagation()}>
                                            {obs.hasReflection ? (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800">
                                                            <MessageSquare className="w-3 h-3" /> View Reflection
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[500px]">
                                                        <DialogHeader>
                                                            <DialogTitle>Teacher Reflection</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            {obs.detailedReflection?.strengths && (
                                                                <div>
                                                                    <h4 className="font-semibold text-sm mb-1">Identified Strengths</h4>
                                                                    <p className="text-sm text-muted-foreground">{obs.detailedReflection.strengths}</p>
                                                                </div>
                                                            )}
                                                            {obs.detailedReflection?.improvements && (
                                                                <div>
                                                                    <h4 className="font-semibold text-sm mb-1">Areas for Growth</h4>
                                                                    <p className="text-sm text-muted-foreground">{obs.detailedReflection.improvements}</p>
                                                                </div>
                                                            )}
                                                            {obs.detailedReflection?.goal && (
                                                                <div>
                                                                    <h4 className="font-semibold text-sm mb-1">Action Goal</h4>
                                                                    <p className="text-sm text-muted-foreground">{obs.detailedReflection.goal}</p>
                                                                </div>
                                                            )}
                                                            {obs.teacherReflection && !obs.detailedReflection?.strengths && (
                                                                <div>
                                                                    <h4 className="font-semibold text-sm mb-1">General Comments</h4>
                                                                    <p className="text-sm text-muted-foreground">{obs.teacherReflection}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs text-muted-foreground font-normal bg-slate-100">
                                                    Pending
                                                </Badge>
                                            )}
                                        </span>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                    {filtered.length > 0 && <p className="text-xs text-muted-foreground text-right mt-2">{filtered.length} record{filtered.length !== 1 ? "s" : ""} found</p>}
                </div>
            </GrowthLayout>
        </DashboardLayout>
    );
};

export default PEObsDashboard;
