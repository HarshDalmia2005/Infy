'use client';

import Canvas from '../../../components/Canvas';
import Toolbar from '../../../components/Toolbar';
import ColorPicker from '../../../components/ColorPicker';
import LiveCursors from '../../../components/LiveCursors';
import UserPanel from '../../../components/UserPanel';
import ChatDrawer from '../../../components/ChatDrawer';
import ShareModal from '../../../components/ShareModal';
import Minimap from '../../../components/Minimap';
import ActionBar from '../../../components/ActionBar';
import ExportMenu from '../../../components/ExportMenu';
import { useSocket } from '../../../hooks/useSocket';

export default function BoardClient({ boardId }: { boardId: string }) {
  useSocket(boardId);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[var(--color-void)]">
      <LiveCursors />
      <Canvas />
      <Toolbar />
      <ActionBar />
      <ColorPicker />
      <ShareModal />
      <ExportMenu />
      <Minimap />
      <UserPanel />
      <ChatDrawer />
    </div>
  );
}

