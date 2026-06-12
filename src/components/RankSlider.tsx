import { useMemo } from 'react';
import { Sliders, Minus, Plus, Sparkles } from 'lucide-react';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { formatPercent, findRankForEnergy } from '../utils/colorMap';

export default function RankSlider() {
  const { svdResult, currentRank, setRank, reconstructResult, status } = useAnalysisStore();

  const maxRank = svdResult?.singularValues.length ?? 0;

  const energyRetained = useMemo(() => {
    if (reconstructResult?.energyRetained !== undefined && reconstructResult.energyRetained > 0) {
      return reconstructResult.energyRetained;
    }
    if (svdResult?.cumulativeEnergy) {
      return svdResult.cumulativeEnergy[currentRank - 1] ?? 0;
    }
    return 0;
  }, [reconstructResult, svdResult, currentRank]);

  if (!svdResult || maxRank === 0) {
    return (
      <div className="rounded-xl bg-spectrum-card/50 border border-spectrum-border p-5">
        <div className="text-spectrum-muted text-sm text-center py-6">
          <Sparkles className="mx-auto mb-2 opacity-50" size={28} />
          <div>完成 SVD 分解后可调整截断秩</div>
        </div>
      </div>
    );
  }

  const disabled = status === 'parsing' || status === 'decomposing';
  const compressionRatio = currentRank / maxRank;

  const presetTargets = [0.5, 0.9, 0.99];

  return (
    <div className="rounded-xl bg-spectrum-card/80 border border-spectrum-border p-5 shadow-card relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-spectrum-gradient opacity-80" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-spectrum-primary" />
          <span className="font-medium text-spectrum-text">截断秩控制</span>
        </div>
        <div className="text-xs text-spectrum-muted font-mono">
          最大 k = {maxRank}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="relative flex items-center justify-center">
          <EnergyRing value={energyRetained} />
        </div>
        <div className="col-span-2 space-y-3">
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-spectrum-muted">截断秩 k</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRank(Math.max(1, currentRank - 1))}
                disabled={disabled || currentRank <= 1}
                className="p-1 rounded bg-spectrum-bg border border-spectrum-border hover:border-spectrum-primary disabled:opacity-40 transition-colors"
              >
                <Minus size={14} />
              </button>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={1}
                  max={maxRank}
                  step={1}
                  value={currentRank}
                  disabled={disabled}
                  onChange={(e) => setRank(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
              <button
                onClick={() => setRank(Math.min(maxRank, currentRank + 1))}
                disabled={disabled || currentRank >= maxRank}
                className="p-1 rounded bg-spectrum-bg border border-spectrum-border hover:border-spectrum-primary disabled:opacity-40 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-mono text-spectrum-primary text-base font-semibold">
              k = {currentRank}
            </span>
            <span className="text-spectrum-muted">
              压缩率 <span className="font-mono text-spectrum-green">{formatPercent(compressionRatio, 1)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-spectrum-muted mb-2">
          快速选择 · 能量保留
        </div>
        <div className="flex flex-wrap gap-2">
          {presetTargets.map((t) => {
            const k = findRankForEnergy(svdResult.cumulativeEnergy, t);
            const active = Math.abs(currentRank - k) < 2;
            return (
              <button
                key={t}
                onClick={() => setRank(k)}
                className={[
                  'px-3 py-1.5 rounded-md text-xs font-mono border transition-all',
                  active
                    ? 'border-spectrum-primary bg-spectrum-primary/20 text-spectrum-primary'
                    : 'border-spectrum-border bg-spectrum-bg/60 text-spectrum-muted hover:border-spectrum-accent hover:text-spectrum-accent',
                ].join(' ')}
              >
                {(t * 100).toFixed(0)}% · k={k}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EnergyRing({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value));
  const R = 36;
  const C = 2 * Math.PI * R;
  const dash = C * pct;
  return (
    <div className="relative w-[110px] h-[110px]">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={R} stroke="#1e3a6b" strokeWidth="7" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={R}
          stroke="url(#ringGrad)"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          style={{ transition: 'stroke-dasharray 0.3s ease' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold font-mono text-spectrum-text">
          {formatPercent(pct, 1).replace('%', '')}
        </div>
        <div className="text-[10px] text-spectrum-muted mt-0.5">保留能量</div>
      </div>
    </div>
  );
}
