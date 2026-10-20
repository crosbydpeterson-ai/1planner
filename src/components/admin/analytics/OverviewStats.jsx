import React from "react";
import {
  Users, Zap, Coins, Gem, Sparkles, Ban, Flag, Lock, Crown,
  ClipboardList, AlertTriangle, ShoppingBag, CalendarHeart, PartyPopper, Egg, Palette, Package,
} from "lucide-react";
import StatCard from "./StatCard";
import { formatNumber, sumBy } from "./analyticsUtils";

export default function OverviewStats({
  users = [], assignments = [], shopItems = [], bundles = [],
  customPets = [], customThemes = [], magicEggs = [], seasons = [],
  events = [], petCosmetics = [], petMojiList = [], boothSkins = [],
}) {
  const totalUsers = users.length;
  const totalXP = sumBy(users, "xp");
  const totalCoins = sumBy(users, "questCoins");
  const totalGems = sumBy(users, "gems");
  const totalSeasonXp = sumBy(users, "seasonXp");
  const avgXP = totalUsers ? Math.round(totalXP / totalUsers) : 0;
  const banned = users.filter((u) => u.isBanned).length;
  const flagged = users.filter((u) => u.flagged).length;
  const locked = users.filter((u) => u.isLocked).length;
  const plus = users.filter((u) => u.has1PassPlus).length;
  const approvedAssignments = assignments.filter((a) => a.isApproved).length;
  const flaggedAssignments = assignments.filter((a) => a.isFlagged).length;
  const activeShop = shopItems.filter((s) => s.isActive !== false).length;
  const activeSeasons = seasons.filter((s) => s.isActive).length;
  const activeEvents = events.filter((e) => e.isActive).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <StatCard icon={Users} label="Total Users" value={formatNumber(totalUsers)} color="text-blue-400" />
      <StatCard icon={Zap} label="Total XP" value={formatNumber(totalXP)} sub={`avg ${formatNumber(avgXP)}/user`} color="text-indigo-400" />
      <StatCard icon={Coins} label="Quest Coins" value={formatNumber(totalCoins)} color="text-amber-400" />
      <StatCard icon={Gem} label="Gems" value={formatNumber(totalGems)} color="text-cyan-400" />
      <StatCard icon={Sparkles} label="1Pass XP" value={formatNumber(totalSeasonXp)} color="text-fuchsia-400" />
      <StatCard icon={Crown} label="1Pass Plus" value={formatNumber(plus)} sub={`${totalUsers ? Math.round((plus / totalUsers) * 100) : 0}% of users`} color="text-yellow-400" />
      <StatCard icon={Ban} label="Banned" value={formatNumber(banned)} color="text-red-400" />
      <StatCard icon={Flag} label="Flagged" value={formatNumber(flagged)} color="text-orange-400" />
      <StatCard icon={Lock} label="Locked" value={formatNumber(locked)} color="text-slate-400" />
      <StatCard icon={ClipboardList} label="Assignments" value={formatNumber(assignments.length)} sub={`${approvedAssignments} approved`} color="text-emerald-400" />
      <StatCard icon={AlertTriangle} label="Flagged Assignments" value={formatNumber(flaggedAssignments)} color="text-rose-400" />
      <StatCard icon={ShoppingBag} label="Shop Items" value={formatNumber(shopItems.length)} sub={`${activeShop} active`} color="text-purple-400" />
      <StatCard icon={Package} label="Bundles" value={formatNumber(bundles.length)} color="text-violet-400" />
      <StatCard icon={Egg} label="Magic Eggs" value={formatNumber(magicEggs.length)} color="text-lime-400" />
      <StatCard icon={Palette} label="Custom Themes" value={formatNumber(customThemes.length)} color="text-pink-400" />
      <StatCard icon={CalendarHeart} label="Active Seasons" value={formatNumber(activeSeasons)} sub={`${seasons.length} total`} color="text-teal-400" />
      <StatCard icon={PartyPopper} label="Active Events" value={formatNumber(activeEvents)} sub={`${events.length} total`} color="text-green-400" />
      <StatCard icon={Package} label="Cosmetics / Booths" value={`${petCosmetics.length} / ${boothSkins.length}`} color="text-indigo-400" />
    </div>
  );
}