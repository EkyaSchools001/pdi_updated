import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, MapPin, CheckCircle2, XCircle, TrendingUp, Users, ArrowRight, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAuth } from '@/hooks/useAuth';

interface EnhancedAnalyticsViewProps {
    data: {
        attempts: any[];
        assignments: any[];
        users: any[];
    };
}

export const EnhancedAnalyticsView: React.FC<EnhancedAnalyticsViewProps> = ({ data }) => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCampus, setSelectedCampus] = useState<string | null>(null);

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

    const campusMetrics = useMemo(() => {
        // Get unique campuses from both users and assignments
        const uniqueCampuses = Array.from(new Set([
            ...data.users.map(u => u.campusId).filter(Boolean),
            ...data.assignments.map(asm => asm.assignedToCampusId).filter(Boolean)
        ]));

        return uniqueCampuses.map(campus => {
            const campusUsers = data.users.filter(u => u.campusId === campus);
            if (campusUsers.length === 0) return null;

            const campusAttempts = data.attempts.filter(a => a.user?.campusId === campus);

            // Post-Orientation Avg
            const postOrientationScores = campusAttempts
                .filter(a => a.assessment?.type === 'POST_ORIENTATION' && a.status === 'SUBMITTED' && a.score !== null)
                .map(a => a.score);
            const postOrientationAvg = postOrientationScores.length > 0
                ? postOrientationScores.reduce((a, b) => a + b, 0) / postOrientationScores.length
                : null;

            // Academic Preparedness Avg
            const preparednessScores = campusAttempts
                .filter(a => a.assessment?.type === 'PREPAREDNESS' && a.status === 'SUBMITTED' && a.score !== null)
                .map(a => a.score);
            const preparednessAvg = preparednessScores.length > 0
                ? preparednessScores.reduce((a, b) => a + b, 0) / preparednessScores.length
                : null;

            // Other Assessments Avg
            const otherScores = campusAttempts
                .filter(a => !['POST_ORIENTATION', 'PREPAREDNESS'].includes(a.assessment?.type) && a.status === 'SUBMITTED' && a.score !== null)
                .map(a => a.score);
            const otherAvg = otherScores.length > 0
                ? otherScores.reduce((acc, b) => acc + b, 0) / otherScores.length
                : null;

            // Completion Rate Calculation
            let totalExpected = 0;
            let totalCompleted = 0;

            const relevantAssignments = data.assignments;

            campusUsers.forEach(u => {
                const assignedAssessments = Array.from(new Set(relevantAssignments
                    .filter(asm => asm.assignedToId === u.id || asm.assignedToRole === u.role || asm.assignedToCampusId === u.campusId)
                    .map(asm => asm.assessmentId)));

                assignedAssessments.forEach(asmId => {
                    totalExpected++;
                    const hasCompleted = data.attempts.some(att =>
                        att.assessmentId === asmId &&
                        att.userId === u.id &&
                        att.status === 'SUBMITTED'
                    );
                    if (hasCompleted) totalCompleted++;
                });
            });

            const completionRate = totalExpected > 0 ? (totalCompleted / totalExpected) * 100 : 0;

            return {
                id: campus,
                name: campus,
                totalUsers: campusUsers.length,
                postOrientationAvg,
                preparednessAvg,
                otherAvg,
                completionRate,
                totalExpected,
                totalCompleted
            };
        }).filter(Boolean) as any[];
    }, [data]);

    const filteredCampuses = campusMetrics.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderTeacherDetails = (campusId: string) => {
        const campusUsers = data.users.filter(u => u.campusId === campusId);

        return (
            <div className="space-y-4">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-zinc-100">
                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Teacher</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Post-Orientation</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Preparedness</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Others Avg</TableHead>
                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Total Completion</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campusUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-zinc-400">No teachers found for this campus.</TableCell>
                            </TableRow>
                        ) : campusUsers.map(u => {
                            const userAttempts = data.attempts.filter(a => a.userId === u.id);

                            const poAttempt = userAttempts.find(a => a.assessment?.type === 'POST_ORIENTATION' && a.status === 'SUBMITTED');
                            const prAttempt = userAttempts.find(a => a.assessment?.type === 'PREPAREDNESS' && a.status === 'SUBMITTED');

                            const otherAttempts = userAttempts.filter(a => !['POST_ORIENTATION', 'PREPAREDNESS'].includes(a.assessment?.type) && a.status === 'SUBMITTED');
                            const otherAvg = otherAttempts.length > 0
                                ? otherAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / otherAttempts.length
                                : null;

                            const assignedAssessments = Array.from(new Set(data.assignments
                                .filter(asm => asm.assignedToId === u.id || asm.assignedToRole === u.role || asm.assignedToCampusId === u.campusId)
                                .map(asm => asm.assessmentId)));

                            let completedCount = 0;
                            assignedAssessments.forEach(asmId => {
                                const attempt = data.attempts.find(att =>
                                    att.assessmentId === asmId &&
                                    att.userId === u.id &&
                                    att.status === 'SUBMITTED'
                                );
                                if (attempt) completedCount++;
                            });

                            const allCompleted = assignedAssessments.length > 0 && completedCount === assignedAssessments.length;

                            return (
                                <TableRow key={u.id} className="group hover:bg-zinc-50/50 border-zinc-50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-zinc-700">{u.fullName}</span>
                                            <span className="text-[10px] text-zinc-400">{u.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {poAttempt ? (
                                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">
                                                {Math.round(poAttempt.score)}%
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-zinc-300 border-dashed bg-transparent border-zinc-200 uppercase text-[9px] font-bold">Pending</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {prAttempt ? (
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-bold">
                                                {Math.round(prAttempt.score)}%
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-zinc-300 border-dashed bg-transparent border-zinc-200 uppercase text-[9px] font-bold">Pending</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {otherAvg !== null ? (
                                            <Badge variant="secondary" className="bg-zinc-50 text-zinc-700 border-zinc-100 font-bold">
                                                {Math.round(otherAvg)}%
                                            </Badge>
                                        ) : (
                                            <span className="text-zinc-200 font-medium italic text-xs">--</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col gap-1 flex-1 min-w-[80px]">
                                                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full transition-all duration-500", allCompleted ? "bg-emerald-500" : "bg-primary")}
                                                        style={{ width: `${assignedAssessments.length > 0 ? (completedCount / assignedAssessments.length) * 100 : 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-[9px] text-zinc-400 font-bold uppercase">
                                                    {completedCount}/{assignedAssessments.length} Completed
                                                </span>
                                            </div>
                                            {allCompleted ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <Clock className="w-4 h-4 text-amber-500" />
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        );
    };

    if (!isAdmin) {
        const myCampusMetric = campusMetrics.find(m => m.name === user?.campusId);

        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-zinc-900">{user?.campusId} Analytics</h2>
                    <p className="text-sm text-zinc-500 font-medium">Monitoring teacher performance and assessment completion for your campus</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-none shadow-xl shadow-emerald-500/5 bg-emerald-50/30">
                        <CardContent className="pt-6">
                            <TrendingUp className="w-5 h-5 text-emerald-500 mb-2" />
                            <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-wider">Post-Orientation Avg</p>
                            <h3 className="text-3xl font-black text-emerald-700 mt-1">
                                {myCampusMetric && myCampusMetric.postOrientationAvg !== null
                                    ? `${Math.round(myCampusMetric.postOrientationAvg)}%`
                                    : '--'}
                            </h3>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-blue-500/5 bg-blue-50/30">
                        <CardContent className="pt-6">
                            <TrendingUp className="w-5 h-5 text-blue-500 mb-2" />
                            <p className="text-xs font-bold text-blue-600/60 uppercase tracking-wider">Preparedness Avg</p>
                            <h3 className="text-3xl font-black text-blue-700 mt-1">
                                {myCampusMetric && myCampusMetric.preparednessAvg !== null
                                    ? `${Math.round(myCampusMetric.preparednessAvg)}%`
                                    : '--'}
                            </h3>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-zinc-500/5 bg-zinc-50">
                        <CardContent className="pt-6">
                            <Users className="w-5 h-5 text-zinc-500 mb-2" />
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Teachers</p>
                            <h3 className="text-3xl font-black text-zinc-800 mt-1">{myCampusMetric?.totalUsers || 0}</h3>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-primary/5 bg-primary/5">
                        <CardContent className="pt-6">
                            <CheckCircle2 className="w-5 h-5 text-primary mb-2" />
                            <p className="text-xs font-bold text-primary/60 uppercase tracking-wider">Campus Completion</p>
                            <h3 className="text-3xl font-black text-primary mt-1">
                                {myCampusMetric ? `${Math.round(myCampusMetric.completionRate)}%` : '0%'}
                            </h3>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-2xl shadow-zinc-200/50 rounded-3xl overflow-hidden ring-1 ring-zinc-100">
                    <CardHeader className="border-b border-zinc-50 bg-zinc-50/20 py-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                                <Users className="w-5 h-5 text-primary" />
                                Teacher Performance & Completion
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <div className="p-0">
                        {renderTeacherDetails(user?.campusId as string)}
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        placeholder="Search campus..."
                        className="pl-10 h-10 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <p className="text-[10px] font-bold text-zinc-400 bg-zinc-50 px-3 py-1 rounded-full uppercase tracking-tighter border border-zinc-100 italic">
                        Tip: Double-tap row for teacher details
                    </p>
                    <Badge variant="outline" className="px-3 py-1 bg-white shadow-sm border-zinc-100 text-zinc-600 font-medium rounded-lg">
                        Total Users: {data.users.length}
                    </Badge>
                </div>
            </div>

            <Card className="border-none shadow-xl rounded-3xl overflow-hidden ring-1 ring-zinc-100">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-zinc-50/50">
                            <TableRow>
                                <TableHead className="w-[200px] font-bold text-zinc-500 uppercase text-[10px] tracking-wider">Campus</TableHead>
                                <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-wider text-center">Post-Orientation Avg</TableHead>
                                <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-wider text-center">Acad. Preparedness Avg</TableHead>
                                <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-wider text-center">Other Assessments Avg</TableHead>
                                <TableHead className="font-bold text-zinc-500 uppercase text-[10px] tracking-wider">Completion Rate</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCampuses.map(campus => (
                                <TableRow
                                    key={campus.id}
                                    className="cursor-pointer hover:bg-zinc-50 transition-colors group select-none"
                                    onDoubleClick={() => setSelectedCampus(campus.id)}
                                >
                                    <TableCell className="font-bold py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <MapPin className="w-4 h-4 text-primary" />
                                            </div>
                                            {campus.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {campus.postOrientationAvg !== null ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-bold text-emerald-600">{Math.round(campus.postOrientationAvg)}%</span>
                                                <span className="text-[10px] text-zinc-400">Average Score</span>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-300">--</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {campus.preparednessAvg !== null ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-bold text-blue-600">{Math.round(campus.preparednessAvg)}%</span>
                                                <span className="text-[10px] text-zinc-400">Average Score</span>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-300">--</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {campus.otherAvg !== null ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-bold text-zinc-600">{Math.round(campus.otherAvg)}%</span>
                                                <span className="text-[10px] text-zinc-400">Average Score</span>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-300">--</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between items-center w-full">
                                                <span className="text-xs font-bold">{Math.round(campus.completionRate)}%</span>
                                                <span className="text-[10px] text-zinc-400">{campus.totalCompleted}/{campus.totalExpected}</span>
                                            </div>
                                            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${campus.completionRate}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                                            <ArrowRight className="w-4 h-4 text-zinc-400" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={!!selectedCampus} onOpenChange={() => setSelectedCampus(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <div className="bg-primary p-6 text-white">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold">{selectedCampus} Details</DialogTitle>
                                    <p className="text-white/70 text-sm">Teacher-level performance and completion</p>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        {renderTeacherDetails(selectedCampus as string)}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
