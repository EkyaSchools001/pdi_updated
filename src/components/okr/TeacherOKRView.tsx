import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TeacherOKRData } from '@/services/okrService';
import { TrendingUp, Target, Clock, BookOpen, CheckCircle2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    data: TeacherOKRData;
}

const MetricCard = ({ icon: Icon, label, value, sub, color = 'blue' }: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
    color?: string;
}) => {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        zinc: 'bg-zinc-50 text-zinc-600 border-zinc-100',
    };
    return (
        <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="pt-6 pb-5">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3 border', colorMap[color] || colorMap.blue)}>
                    <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">{label}</p>
                <p className="text-3xl font-black text-zinc-800">{value}</p>
                {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
            </CardContent>
        </Card>
    );
};

export const TeacherOKRView: React.FC<Props> = ({ data }) => {
    const pdProgress = data.pdTargetHours > 0
        ? Math.min(100, Math.round((data.pdHoursCompleted / data.pdTargetHours) * 100))
        : 0;

    const goalProgress = data.goalsTotal > 0
        ? Math.round((data.goalsCompleted / data.goalsTotal) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black text-zinc-900">My OKR Progress</h2>
                <p className="text-sm text-zinc-400 font-medium">Your personal performance indicators for this academic year</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <MetricCard
                    icon={Activity}
                    label="Self-Reflection Rate"
                    value={`${data.selfReflectionRate}%`}
                    sub={`${data.totalObservations} total observations`}
                    color="purple"
                />
                <MetricCard
                    icon={TrendingUp}
                    label="Avg Observation Score"
                    value={data.avgObservationScore !== null ? `${data.avgObservationScore}` : '--'}
                    sub="Out of 5.0"
                    color="emerald"
                />
                <MetricCard
                    icon={CheckCircle2}
                    label="Goals Completed"
                    value={`${data.goalsCompleted} / ${data.goalsTotal}`}
                    sub={`${goalProgress}% completion rate`}
                    color="blue"
                />
                <MetricCard
                    icon={Clock}
                    label="PD Hours Completed"
                    value={`${data.pdHoursCompleted}h`}
                    sub={`${data.pdHoursPending}h remaining to goal`}
                    color="amber"
                />
                <MetricCard
                    icon={BookOpen}
                    label="Self-Paced Learning"
                    value={data.selfPacedEngagement !== null ? `${data.selfPacedEngagement}%` : '--'}
                    sub="Course progress avg."
                    color="zinc"
                />
                <MetricCard
                    icon={Target}
                    label="PD Target"
                    value={`${data.pdTargetHours}h`}
                    sub="Annual PD goal"
                    color="blue"
                />
            </div>

            {/* PD Hours Progress */}
            <Card className="border-none shadow-xl rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        PD Hours Progress
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-zinc-600">{data.pdHoursCompleted}h completed</span>
                        <span className="text-zinc-400">Goal: {data.pdTargetHours}h</span>
                    </div>
                    <Progress value={pdProgress} className="h-3 rounded-full" />
                    <div className="flex justify-between text-xs text-zinc-400">
                        <span>{pdProgress}% of annual goal achieved</span>
                        <span className={data.pdHoursPending === 0 ? 'text-emerald-600 font-bold' : ''}>
                            {data.pdHoursPending === 0 ? '🎉 Goal reached!' : `${data.pdHoursPending}h to go`}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Goal Completion */}
            <Card className="border-none shadow-xl rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        Goal Setting Completion
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-zinc-600">{data.goalsCompleted} completed</span>
                        <span className="text-zinc-400">Total: {data.goalsTotal}</span>
                    </div>
                    <Progress value={goalProgress} className="h-3 rounded-full" />
                    <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                            {data.goalsCompleted} Done
                        </Badge>
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100">
                            {data.goalsTotal - data.goalsCompleted} In Progress
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
