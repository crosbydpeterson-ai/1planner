import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ClipboardList, Trophy, Gift, Sparkles, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  
  // Don't show navigation on Home (login) page or Admin page
  const hideNav = currentPageName === 'Home' || currentPageName === 'Admin';
  
  const navItems = [
    { name: 'Dashboard', icon: Home, label: 'Home' },
    { name: 'Assignments', icon: ClipboardList, label: 'Quests' },
    { name: 'Leaderboard', icon: Trophy, label: 'Rank' },
    { name: 'Rewards', icon: Gift, label: 'Shop' },
    { name: 'Season', icon: Sparkles, label: 'Season' },
  ];

  return (
    <div className="min-h-screen">
      {children}
      
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 safe-area-pb">
          <div className="max-w-md mx-auto flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = currentPageName === item.name;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  className={cn(
                    "flex flex-col items-center py-1 px-3 rounded-xl transition-all",
                    isActive 
                      ? "text-indigo-600" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </Link>
              );
            })}
            <Link
              to={createPageUrl('Admin')}
              className={cn(
                "flex flex-col items-center py-1 px-3 rounded-xl transition-all",
                currentPageName === 'Admin' 
                  ? "text-red-600" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Shield className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">Admin</span>
            </Link>
          </div>
        </nav>
      )}
      
      <style>{`
        .safe-area-pb {
          padding-bottom: max(env(safe-area-inset-bottom), 8px);
        }
      `}</style>
    </div>
  );
}