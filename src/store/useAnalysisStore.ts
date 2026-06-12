import { create } from 'zustand';
import type {
  AnalysisStatus,
  MatrixMeta,
  SvdResult,
  ReconstructResult,
  FileType,
} from '../../shared/types';
import {
  uploadParseFile,
  decompose,
  reconstructData,
  reconstructFast as apiReconstructFast,
} from '../utils/api';

interface AnalysisState {
  status: AnalysisStatus;
  progress: number;
  message: string;
  originalMatrix: number[][] | null;
  matrixMeta: MatrixMeta | null;
  svdResult: SvdResult | null;
  currentRank: number;
  reconstructResult: ReconstructResult | null;
  error: string | null;

  setRank: (rank: number) => void;
  uploadFile: (file: File) => Promise<void>;
  loadMatrix: (matrix: number[][], filename: string, type: FileType) => Promise<void>;
  doDecompose: () => Promise<void>;
  doReconstruct: (fast?: boolean) => Promise<void>;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  status: 'idle',
  progress: 0,
  message: '',
  originalMatrix: null,
  matrixMeta: null,
  svdResult: null,
  currentRank: 1,
  reconstructResult: null,
  error: null,

  setRank: (rank: number) => {
    set({ currentRank: rank });
    void get().doReconstruct(true);
  },

  uploadFile: async (file: File) => {
    try {
      set({ status: 'parsing', progress: 10, message: '解析文件中...', error: null });
      const parsed = await uploadParseFile(file);
      set({ progress: 40 });

      set({
        originalMatrix: parsed.matrix,
        matrixMeta: parsed.meta,
        currentRank: 1,
        svdResult: null,
        reconstructResult: null,
      });

      await get().doDecompose();
    } catch (e: any) {
      set({
        status: 'error',
        error: e?.message || '文件解析失败',
        progress: 0,
        message: '',
      });
    }
  },

  loadMatrix: async (matrix: number[][], filename: string, type: FileType) => {
    try {
      set({ status: 'parsing', progress: 10, message: '加载矩阵中...', error: null });
      const min = Math.min(...matrix.flat());
      const max = Math.max(...matrix.flat());
      set({
        originalMatrix: matrix,
        matrixMeta: {
          filename,
          type,
          rows: matrix.length,
          cols: matrix[0]?.length ?? 0,
          min,
          max,
        },
        currentRank: 1,
        svdResult: null,
        reconstructResult: null,
        progress: 40,
      });
      await get().doDecompose();
    } catch (e: any) {
      set({ status: 'error', error: e?.message || '矩阵加载失败', progress: 0 });
    }
  },

  doDecompose: async () => {
    const { originalMatrix } = get();
    if (!originalMatrix) return;

    try {
      set({ status: 'decomposing', progress: 50, message: '执行 SVD 分解中...' });
      const result = await decompose(originalMatrix);
      const defaultRank = Math.max(
        1,
        Math.min(result.singularValues.length, Math.ceil(result.dimensions.rank * 0.1 || 1)),
      );
      set({
        svdResult: result,
        currentRank: defaultRank,
        progress: 80,
        message: '计算重构中...',
      });
      await get().doReconstruct(false);
      set({ status: 'ready', progress: 100, message: '分析完成' });
    } catch (e: any) {
      set({
        status: 'error',
        error: e?.message || 'SVD 分解失败',
        progress: 0,
        message: '',
      });
    }
  },

  doReconstruct: async (fast = false) => {
    const { svdResult, originalMatrix, currentRank } = get();
    if (!svdResult || !originalMatrix) return;

    try {
      if (fast) {
        const result = await apiReconstructFast(
          svdResult.U,
          svdResult.singularValues,
          svdResult.V,
          currentRank,
        );
        set((state) => ({
          reconstructResult: state.reconstructResult
            ? {
                ...state.reconstructResult,
                reconstructed: result.reconstructed,
                energyRetained: result.energyRetained,
              }
            : {
                reconstructed: result.reconstructed,
                residual: [],
                energyRetained: result.energyRetained,
                frobeniusError: 0,
                relativeError: 0,
              },
        }));
      } else {
        const result = await reconstructData(
          svdResult.U,
          svdResult.singularValues,
          svdResult.V,
          originalMatrix,
          currentRank,
        );
        set({ reconstructResult: result });
      }
    } catch (e: any) {
      console.warn('Reconstruct warning:', e?.message);
    }
  },

  reset: () => {
    set({
      status: 'idle',
      progress: 0,
      message: '',
      originalMatrix: null,
      matrixMeta: null,
      svdResult: null,
      currentRank: 1,
      reconstructResult: null,
      error: null,
    });
  },
}));
