import React from 'react';
import { cn } from '@/lib/utils';

export default function GlassIcon({ 
  icon: Icon, 
  size = 'md', 
  color = 'primary',
  className 
}) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  const colorStyles = {
    primary: {
      bg: 'from-indigo-500/30 to-purple-500/20',
      border: 'border-indigo-400/30',
      glow: 'shadow-indigo-500/20',
      icon: 'text-indigo-100'
    },
    amber: {
      bg: 'from-amber-500/30 to-orange-500/20',
      border: 'border-amber-400/30',
      glow: 'shadow-amber-500/20',
      icon: 'text-amber-100'
    },
    emerald: {
      bg: 'from-emerald-500/30 to-teal-500/20',
      border: 'border-emerald-400/30',
      glow: 'shadow-emerald-500/20',
      icon: 'text-emerald-100'
    },
    purple: {
      bg: 'from-purple-500/30 to-pink-500/20',
      border: 'border-purple-400/30',
      glow: 'shadow-purple-500/20',
      icon: 'text-purple-100'
    },
    red: {
      bg: 'from-red-500/30 to-orange-500/20',
      border: 'border-red-400/30',
      glow: 'shadow-red-500/20',
      icon: 'text-red-100'
    },
    cyan: {
      bg: 'from-cyan-500/30 to-blue-500/20',
      border: 'border-cyan-400/30',
      glow: 'shadow-cyan-500/20',
      icon: 'text-cyan-100'
    },
    white: {
      bg: 'from-white/20 to-white/10',
      border: 'border-white/30',
      glow: 'shadow-white/10',
      icon: 'text-white'
    }
  };

  const style = colorStyles[color] || colorStyles.primary;

  return (
    <div
      className={cn(
        sizes[size],
        'relative rounded-2xl flex items-center justify-center',
        'bg-gradient-to-br backdrop-blur-xl',
        'border shadow-lg',
        'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none',
        'after:absolute after:inset-[1px] after:rounded-2xl after:bg-gradient-to-t after:from-black/10 after:to-transparent after:pointer-events-none',
        style.bg,
        style.border,
        style.glow,
        className
      )}
    >
      <Icon className={cn(iconSizes[size], style.icon, 'relative z-10 drop-shadow-lg')} />
    </div>
  );
}