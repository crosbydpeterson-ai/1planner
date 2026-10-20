import React from "react";
import { cn } from "@/lib/utils";

export default function ChartCard({ title, subtitle, children, className, height = "h-64" }) {
  return (
    <div className={cn("bg-slate-800 rounded-xl p-4 border border-slate-700", className)}>
      <h3 className="text-white font-semibold text-sm">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mb-2">{subtitle}</p>}
      <div className={cn("mt-2", height)}>{children}</div>
    </div>
  );
}

export function SectionHeader({ title, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      {Icon && <Icon className="w-4 h-4 text-indigo-400" />}
      <h3 className="text-white font-bold text-base">{title}</h3>
    </div>
  );
}