import { Line } from 'react-konva';

type TempConnectionLineProps = {
  from: { x: number; y: number };
  to: { x: number; y: number };
};

export const TempConnectionLine = ({ from, to }: TempConnectionLineProps) => (
  <Line
    points={[from.x, from.y, to.x, to.y]}
    stroke="#4A9EFF"
    strokeWidth={4}
    dash={[10, 5]}
    listening={false}
  />
);
