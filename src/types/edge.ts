export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string; // 'smoothstep' | 'step' | 'straight' | 'bezier' - controls line shape
  label?: string;
  animated?: boolean;
  style?: {
    strokeDasharray?: string; // '0' for solid, '5,5' for dashed, '2,2' for dotted
  };
}

