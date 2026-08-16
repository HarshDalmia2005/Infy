'use client';

import Canvas from '../../../components/Canvas';
import Toolbar from '../../../components/Toolbar';
import ColorPicker from '../../../components/ColorPicker';

export default function BoardClient({ boardId }: { boardId: string }) {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[var(--color-void)]">
      <Canvas />
      <Toolbar />
      <ColorPicker />
    </div>
  );
}
