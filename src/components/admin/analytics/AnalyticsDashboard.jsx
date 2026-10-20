import React, { useState } from "react";
import { cn } from "@/lib/utils";
import OverviewStats from "./OverviewStats";
import UserAnalytics from "./UserAnalytics";
import AssignmentAnalytics from "./AssignmentAnalytics";
import EconomyAnalytics from "./EconomyAnalytics";
import EngagementAnalytics from "./EngagementAnalytics";

export default function AnalyticsDashboard({
  users = [],
  assignments = [],
  shopItems = [],
  bundles = [],
  events = [],
  customPets = [],
  customThemes = [],
  magicEggs = [],
  seasons = [],
  petCosmetics = [],
  petMojiList = [],
  boothSkins = [],
  teacherName,
}) {
  const [range, setRange] = useState(14);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-white font-bold text-lg">📊 Analytics Dashboard</h2>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400 mr-1">Range:</span>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={cn(
                "text-xs px-3 py-1 rounded-lg transition-colors",
                range === d ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <OverviewStats
        users={users} assignments={assignments} shopItems={shopItems} bundles={bundles}
        customPets={customPets} customThemes={customThemes} magicEggs={magicEggs} seasons={seasons}
        events={events} petCosmetics={petCosmetics} petMojiList={petMojiList} boothSkins={boothSkins}
      />

      <UserAnalytics users={users} teacherName={teacherName} />
      <AssignmentAnalytics assignments={assignments} teacherName={teacherName} />
      <EconomyAnalytics
        shopItems={shopItems} bundles={bundles} customPets={customPets} customThemes={customThemes}
        magicEggs={magicEggs} petCosmetics={petCosmetics} petMojiList={petMojiList} boothSkins={boothSkins}
      />
      <EngagementAnalytics
        users={users} assignments={assignments} shopItems={shopItems} customPets={customPets}
        magicEggs={magicEggs} range={range}
      />
    </div>
  );
}