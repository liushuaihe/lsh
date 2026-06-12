export * from '../../shared/types';

export interface HeatmapColorStop {
  position: number;
  color: [number, number, number];
}

export interface ColormapPreset {
  name: string;
  stops: HeatmapColorStop[];
}
