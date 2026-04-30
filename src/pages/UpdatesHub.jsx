import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Mail, Info } from 'lucide-react';

const hubs = [
  {
    icon: MessageSquare,
    label: 'Community',
    description: 'Posts, polls & pet concepts',
    color: 'from-blue-500 to-cyan-500',
    path: '/community',
  },
  {
    icon: Mail,
    label: 'Messages',
    description: 'DMs & admin inbox',
    color: 'from-pink-500 to-rose-500',
    path: '/messages',
  },
  {
    icon: Info,
    label: 'Info',
    description: 'Updates, announcements & feedback',
    color: 'from-slate-500 to-slate-700',
    path: '/Info',
  },
];

export default function UpdatesHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-16 pb-24 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-1 mt-4">Updates</h1>
        <p className="text-slate-500 text-sm mb-6">Stay in the loop</p>

        <div className="space-y-4">
          {hubs.map((hub) => (
            <button
              key={hub.label}
              onClick={() => navigate(hub.path)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-95"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${hub.color} flex items-center justify-center flex-shrink-0`}>
                <hub.icon className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-800 text-lg">{hub.label}</div>
                <div className="text-slate-500 text-sm">{hub.description}</div>
              </div>
              <div className="ml-auto text-slate-300 text-xl">›</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}