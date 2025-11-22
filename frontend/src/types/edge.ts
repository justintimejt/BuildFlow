export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  animated?: boolean;
  style?: {
    strokeDasharray?: string;
    stroke?: string;
    strokeWidth?: number;
  };
}

