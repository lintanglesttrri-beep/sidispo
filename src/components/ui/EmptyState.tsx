import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border-2 border-dashed border-slate-200">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto mb-3 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
