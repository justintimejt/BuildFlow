export interface Node {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    name: string;
    description?: string;
    attributes?: Record<string, string | number>;
  };
}

