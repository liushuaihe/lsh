import { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { formatNumber, formatPercent } from '../utils/colorMap';
import { Zap, TrendingDown } from 'lucide-react';

export default function SpectrumChart() {
  const { svdResult, currentRank } = useAnalysisStore();

  const data = useMemo(() => {
    if (!svdResult) return [];
    const { singularValues, cumulativeEnergy } = svdResult;
    const n = singularValues.length;
    const maxPoints = 200;
    const step = Math.max(1, Math.floor(n / maxPoints));
    const arr: {
      k: number;
      singular: number;
      logSingular: number;
      cumulative: number;
      individual: number;
    }[] = [];
    for (let i = 0; i < n; i += step) {
      const sv = singularValues[i] ?? 0;
      const total = svdResult.totalEnergy || 1;
      arr.push({
        k: i + 1,
        singular: sv,
        logSingular: sv > 0 ? Math.log10(sv) : -10,
        cumulative: cumulativeEnergy[i] ?? 0,
        individual: (sv * sv) / total,
      });
    }
    return arr;
  }, [svdResult]);

  if (!svdResult) {
    return (
      <div className="h-[260px] rounded-xl bg-spectrum-card/50 border border-spectrum-border flex items-center justify-center">
        <div className="text-spectrum-muted text-sm text-center">
          <Zap className="mx-auto mb-2 opacity-50" size={28} />
          <div>上传数据后将显示奇异值谱分析</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown size={16} className="text-spectrum-accent" />
          <span className="font-medium text-spectrum-text">谱能量分析</span>
        </div>
        <div className="text-xs text-spectrum-muted">
          秩 <span className="font-mono text-spectrum-green">{svdResult.dimensions.rank}</span> · 奇异值{' '}
          <span className="font-mono text-spectrum-primary">{svdResult.singularValues.length}</span>
        </div>
      </div>

      <div className="h-[200px] rounded-xl bg-spectrum-bg/40 border border-spectrum-border p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="svGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a6b" />
            <XAxis
              dataKey="k"
              tick={{ fontSize: 10, fill: '#64748b' }}
              stroke="#1e3a6b"
              label={{ value: '奇异值序号 (k)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: '#8b5cf6' }}
              stroke="#8b5cf6"
              label={{ value: 'log₁₀(σ)', angle: -90, position: 'insideLeft', fill: '#8b5cf6', fontSize: 10 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: '#10b981' }}
              stroke="#10b981"
              domain={[0, 1]}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              label={{ value: '累积能量', angle: 90, position: 'insideRight', fill: '#10b981', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                background: '#0f2040',
                border: '1px solid #1e3a6b',
                borderRadius: 8,
                fontSize: 12,
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#3b82f6', fontWeight: 600 }}
              formatter={(v: number, name: string) => {
                if (name === 'singular' || name === 'logSingular') {
                  return [formatNumber(v, 4), '奇异值 σ'];
                }
                if (name === 'cumulative') return [formatPercent(v, 2), '累积能量'];
                if (name === 'individual') return [formatPercent(v, 2), '单值贡献'];
                return [String(v), name];
              }}
              labelFormatter={(l) => `k = ${l}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(v) =>
                v === 'logSingular' ? '奇异值 (log)' : v === 'cumulative' ? '累积能量' : v
              }
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="logSingular"
              fill="url(#svGrad)"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
            <ReferenceLine
              yAxisId="right"
              x={currentRank}
              stroke="#3b82f6"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: `k=${currentRank}`, fill: '#3b82f6', fontSize: 10, position: 'top' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <EnergyTable />
    </div>
  );
}

function EnergyTable() {
  const { svdResult, currentRank } = useAnalysisStore();
  if (!svdResult) return null;
  const n = svdResult.singularValues.length;
  const top = Math.min(n, currentRank);
  const topSingular = svdResult.singularValues.slice(0, top);
  const topSum = topSingular.reduce((s, v) => s + v * v, 0);
  const topEnergy = svdResult.totalEnergy > 0 ? topSum / svdResult.totalEnergy : 0;

  const k50 = findKForEnergy(svdResult.cumulativeEnergy, 0.5);
  const k90 = findKForEnergy(svdResult.cumulativeEnergy, 0.9);
  const k99 = findKForEnergy(svdResult.cumulativeEnergy, 0.99);

  const items = [
    { label: '当前 k=' + currentRank, value: formatPercent(topEnergy, 2), color: 'text-spectrum-primary' },
    { label: '50% 能量', value: `k = ${k50}`, color: 'text-spectrum-purple' },
    { label: '90% 能量', value: `k = ${k90}`, color: 'text-spectrum-accent' },
    { label: '99% 能量', value: `k = ${k99}`, color: 'text-spectrum-green' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-lg bg-spectrum-bg/60 border border-spectrum-border px-3 py-2.5 text-center"
        >
          <div className={`font-mono font-semibold text-sm ${it.color}`}>{it.value}</div>
          <div className="text-[10px] text-spectrum-muted mt-0.5">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

function findKForEnergy(cumulative: number[], target: number): number {
  for (let i = 0; i < cumulative.length; i++) {
    if (cumulative[i] >= target) return i + 1;
  }
  return cumulative.length;
}
