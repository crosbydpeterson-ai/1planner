import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChefHat, Coins } from 'lucide-react';
import { createPageUrl } from '@/utils';

const hubs = [
  {
    icon: ShoppingBag,
    label: 'Shop',
    description: 'Pets, themes, cosmetics & more',
    color: 'from-purple-500 to-indigo-600',
    path: () => createPageUrl('Shop'),
  },
  {
    icon: Coins,
    label: 'Market',
    description: 'Trade & buy from other players',
    color: 'from-yellow-500 to-orange-500',
    path: () => createPageUrl('Marketplace'),
  },
  {
    icon: ChefHat,
    label: 'Kitchen',
    description: 'Cook food for your pets',
    color: 'from-green-500 to-emerald-600',
    path: () => '/Kitchen',
  },
];

export default function MarketplaceHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-16 pb-24 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-1 mt-4">Marketplace</h1>
        <p className="text-slate-500 text-sm mb-6">Where do you want to go?</p>

        <div className="space-y-4">
          {hubs.map((hub) => (
            <button
              key={hub.label}
              onClick={() => navigate(hub.path())}
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