import { useMemo, useState } from 'react';
import Heatmap from './Heatmap';
import { DEFAULT_COLORMAPS, type ColormapPreset, COOLWARM } from '../utils/colorMap';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { formatNumber, formatPercent } from '../utils/colorMap';
import { Eye, GitCompare, Activity } from 'lucide-react';

export function CompareView() {
  const { originalMatrix, reconstructResult, matrixMeta, currentRank } = useAnalysisStore();
  const [colormap, setColormap] = useState<ColormapPreset>(DEFAULT_COLORMAPS[0]);

  const reconstructed = reconstructResult?.reconstructed;

  if (!originalMatrix) {
    return (
      <div className="rounded-xl bg-spectrum-card/50 border border-spectrum-border p-8 text-center">
        <GitCompare className="mx-auto mb-3 opacity-50" size={32} />
        <div className="text-spectrum-muted text-sm">上传数据后可进行原始与重构对比</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Eye size={16} className="text-spectrum-accent" />
          <span className="font-medium text-spectrum-text">数据对比视图</span>
        </div>
        <ColormapSelector value={colormap} onChange={setColormap} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HeatmapWrapper
          title="原始数据"
          badge="Original"
          badgeColor="bg-spectrum-muted/30 text-spectrum-muted"
        >
          <Heatmap
            data={originalMatrix}
            min={matrixMeta?.min}
            max={matrixMeta?.max}
            colormap={colormap}
            showColorbar={false}
          />
        </HeatmapWrapper>
        <HeatmapWrapper
          title="低秩重构数据"
          badge={`Rank-${currentRank}`}
          badgeColor="bg-spectrum-primary/30 text-spectrum-primary"
        >
          {reconstructed ? (
            <Heatmap
              data={reconstructed}
              min={matrixMeta?.min}
              max={matrixMeta?.max}
              colormap={colormap}
              showColorbar
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-spectrum-muted text-sm">
              计算中...
            </div>
          )}
        </HeatmapWrapper>
      </div>
    </div>
  );
}

export function ResidualPanel() {
  const { reconstructResult, currentRank } = useAnalysisStore();
  const residual = reconstructResult?.residual;
  const hasResidual = !!residual && residual.length > 0 && (residual[0]?.length ?? 0) > 0;

  const stats = useMemo(() => {
    if (!reconstructResult) return null;
    return {
      frobenius: reconstructResult.frobeniusError,
      relative: reconstructResult.relativeError,
      energyRetained: reconstructResult.energyRetained,
    };
  }, [reconstructResult]);

  if (!reconstructResult) {
    return (
      <div className="rounded-xl bg-spectrum-card/50 border border-spectrum-border p-8 text-center">
        <Activity className="mx-auto mb-3 opacity-50" size={32} />
        <div className="text-spectrum-muted text-sm">完成重构后显示残差分析</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-spectrum-purple" />
          <span className="font-medium text-spectrum-text">残差分析</span>
        </div>
        <div className="text-xs text-spectrum-muted font-mono">
          k = {currentRank}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label="保留能量"
          value={stats ? formatPercent(stats.energyRetained, 3) : '—'}
          accent="from-spectrum-green/40 to-spectrum-accent/40 border-spectrum-green/40"
          textColor="text-spectrum-green"
        />
        <MetricCard
          label="Frobenius 误差"
          value={stats && hasResidual ? formatNumber(stats.frobenius, 4) : '计算中...'}
          accent="from-spectrum-primary/40 to-spectrum-purple/40 border-spectrum-primary/40"
          textColor="text-spectrum-primary"
        />
        <MetricCard
          label="相对误差"
          value={stats && hasResidual ? formatPercent(stats.relative, 3) : '计算中...'}
          accent="from-spectrum-purple/40 to-spectrum-accent/40 border-spectrum-purple/40"
          textColor="text-spectrum-purple"
        />
      </div>

      <div className="rounded-xl bg-spectrum-bg/40 border border-spectrum-border p-3">
        {hasResidual ? (
          <Heatmap
            data={residual!}
            colormap={COOLWARM}
            symmetric
            title="残差矩阵热力图"
            showColorbar
          />
        ) : (
          <div className="h-[280px] flex items-center justify-center text-spectrum-muted text-sm">
            <div className="text-center">
              <Activity className="mx-auto mb-2 opacity-40" size={24} />
              <div>释放滑动条后将重新计算残差矩阵</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeatmapWrapper({
  title,
  badge,
  badgeColor,
  children,
}: {
  title: string;
  badge: string;
  badgeColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-spectrum-bg/40 border border-spectrum-border p-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-medium text-spectrum-text">{title}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${badgeColor}`}>
          {badge}
        </span>
      </div>
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
  textColor,
}: {
  label: string;
  value: string;
  accent: string;
  textColor: string;
}) {
  return (
    <div
      className={`relative rounded-xl p-4 bg-gradient-to-br ${accent} border bg-opacity-10 backdrop-blur-sm`}
    >
      <div className="text-[10px] uppercase tracking-wider text-spectrum-muted mb-1">
        {label}
      </div>
      <div className={`font-mono font-bold text-xl ${textColor}`}>{value}</div>
    </div>
  );
}

function ColormapSelector({
  value,
  onChange,
}: {
  value: ColormapPreset;
  onChange: (c: ColormapPreset) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-spectrum-muted mr-1">色系</span>
      {DEFAULT_COLORMAPS.map((cm) => {
        const active = cm.name === value.name;
        return (
          <button
            key={cm.name}
            onClick={() => onChange(cm)}
            title={cm.name}
            className={[
              'w-7 h-7 rounded-md overflow-hidden border-2 transition-all',
              active
                ? 'border-spectrum-primary scale-110 shadow-glow'
                : 'border-spectrum-border hover:border-spectrum-muted',
            ].join(' ')}
            style={{
              background: `linear-gradient(90deg, ${cm.stops
                .map((s) => `rgb(${s.color.join(',')}) ${(s.position * 100).toFixed(0)}%`)
                .join(', ')})`,
            }}
          />
        );
      })}
    </div>
  );
}
