import React, { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import ChartCard, { SectionHeader } from "./ChartCard";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK, groupCount, avg, sumBy, formatNumber } from "./analyticsUtils";
import { ShoppingBag } from "lucide-react";

export default function EconomyAnalytics({
  shopItems = [], bundles = [], customPets = [], customThemes = [],
  magicEggs = [], petCosmetics = [], petMojiList = [], boothSkins = [],
}) {
  const itemsByRarity = useMemo(() => groupCount(shopItems, (i) => i.rarity || "common"), [shopItems]);
  const itemsByType = useMemo(() => groupCount(shopItems, (i) => i.itemType || "pet"), [shopItems]);
  const avgPriceByRarity = useMemo(() => {
    const agg = {};
    for (const i of shopItems) {
      const r = i.rarity || "common";
      if (!agg[r]) agg[r] = { sum: 0, count: 0 };
      agg[r].sum += Number(i.price) || 0;
      agg[r].count += 1;
    }
    return Object.entries(agg).map(([rarity, v]) => ({ rarity, avgPrice: v.count ? Math.round(v.sum / v.count) : 0 }));
  }, [shopItems]);

  const limitedVsUnlimited = useMemo(() => [
    { name: "Limited", value: shopItems.filter((i) => i.isLimited).length },
    { name: "Unlimited", value: shopItems.filter((i) => !i.isLimited).length },
  ], [shopItems]);
  const activeVsInactive = useMemo(() => [
    { name: "Active", value: shopItems.filter((i) => i.isActive !== false).length },
    { name: "Inactive", value: shopItems.filter((i) => i.isActive === false).length },
  ], [shopItems]);

  const inventoryValue = useMemo(() => sumBy(shopItems, "price"), [shopItems]);
  const avgBundleDiscount = avg(bundles, "discountPercent");
  const avgBundlePrice = avg(bundles, "bundlePrice");

  const petsByRarity = useMemo(() => groupCount(customPets, (p) => p.rarity || "common"), [customPets]);
  const themesByRarity = useMemo(() => groupCount(customThemes, (t) => t.rarity || "common"), [customThemes]);
  const cosmeticsByRarity = useMemo(() => groupCount(petCosmetics, (c) => c.rarity || "common"), [petCosmetics]);
  const eggsBySource = useMemo(() => groupCount(magicEggs, (e) => e.source || "unknown"), [magicEggs]);
  const cosmeticsByType = useMemo(() => groupCount(petCosmetics, (c) => c.cosmeticType || "other"), [petCosmetics]);

  return (
    <div className="space-y-3">
      <SectionHeader title="Economy & Content" icon={ShoppingBag} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-400">Inventory Value</p>
          <p className="text-xl font-bold text-white">{formatNumber(inventoryValue)} 🪙</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-400">Avg Bundle Discount</p>
          <p className="text-xl font-bold text-white">{Math.round(avgBundleDiscount)}%</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-400">Avg Bundle Price</p>
          <p className="text-xl font-bold text-white">{formatNumber(avgBundlePrice)} 🪙</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-400">Exclusive Petmojis</p>
          <p className="text-xl font-bold text-white">{petMojiList.filter((m) => m.isExclusive).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Shop Items by Rarity">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={itemsByRarity} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {itemsByRarity.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Shop Items by Type">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={itemsByType} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {itemsByType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Avg Item Price by Rarity">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={avgPriceByRarity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="rarity" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="avgPrice" name="Avg Price" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Limited vs Unlimited / Active vs Inactive">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              ...limitedVsUnlimited.map((d) => ({ name: `Lim: ${d.name}`, value: d.value })),
              ...activeVsInactive.map((d) => ({ name: `Act: ${d.name}`, value: d.value })),
            ]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} angle={-15} textAnchor="end" height={55} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Custom Pets by Rarity">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={petsByRarity} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {petsByRarity.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Custom Themes by Rarity">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={themesByRarity} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {themesByRarity.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pet Cosmetics by Rarity">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cosmeticsByRarity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" fill="#EC4899" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cosmetics by Type">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cosmeticsByType} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" fill="#06B6D4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Magic Eggs by Source">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={eggsBySource} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {eggsBySource.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}