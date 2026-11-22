import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  compact?: boolean;
  dark?: boolean;
}

export function BrandLogo({
  href = "/admin",
  compact = false,
  dark = false,
}: BrandLogoProps) {
  return (
    <Link href={href} className="flex flex-col group min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`font-extrabold text-base sm:text-lg tracking-tight whitespace-nowrap ${
            dark ? "text-white" : "text-slate-950"
          }`}
        >
          SOLO
          <span className={dark ? "text-slate-200" : "text-slate-900"}>
            TECHNO
          </span>
          <span className="text-amber-500">PARK</span>
        </span>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
            dark
              ? "bg-white/10 text-white border border-white/15"
              : "bg-slate-950 text-white"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          SIDISPO
        </span>
      </div>
      {!compact && (
        <p
          className={`text-[10px] sm:text-[11px] font-medium tracking-wide truncate hidden sm:block mt-0.5 ${
            dark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Sistem Disposisi Surat Internal Sekretariat
        </p>
      )}
    </Link>
  );
}
