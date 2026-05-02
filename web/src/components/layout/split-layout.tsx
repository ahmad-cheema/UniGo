interface SplitLayoutProps {
  children: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function SplitLayout({ children, rightContent }: SplitLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* ── Left panel: form area ─────────────────────── */}
      <div className="flex w-full items-center justify-center bg-bg px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-[440px]">{children}</div>
      </div>

      {/* ── Right panel: branding ─────────────────────── */}
      <div className="hidden w-1/2 items-center justify-center bg-primary lg:flex">
        {rightContent ?? <DefaultBrandPanel />}
      </div>
    </div>
  );
}

/* ── Default right-panel content ────────────────── */

function DefaultBrandPanel() {
  return (
    <div className="flex flex-col items-center gap-8 px-12">
      {/* Decorative university match cards */}
      <div className="flex flex-col gap-3 w-[320px]">
        <UniversityCard
          name="LUMS"
          match={96}
          location="Lahore"
          color="bg-amber-400"
        />
        <UniversityCard
          name="NUST"
          match={89}
          location="Islamabad"
          color="bg-emerald-400"
        />
        <UniversityCard
          name="FAST-NUCES"
          match={84}
          location="Multiple Campuses"
          color="bg-sky-400"
        />
        <UniversityCard
          name="COMSATS"
          match={78}
          location="Islamabad"
          color="bg-violet-400"
        />
      </div>

      {/* Floating detail card */}
      <div className="rounded-xl bg-white/95 p-5 w-[260px] -mt-4 ml-24 border border-white/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-text">LUMS</span>
          <span className="text-xs font-medium text-primary bg-primary-light px-2 py-0.5 rounded-full">
            96% Match
          </span>
        </div>
        <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <span>📍 Lahore, Punjab</span>
          <span>💰 Scholarships Available</span>
          <span>📊 Average GPA: 3.8</span>
          <span>🎓 HEC Recognized</span>
        </div>
      </div>
    </div>
  );
}

function UniversityCard({
  name,
  match,
  location,
  color,
}: {
  name: string;
  match: number;
  location: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
      <div className={`h-8 w-8 rounded-full ${color} flex items-center justify-center text-xs font-bold text-white`}>
        {name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{name}</p>
        <p className="text-xs text-white/60">{location}</p>
      </div>
      <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
        {match}%
      </span>
    </div>
  );
}
