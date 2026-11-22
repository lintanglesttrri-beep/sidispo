import React from "react";

interface SectionHeaderProps {
  badge: string;
  badgeIcon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function SectionHeader({
  badge,
  badgeIcon,
  title,
  description,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full mb-2.5 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {badgeIcon}
          <span>{badge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
          {title}
          <span className="text-amber-500">.</span>
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 font-medium">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}
