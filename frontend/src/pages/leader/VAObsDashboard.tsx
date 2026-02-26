import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Plus, Search, Calendar, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { toast } from "sonner";
import { GrowthLayout } from "@/components/growth/GrowthLayout";

const RATING_COLORS: Record<string, string> = {
    "Highly Effective": "bg-green-100 text-green-700",
    "Effective": "bg-blue-100 text-blue-700",
    "Developing": "bg-yellow-100 text-yellow-700",
    "Needs Improvement": "bg-red-100 text-red-700",
};

const VAObsDashboard: React.FC = () => {
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
                const res = await api.get("/va-obs");
                setObservations(res.data?.data?.observations || []);
            } catch {
                toast.error("Failed to load Visual Arts observations");
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
            (!ratingFilter || o.overallRating === ratingFilter)
        );
    });

    const newPath = teacherId ? `/leader/va-obs/new?teacherId=${teacherId}` : "/leader/va-obs/new";

    return (
        <DashboardLayout role={user.role.toLowerCase() as any} userName={user.fullName}>
            <GrowthLayout allowedRoles={['LEADER', 'SCHOOL_LEADER', 'ADMIN', 'SUPERADMIN']}>
                <div className="animate-in fade-in duration-500" style={{ background: "#F5F5EF", minHeight: "100vh", padding: "0 0 40px" }}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl text-white" style={{ background: "#1F2839" }}>
                                <Palette className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold" style={{ color: "#1F2839" }}>Visual Arts Observation</h1>
                                <p className="text-sm text-muted-foreground">AY 25–26 Visual Arts Observation_Master</p>
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
                                        {["Highly Effective", "Effective", "Developing", "Needs Improvement"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
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
                                <span className="col-span-2">Rating</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center py-16 text-muted-foreground">Loading observations...</div>
                            ) : filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                                    <Palette className="w-12 h-12 opacity-20" />
                                    <p className="font-medium">No Visual Arts observations yet</p>
                                    <Button variant="outline" onClick={() => navigate(newPath)}><Plus className="w-4 h-4 mr-2" /> Start First Observation</Button>
                                </div>
                            ) : (
                                filtered.map((obs, idx) => (
                                    <div key={obs.id} className={`grid grid-cols-7 gap-2 px-4 py-3 items-center hover:bg-amber-50 cursor-pointer border-b transition-colors text-sm ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                                        onClick={() => navigate(`/leader/va-obs/new`)}>
                                        <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{obs.observationDate}</span>
                                        <span className="col-span-2 font-medium text-slate-800">{obs.teacherName}</span>
                                        <span>{obs.block || "—"}</span>
                                        <span>{obs.grade || "—"}</span>
                                        <span className="col-span-2">
                                            {obs.overallRating ? (
                                                <Badge className={`text-xs ${RATING_COLORS[obs.overallRating] || "bg-slate-100 text-slate-700"}`}>
                                                    <Star className="w-3 h-3 mr-1" />{obs.overallRating}
                                                </Badge>
                                            ) : "—"}
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

export default VAObsDashboard;
