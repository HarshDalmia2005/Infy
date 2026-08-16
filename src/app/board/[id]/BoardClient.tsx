'use client';

import Canvas from '../../../components/Canvas';
import Toolbar from '../../../components/Toolbar';
import ColorPicker from '../../../components/ColorPicker';
import LiveCursors from '../../../components/LiveCursors';
import UserPanel from '../../../components/UserPanel';
import { useSocket } from '../../../hooks/useSocket';

export default function BoardClient({ boardId }: { boardId: string }) {
  useSocket(boardId);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[var(--color-void)]">
      <LiveCursors />
      <Canvas />
      <Toolbar />
      <ColorPicker />
      <UserPanel />
    </div>
  );
}
