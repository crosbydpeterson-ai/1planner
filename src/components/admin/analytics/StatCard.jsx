import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, sub, color = "text-indigo-400" }) {
  return (
    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className={cn("w-4 h-4", color)} />}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-xl font-bold text-white leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}