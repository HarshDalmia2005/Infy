'use client';

import { useUserStore } from '../stores/userStore';
import { Users } from 'lucide-react';
import { useState } from 'react';

export default function UserPanel() {
  const { users, me } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const allUsers = Object.values(users);
  
  return (
    <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="glass-heavy rounded-full p-3 flex items-center justify-center text-white/80 hover:text-white transition-all shadow-xl hover:shadow-2xl relative"
      >
        <Users size={20} />
        {allUsers.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white border border-[#0a0a0f]">
            {allUsers.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="glass-heavy rounded-2xl p-4 w-48 flex flex-col gap-3 shadow-2xl origin-top-right">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Online ({allUsers.length})</h3>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
            {allUsers.map(user => (
              <div key={user.id} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: user.color }} />
                <span className="text-sm text-white/90 truncate">
                  {user.name} {user.id === me?.id && <span className="text-white/40">(You)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
