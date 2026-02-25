import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminOKRData, CampusOKRMetric } from '@/services/okrService';
import { TrendingUp, Users, Eye, BookOpen, Star, Award, Activity, Search } from 'lucide-react';

interface Props {
    data: AdminOKRData;
    isManagement?: boolean;
}

const fmt = (val: number | null, suffix = '') => val !== null ? `${val}${suffix}` : '--';

const CampusRow: React.FC<{ c: CampusOKRMetric }> = ({ c }) => (
    <TableRow className="border-zinc-50 hover:bg-zinc-50/50">
        <TableCell className="font-bold text-sm text-zinc-800">{c.campus}</TableCell>
        <TableCell>
            <div className="flex items-center gap-2">
                <Progress value={c.observationCompletionRate} className="h-2 w-18" />
                <span className={`text-xs font-bold ${c.observationCompletionRate >= 80 ? 'text-emerald-600' : c.observationCompletionRate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                    {c.observationCompletionRate}%
                </span>
            </div>
        </TableCell>
        <TableCell className="font-mono text-sm">{fmt(c.avgObservationScore)}</TableCell>
        <TableCell className="font-mono text-sm">{fmt(c.postOrientationAvg, '%')}</TableCell>
        <TableCell className="font-mono text-sm">{fmt(c.preparednessAvg, '%')}</TableCell>
        <TableCell className="font-mono text-sm">{fmt(c.avgInstructionalTools)}</TableCell>
        <TableCell className="font-mono text-sm">{fmt(c.avgPDFeedbackScore, '/5')}</TableCell>
        <TableCell className="font-mono text-sm">{fmt(c.selfPacedEngagement, '%')}</TableCell>
        <TableCell className="font-mono text-sm">{fmt(c.schoolLeadershipSupportScore)}</TableCell>
        <TableCell>
            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 border">
                {c.shortlistedFestivalApps}
            </Badge>
        </TableCell>
    </TableRow>
);

export const AdminOKRView: React.FC<Props> = ({ data, isManagement }) => {
    const [search, setSearch] = useState('');
    const filtered = data.perCampus.filter(c =>
        c.campus.toLowerCase().includes(search.toLowerCase())
    );

    const { overall } = data;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black text-zinc-900">
                    {isManagement ? 'Executive OKR Dashboard' : 'System-Wide OKR Analytics'}
                </h2>
                <p className="text-sm text-zinc-400 font-medium">
                    {isManagement ? 'Strategic overview for all campuses' : 'Full system metrics across all campuses'}
                </p>
            </div>

            {/* Overall Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="border-none shadow-xl rounded-2xl">
                    <CardContent className="pt-5">
                        <Users className="w-5 h-5 text-blue-500 mb-2" />
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Teachers</p>
                        <p className="text-2xl font-black text-zinc-800">{overall.totalTeachers}</p>
                        <p className="text-xs text-zinc-400">{overall.totalCampuses} campuses</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl rounded-2xl">
                    <CardContent className="pt-5">
                        <Eye className="w-5 h-5 text-emerald-500 mb-2" />
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Obs Completion</p>
                        <p className="text-2xl font-black text-emerald-700">{overall.observationCompletionRate}%</p>
                        <p className="text-xs text-zinc-400">System-wide avg</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl rounded-2xl">
                    <CardContent className="pt-5">
                        <TrendingUp className="w-5 h-5 text-purple-500 mb-2" />
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Avg Obs Score</p>
                        <p className="text-2xl font-black text-purple-700">
                            {overall.avgObservationScore !== null ? overall.avgObservationScore : '--'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl rounded-2xl">
                    <CardContent className="pt-5">
                        <Award className="w-5 h-5 text-amber-500 mb-2" />
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Festival Shortlisted</p>
                        <p className="text-2xl font-black text-amber-700">{overall.totalShortlistedFestivalApps}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl rounded-2xl">
                    <CardContent className="pt-5">
                        <Activity className="w-5 h-5 text-rose-500 mb-2" />
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Campuses</p>
                        <p className="text-2xl font-black text-rose-700">{overall.totalCampuses}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Overall Observation Completion Bar */}
            <Card className="border-none shadow-xl rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-500" />
                        Overall Observation Completion
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Progress value={overall.observationCompletionRate} className="h-3 rounded-full mb-2" />
                    <p className="text-xs text-zinc-400">{overall.observationCompletionRate}% of all teachers observed system-wide</p>
                </CardContent>
            </Card>

            {/* Per-Campus Table */}
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-zinc-50 bg-zinc-50/30">
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle className="text-base font-bold">Per-Campus Breakdown</CardTitle>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <Input
                                placeholder="Filter campus..."
                                className="pl-9 w-48 h-8 text-sm bg-white border-zinc-100"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-zinc-100">
                                <TableHead className="text-xs font-bold uppercase text-zinc-400 min-w-[110px]">Campus</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-zinc-400 min-w-[130px]">Obs Completion</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-zinc-400">Avg Obs Score</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-zinc-400">Post-Orientation Avg</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-zinc-400">Preparedness Avg</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-zinc-400">Avg Instr. Tools</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-zinc-400">PD Feedback</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-zinc-400">Self-Paced Eng.</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-zinc-400">Leadership Score</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-zinc-400">Festival Shortlisted</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-12 text-zinc-400">
                                        No campus data available
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map(c => <CampusRow key={c.campus} c={c} />)}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};
