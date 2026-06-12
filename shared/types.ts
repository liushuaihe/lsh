export type FileType = 'csv' | 'excel' | 'image';

export interface MatrixMeta {
  filename: string;
  type: FileType;
  rows: number;
  cols: number;
  min: number;
  max: number;
}

export interface SvdDimensions {
  rows: number;
  cols: number;
  rank: number;
}

export interface SvdResult {
  singularValues: number[];
  U: number[][];
  V: number[][];
  cumulativeEnergy: number[];
  totalEnergy: number;
  dimensions: SvdDimensions;
}

export interface ReconstructResult {
  reconstructed: number[][];
  residual: number[][];
  energyRetained: number;
  frobeniusError: number;
  relativeError: number;
}

export interface ParseResponse {
  matrix: number[][];
  meta: MatrixMeta;
}

export interface SvdResponse extends SvdResult {
  success: boolean;
}

export interface ReconstructResponse extends ReconstructResult {
  success: boolean;
}

export type AnalysisStatus = 'idle' | 'loading' | 'parsing' | 'decomposing' | 'ready' | 'error';
