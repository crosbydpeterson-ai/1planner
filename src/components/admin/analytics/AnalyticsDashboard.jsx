import React, { useMemo, useRef, useState } from "react";
import { Download, Loader2, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportElementToPdf } from "@/lib/exportAnalyticsPdf";
import OverviewStats from "./OverviewStats";
import UserAnalytics from "./UserAnalytics";
import AssignmentAnalytics from "./AssignmentAnalytics";
import EconomyAnalytics from "./EconomyAnalytics";
import WheelSeasonAnalytics from "./WheelSeasonAnalytics";
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
  const [excludeAdmins, setExcludeAdmins] = useState(false);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);

  // Explicit designation only — admins are excluded by rank, never guessed.
  const studentUsers = useMemo(
    () => (excludeAdmins ? users.filter((u) => u.rank !== "admin" && u.rank !== "super_admin") : users),
    [users, excludeAdmins]
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportElementToPdf(reportRef.current, "analytics-report.pdf");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-white font-bold text-lg">📊 Analytics Dashboard</h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 cursor-pointer">
            <input type="checkbox" checked={excludeAdmins} onChange={(e) => setExcludeAdmins(e.target.checked)} />
            <UserCheck className="w-3.5 h-3.5" /> Exclude admin accounts
          </label>
          <Button size="sm" onClick={handleExport} disabled={exporting} className="bg-indigo-600 hover:bg-indigo-700">
            {exporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}Export PDF
          </Button>
        </div>
      </div>

      <div ref={reportRef} className={cn("space-y-6 bg-slate-900 rounded-2xl p-1")}>
        <p className="text-[11px] text-slate-500 -mb-3">
          Cards below the line marked “snapshot / lifetime” show current or all-time values and are not affected by the period selector.
          The period selector applies only to sections labelled “selected period”.
        </p>

        <OverviewStats
          users={studentUsers} assignments={assignments} shopItems={shopItems} bundles={bundles}
          customPets={customPets} customThemes={customThemes} magicEggs={magicEggs} seasons={seasons}
          events={events} petCosmetics={petCosmetics} petMojiList={petMojiList} boothSkins={boothSkins}
        />

        <UserAnalytics users={studentUsers} teacherName={teacherName} />
        <AssignmentAnalytics assignments={assignments} teacherName={teacherName} />
        <EconomyAnalytics
          shopItems={shopItems} bundles={bundles} customPets={customPets} customThemes={customThemes}
          magicEggs={magicEggs} petCosmetics={petCosmetics} petMojiList={petMojiList} boothSkins={boothSkins}
        />
        <WheelSeasonAnalytics seasons={seasons} users={studentUsers} range={range} />
        <EngagementAnalytics
          users={studentUsers} assignments={assignments} shopItems={shopItems} customPets={customPets}
          magicEggs={magicEggs} range={range} onRangeChange={setRange}
        />
      </div>
    </div>
  );
}