'use client';

import { useUserStore } from '../stores/userStore';
import { useBoardStore } from '../stores/boardStore';
import { MousePointer2 } from 'lucide-react';

export default function LiveCursors() {
  const { users, me } = useUserStore();
  const { viewport } = useBoardStore();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {Object.values(users).map((user) => {
        if (user.id === me?.id || !user.cursor) return null;

        const x = user.cursor.x * viewport.zoom + viewport.x;
        const y = user.cursor.y * viewport.zoom + viewport.y;

        return (
          <div
            key={user.id}
            className="absolute top-0 left-0 transition-transform duration-75 ease-linear flex flex-col items-start"
            style={{ transform: `translate(${x}px, ${y}px)` }}
          >
            <MousePointer2
              size={20}
              color={user.color}
              className="drop-shadow-md"
              fill={user.color}
              fillOpacity={0.8}
            />
            <div
              className="ml-4 -mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-lg whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
