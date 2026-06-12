import { useCallback } from 'react';
import FileUpload from '../components/FileUpload';
import SpectrumChart from '../components/SpectrumChart';
import RankSlider from '../components/RankSlider';
import { CompareView, ResidualPanel } from '../components/CompareView';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { RotateCcw, Sparkles, Database, Atom, Github } from 'lucide-react';

export default function Analyzer() {
  const { status, matrixMeta, reset, loadMatrix } = useAnalysisStore();

  const loadDemo = useCallback(
    (kind: 'random' | 'sin' | 'lowrank') => {
      const rows = 128;
      const cols = 128;
      const matrix: number[][] = [];
      if (kind === 'random') {
        for (let i = 0; i < rows; i++) {
          const row: number[] = [];
          for (let j = 0; j < cols; j++) {
            const r1 = Math.random() - 0.5;
            const r2 = Math.random() - 0.5;
            const r3 = Math.random() - 0.5;
            const g = Math.sqrt(-2 * Math.log(Math.max(1e-9, Math.abs(r1) + 1e-9))) * Math.cos(2 * Math.PI * r2);
            row.push(g * (r3 > 0 ? 1 : -1) * 0.5 + 0.5);
          }
          matrix.push(row);
        }
        void loadMatrix(matrix, 'demo-random.csv', 'csv');
      } else if (kind === 'sin') {
        for (let i = 0; i < rows; i++) {
          const row: number[] = [];
          for (let j = 0; j < cols; j++) {
            const x = (j / cols) * Math.PI * 8;
            const y = (i / rows) * Math.PI * 6;
            const v =
              0.5 +
              0.25 * Math.sin(x) * Math.cos(y) +
              0.15 * Math.sin(x * 0.5 + y * 0.7) +
              0.1 * Math.cos(x * 1.2 - y * 0.8);
            row.push(Math.max(0, Math.min(1, v)));
          }
          matrix.push(row);
        }
        void loadMatrix(matrix, 'demo-wave.csv', 'csv');
      } else {
        const rank = 8;
        const a: number[][] = [];
        const b: number[][] = [];
        for (let i = 0; i < rows; i++) {
          a.push(Array.from({ length: rank }, () => (Math.random() - 0.3) * 1.5));
        }
        for (let j = 0; j < cols; j++) {
          b.push(Array.from({ length: rank }, () => (Math.random() - 0.3) * 1.5));
        }
        for (let i = 0; i < rows; i++) {
          const row: number[] = [];
          for (let j = 0; j < cols; j++) {
            let s = 0;
            for (let k = 0; k < rank; k++) s += a[i][k] * b[j][k];
            const noise = (Math.random() - 0.5) * 0.2;
            row.push(1 / (1 + Math.exp(-s * 0.5)) + noise);
          }
          matrix.push(row);
        }
        void loadMatrix(matrix, 'demo-lowrank-8.csv', 'csv');
      }
    },
    [loadMatrix],
  );

  const showResults = !!matrixMeta;

  return (
    <div className="min-h-screen w-full text-spectrum-text">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-spectrum-bg/80 border-b border-spectrum-border/60">
        <div className="max-w-[1600px] mx-auto px-5 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-spectrum-primary/30 blur-lg animate-pulse-slow" />
              <div className="relative w-10 h-10 rounded-xl bg-spectrum-gradient flex items-center justify-center shadow-glow">
                <Atom size={20} className="text-white" />
              </div>
            </div>
            <div>
              <div className="font-display font-bold text-lg tracking-tight">
                SVD <span className="bg-spectrum-gradient bg-clip-text text-transparent bg-[length:200%_100%] animate-flow">谱能量降维分析台</span>
              </div>
              <div className="text-[11px] text-spectrum-muted font-mono -mt-0.5">
                Singular Value Decomposition · 零 GPU · 即查即用
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!showResults && (
              <div className="hidden md:flex items-center gap-1.5">
                <span className="text-xs text-spectrum-muted mr-1">示例</span>
                <DemoBtn onClick={() => loadDemo('sin')} label="波动场" />
                <DemoBtn onClick={() => loadDemo('lowrank')} label="低秩+噪声" />
                <DemoBtn onClick={() => loadDemo('random')} label="随机矩阵" />
              </div>
            )}
            <button
              onClick={reset}
              disabled={status === 'parsing' || status === 'decomposing'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-spectrum-border bg-spectrum-card/50 hover:border-spectrum-primary hover:bg-spectrum-card disabled:opacity-40 transition-all text-sm"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">重置</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-5 md:px-8 py-6 md:py-8">
        {!showResults ? (
          <LandingView loadDemo={loadDemo} />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 md:gap-6">
            <section className="xl:col-span-4 space-y-5 animate-fade-in-up">
              <FileUpload />
              <RankSlider />
              <div className="md:hidden">
                <DemoPanel loadDemo={loadDemo} />
              </div>
            </section>

            <section className="xl:col-span-8 space-y-6 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
              <SpectrumChart />
              <CompareView />
              <ResidualPanel />
            </section>
          </div>
        )}
      </main>

      <footer className="max-w-[1600px] mx-auto px-5 md:px-8 py-6 mt-8 border-t border-spectrum-border/50 text-xs text-spectrum-muted flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database size={14} />
          <span>基于 ml-matrix 的纯 CPU SVD 分解，零 GPU 依赖</span>
        </div>
        <div className="flex items-center gap-2">
          <Github size={14} />
          <span>© {new Date().getFullYear()} SVD Analyzer · Math-Powered</span>
        </div>
      </footer>
    </div>
  );
}

function LandingView({ loadDemo }: { loadDemo: (k: 'random' | 'sin' | 'lowrank') => void }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div className="xl:col-span-5 space-y-6 animate-fade-in-up">
        <div className="rounded-2xl bg-spectrum-card/70 border border-spectrum-border p-6 shadow-card spectrum-border-gradient">
          <h1 className="font-display font-bold text-3xl md:text-4xl mb-3 leading-tight">
            用奇异值分解，
            <br />
            <span className="bg-spectrum-gradient bg-clip-text text-transparent">
              洞察数据的谱能量结构
            </span>
          </h1>
          <p className="text-spectrum-muted text-sm leading-relaxed mb-5">
            SVD 将任意矩阵分解为 U·Σ·Vᵀ。对角阵 Σ 中的奇异值代表每个主成分的「能量强度」。
            通过截断低能量的奇异值，你可以以极少的信息损失完成高维数据的降维、压缩与去噪。
          </p>
          <FileUpload />
        </div>

        <FeatureGrid />
      </div>

      <div className="xl:col-span-7 space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <DemoPanel loadDemo={loadDemo} />
        <HowItWorks />
      </div>
    </div>
  );
}

function FeatureGrid() {
  const items = [
    {
      title: '通用数据输入',
      desc: '支持 CSV / Excel 数据表及单张灰度图片，自动解析为二维矩阵。',
      icon: '📊',
    },
    {
      title: '谱特征可视化',
      desc: '奇异值衰减曲线、累积能量占比，直观理解主成分分布。',
      icon: '📈',
    },
    {
      title: '交互式截断',
      desc: '拖动滑动条实时改变秩 k，秒级呈现重构与残差变化。',
      icon: '🎚️',
    },
    {
      title: '纯数学驱动',
      desc: '基于 ml-matrix 的 CPU 算法，零 GPU 依赖，任何浏览器即用。',
      icon: '⚙️',
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it, i) => (
        <div
          key={i}
          className="rounded-xl bg-spectrum-card/50 border border-spectrum-border p-4 hover:border-spectrum-primary/50 transition-all"
        >
          <div className="text-2xl mb-1.5">{it.icon}</div>
          <div className="font-medium text-sm text-spectrum-text mb-1">{it.title}</div>
          <div className="text-xs text-spectrum-muted leading-relaxed">{it.desc}</div>
        </div>
      ))}
    </div>
  );
}

function DemoPanel({ loadDemo }: { loadDemo: (k: 'random' | 'sin' | 'lowrank') => void }) {
  const demos = [
    {
      key: 'sin' as const,
      title: '正弦波动场',
      desc: '多频率叠加的平滑周期函数，观察低 k 即可捕获主能量。',
      tag: '高可压缩',
      color: 'from-spectrum-green/20 to-spectrum-accent/20 border-spectrum-green/40',
    },
    {
      key: 'lowrank' as const,
      title: '低秩+噪声',
      desc: '构造秩-8 矩阵并添加高斯噪声，观察 SVD 自动分离信号。',
      tag: '去噪演示',
      color: 'from-spectrum-primary/20 to-spectrum-purple/20 border-spectrum-primary/40',
    },
    {
      key: 'random' as const,
      title: '随机高斯矩阵',
      desc: '独立同分布的高斯随机矩阵，体验马尔可夫-帕斯特律分布。',
      tag: '极限分布',
      color: 'from-spectrum-purple/20 to-spectrum-accent/20 border-spectrum-purple/40',
    },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-spectrum-accent" />
        <span className="font-medium text-spectrum-text">快速体验 · 示例数据</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {demos.map((d) => (
          <button
            key={d.key}
            onClick={() => loadDemo(d.key)}
            className={`text-left rounded-xl p-4 bg-gradient-to-br ${d.color} border hover:scale-[1.02] transition-all shadow-card group`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-spectrum-text">{d.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-spectrum-bg/50 text-spectrum-muted font-mono">
                {d.tag}
              </span>
            </div>
            <div className="text-xs text-spectrum-muted leading-relaxed mb-3">{d.desc}</div>
            <div className="text-xs text-spectrum-accent group-hover:text-spectrum-green transition-colors font-medium">
              一键加载 →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: '①', t: '解析矩阵', d: '文件上传后解析为二维数值矩阵 M (m × n)' },
    { n: '②', t: 'SVD 分解', d: '计算 M = U · Σ · Vᵀ，其中 Σ 为奇异值降序排列的对角阵' },
    { n: '③', t: '截断秩 k', d: '仅保留前 k 个最大奇异值，丢弃低能量成分' },
    { n: '④', t: '低秩重构', d: 'M_k = U_k · Σ_k · V_kᵀ，对比原始数据观察压缩效果' },
  ];
  return (
    <div className="rounded-2xl bg-spectrum-card/50 border border-spectrum-border p-5">
      <div className="font-medium text-spectrum-text mb-4">工作原理 · SVD 截断降维流程</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {steps.map((s, i) => (
          <div key={i} className="relative">
            <div className="rounded-xl bg-spectrum-bg/60 border border-spectrum-border p-4 h-full">
              <div className="text-2xl font-display font-bold bg-spectrum-gradient bg-clip-text text-transparent mb-2">
                {s.n}
              </div>
              <div className="text-sm font-medium text-spectrum-text mb-1">{s.t}</div>
              <div className="text-xs text-spectrum-muted leading-relaxed">{s.d}</div>
            </div>
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-1.5 -translate-y-1/2 text-spectrum-muted/60 text-lg">
                →
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 p-4 rounded-xl bg-spectrum-bg/60 border border-spectrum-border/80 font-mono text-xs overflow-x-auto">
        <div className="text-spectrum-muted mb-1.5">// Truncated SVD</div>
        <div>
          <span className="text-spectrum-purple">const</span> <span className="text-spectrum-text">M_k</span> ={' '}
          <span className="text-spectrum-accent">U</span>
          <sub className="text-spectrum-green">k</sub> ·{' '}
          <span className="text-spectrum-accent">Σ</span>
          <sub className="text-spectrum-green">k</sub> ·{' '}
          <span className="text-spectrum-accent">V</span>
          <sub className="text-spectrum-green">k</sub>
          <span className="text-spectrum-muted">ᵀ</span>
        </div>
        <div className="mt-1 text-spectrum-muted">
          存储成本：m·k + k + n·k ≪ m·n &nbsp;·&nbsp; 能量保留：Σ<sub>1..k</sub> σᵢ² / Σ σᵢ²
        </div>
      </div>
    </div>
  );
}

function DemoBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 text-xs rounded-md border border-spectrum-border bg-spectrum-bg/60 hover:border-spectrum-primary hover:text-spectrum-primary text-spectrum-muted transition-all"
    >
      {label}
    </button>
  );
}
