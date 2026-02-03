import type { ScoutingReport } from '@/types/chat';
import { Target, Trophy, Crosshair, Clock, Swords, Shield } from 'lucide-react';

interface ScoutingReportCardProps {
  report: ScoutingReport;
}

export function ScoutingReportCard({ report }: ScoutingReportCardProps) {
  const metrics = report.metrics?.agg;

  return (
    <div className="rounded-xl overflow-hidden mb-5 border border-primary/30 bg-card">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary">SCOUTING REPORT</h3>
              <p className="text-xs text-muted-foreground">Data from GRID.gg</p>
            </div>
          </div>
          <span className="text-sm font-semibold bg-muted px-3 py-1.5 rounded-lg border border-border">
            {report.teamName || report.teamId}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-5">
          {metrics.seriesCount !== undefined && (
            <MetricItem icon={Trophy} label="Series Played" value={metrics.seriesCount.toString()} />
          )}
          {metrics.totalRounds !== undefined && (
            <MetricItem icon={Crosshair} label="Total Rounds" value={metrics.totalRounds.toString()} />
          )}
          {metrics.attackWinRate !== undefined && (
            <MetricItem
              icon={Swords}
              label="Attack Win Rate"
              value={`${Math.round(metrics.attackWinRate * 100)}%`}
              highlight={metrics.attackWinRate > 0.5}
            />
          )}
          {metrics.pistolWinRate !== undefined && (
            <MetricItem
              icon={Shield}
              label="Pistol Win Rate"
              value={`${Math.round(metrics.pistolWinRate * 100)}%`}
              highlight={metrics.pistolWinRate > 0.5}
            />
          )}
          {metrics.firstBloodRate !== undefined && (
            <MetricItem
              icon={Target}
              label="First Blood Rate"
              value={`${Math.round(metrics.firstBloodRate * 100)}%`}
              highlight={metrics.firstBloodRate > 0.5}
            />
          )}
          {metrics.avgRoundDuration !== undefined && (
            <MetricItem icon={Clock} label="Avg Round Time" value={`${Math.round(metrics.avgRoundDuration)}s`} />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 bg-muted/30 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Full scouting report generated. Future queries will be concise.
        </p>
      </div>
    </div>
  );
}

function MetricItem({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate">
          {label}
        </span>
        <span className={`font-mono font-bold text-base ${highlight ? 'text-primary' : 'text-foreground'}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
