import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  variant?: "default" | "obsidian";
  badge?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  variant = "default",
  badge,
}: StatCardProps) {
  if (variant === "obsidian") {
    return (
      <div className="bg-slate-950 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col justify-between group hover:border-slate-700 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 ease-out">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/10 rounded-2xl w-fit backdrop-blur-md text-white group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300">
            {icon}
          </div>
          {badge && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {badge}
            </span>
          )}
        </div>
        <div>
          <span className="text-3xl sm:text-4xl font-black text-white tabular-nums">
            {typeof value === "number" ? value.toLocaleString("id-ID") : value}
          </span>
          <p className="text-xs font-bold text-slate-200 mt-1">{label}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:border-slate-400 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-slate-100 text-slate-900 rounded-2xl w-fit group-hover:bg-slate-950 group-hover:text-white group-hover:scale-110 transition-all duration-300">
          {icon}
        </div>
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div>
        <span className="text-3xl sm:text-4xl font-black text-slate-950 tabular-nums">
          {typeof value === "number" ? value.toLocaleString("id-ID") : value}
        </span>
        <p className="text-xs font-bold text-slate-700 mt-1">{label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
