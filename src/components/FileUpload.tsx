import { useCallback, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Image, Database, X, Loader2 } from 'lucide-react';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { formatBytes, formatNumber } from '../utils/colorMap';

export default function FileUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { status, error, matrixMeta, progress, message, uploadFile, reset } = useAnalysisStore();
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const file = files[0];
      if (file) void uploadFile(file);
    },
    [uploadFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const loading = status === 'parsing' || status === 'decomposing';

  return (
    <div className="w-full">
      {!matrixMeta ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={[
            'relative cursor-pointer rounded-xl p-6 transition-all duration-300 border-2 border-dashed spectrum-border-gradient',
            dragActive
              ? 'bg-spectrum-primary/10 border-spectrum-primary scale-[1.01]'
              : 'bg-spectrum-card/50 border-spectrum-border hover:border-spectrum-primary/60 hover:bg-spectrum-card/80',
            loading ? 'pointer-events-none opacity-70' : '',
          ].join(' ')}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.tsv,.xlsx,.xls,.png,.jpg,.jpeg,.bmp"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-spectrum-primary/20 blur-xl animate-pulse-slow" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-spectrum-purple via-spectrum-primary to-spectrum-accent flex items-center justify-center shadow-glow">
                <Upload size={28} className="text-white" />
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-spectrum-text mb-1">
                拖拽文件到此处或点击上传
              </div>
              <div className="text-sm text-spectrum-muted">
                支持 CSV / Excel 数据表 或 单张灰度图片（PNG/JPG/BMP）
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                { Icon: FileSpreadsheet, label: 'CSV', color: 'text-spectrum-green' },
                { Icon: FileSpreadsheet, label: 'Excel', color: 'text-spectrum-primary' },
                { Icon: Image, label: '图片', color: 'text-spectrum-purple' },
              ].map(({ Icon, label, color }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-spectrum-bg/60 border border-spectrum-border text-xs"
                >
                  <Icon size={14} className={color} />
                  <span className="text-spectrum-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {loading && (
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-spectrum-muted">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin text-spectrum-primary" />
                  {message || '处理中...'}
                </span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-spectrum-bg overflow-hidden">
                <div
                  className="h-full bg-spectrum-gradient animate-flow bg-[length:200%_100%]"
                  style={{ width: `${progress}%`, transition: 'width 0.3s' }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl p-5 bg-spectrum-card/80 border border-spectrum-border shadow-card relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-spectrum-gradient" />
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-spectrum-primary/20 to-spectrum-accent/20 flex items-center justify-center border border-spectrum-border">
                {matrixMeta.type === 'image' ? (
                  <Image size={20} className="text-spectrum-purple" />
                ) : matrixMeta.type === 'csv' ? (
                  <FileSpreadsheet size={20} className="text-spectrum-green" />
                ) : (
                  <Database size={20} className="text-spectrum-primary" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-spectrum-text truncate max-w-[220px]">
                  {matrixMeta.filename}
                </div>
                <div className="text-xs text-spectrum-muted mt-0.5 capitalize">
                  {matrixMeta.type} · {formatMatrixSize(matrixMeta.rows, matrixMeta.cols)}
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              className="p-2 rounded-lg hover:bg-spectrum-bg transition-colors text-spectrum-muted hover:text-spectrum-text group"
              title="重置"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <InfoTile label="行数" value={formatNumber(matrixMeta.rows, 0)} />
            <InfoTile label="列数" value={formatNumber(matrixMeta.cols, 0)} />
            <InfoTile label="最小值" value={formatNumber(matrixMeta.min, 3)} />
            <InfoTile label="最大值" value={formatNumber(matrixMeta.max, 3)} />
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-spectrum-bg/60 border border-spectrum-border px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-spectrum-muted mb-0.5">
        {label}
      </div>
      <div className="font-mono text-spectrum-text text-sm">{value}</div>
    </div>
  );
}

function formatMatrixSize(rows: number, cols: number): string {
  const total = rows * cols;
  return `${rows}×${cols} = ${formatNumber(total, 0)} 元素`;
}
