import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HOSOKRData } from '@/services/okrService';
import { Users, Eye, TrendingUp, Clock, Target, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    data: HOSOKRData;
}

export const HOSOKRView: React.FC<Props> = ({ data }) => {
    const coverageRate = data.totalTeachers > 0
        ? Math.round((data.teachersObserved / data.totalTeachers) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black text-zinc-900">Campus OKR Overview</h2>
                <p className="text-sm text-zinc-400 font-medium">School-level performance indicators and teacher coverage metrics</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <Card className="border-none shadow-xl rounded-2xl">
                    <CardContent className="pt-6">
                        <Users className="w-5 h-5 text-blue-500 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Teachers</p>
                        <p className="text-3xl font-black text-zinc-800">{data.totalTeachers}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl rounded-2xl">
                    <CardContent className="pt-6">
                        <Eye className="w-5 h-5 text-emerald-500 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Teachers Observed</p>
                        <p className="text-3xl font-black text-emerald-700">{data.teachersObserved}</p>
                        <p className="text-xs text-zinc-400 mt-1">{coverageRate}% coverage</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl rounded-2xl">
                    <CardContent className="pt-6">
                        <XCircle className="w-5 h-5 text-red-400 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Not Yet Observed</p>
                        <p className="text-3xl font-black text-red-600">{data.teachersNotObserved}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl rounded-2xl">
                    <CardContent className="pt-6">
                        <TrendingUp className="w-5 h-5 text-purple-500 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Avg Obs Score</p>
                        <p className="text-3xl font-black text-purple-700">
                            {data.avgObservationScore !== null ? data.avgObservationScore : '--'}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">{data.avgObservationsPerTeacher} obs/teacher</p>
                    </CardContent>
                </Card>
            </div>

            {/* Observation Coverage Bar */}
            <Card className="border-none shadow-xl rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-500" />
                        Observation Coverage
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-zinc-600">{data.teachersObserved} observed</span>
                        <span className="text-zinc-400">Target: all {data.totalTeachers}</span>
                    </div>
                    <Progress value={coverageRate} className="h-3 rounded-full" />
                    <div className="flex gap-2">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 border">{data.teachersObserved} Observed</Badge>
                        <Badge className="bg-red-50 text-red-700 border-red-100 border">{data.teachersNotObserved} Pending</Badge>
                        <Badge className="bg-amber-50 text-amber-700 border-amber-100 border">{data.avgTrainingHoursPerTeacher}h avg PD / teacher</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Observer Completion Table */}
            {data.observerCompletion.length > 0 && (
                <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-zinc-50 bg-zinc-50/30">
                        <CardTitle className="text-base font-bold">Observation Targets per Observer</CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-zinc-100">
                                    <TableHead className="text-xs font-bold uppercase text-zinc-400">Observer</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-zinc-400">Observations Done</TableHead>
                                    <TableHead className="text-xs font-bold uppercase text-zinc-400">Target Progress</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.observerCompletion.map((obs) => (
                                    <TableRow key={obs.observerId} className="border-zinc-50 hover:bg-zinc-50/50">
                                        <TableCell className="font-medium text-sm text-zinc-600">
                                            Observer #{obs.observerId.substring(0, 8)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{obs.count}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Progress value={obs.targetCompletion} className="h-2 w-28" />
                                                <span className="text-xs font-bold text-zinc-500">{obs.targetCompletion}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* Goal Completion per Teacher */}
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-zinc-50 bg-zinc-50/30">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        Goal Setting Completion per Teacher
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-zinc-100">
                                <TableHead className="text-xs font-bold uppercase text-zinc-400">Teacher</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-zinc-400">Goals</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-zinc-400">Completion</TableHead>
                                <TableHead className="text-xs font-bold uppercase text-zinc-400">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.goalCompletionByTeacher.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-zinc-400">No goal data available</TableCell>
                                </TableRow>
                            ) : data.goalCompletionByTeacher.map((t) => (
                                <TableRow key={t.teacherId} className="border-zinc-50 hover:bg-zinc-50/50">
                                    <TableCell className="font-bold text-sm text-zinc-700">{t.teacherName}</TableCell>
                                    <TableCell className="text-sm text-zinc-500">{t.completed} / {t.total}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={t.rate} className="h-2 w-20" />
                                            <span className="text-xs font-bold text-zinc-500">{t.rate}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {t.rate === 100 ? (
                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 border gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Complete
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-amber-50 text-amber-700 border-amber-100 border">In Progress</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};
