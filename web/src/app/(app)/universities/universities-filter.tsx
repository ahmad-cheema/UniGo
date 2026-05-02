"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface Props {
  provinces: string[];
  currentProvince: string;
  currentSearch: string;
  currentHec: boolean;
}

export function UniversitiesFilter({
  provinces,
  currentProvince,
  currentSearch,
  currentHec,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      startTransition(() => {
        router.push(`/universities?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search universities..."
          defaultValue={currentSearch}
          onChange={(e) => {
            const val = e.target.value;
            // Debounce by using a short timeout
            clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>).__uniSearch);
            (window as unknown as Record<string, ReturnType<typeof setTimeout>>).__uniSearch = setTimeout(() => {
              updateParams("search", val);
            }, 400);
          }}
          className="w-full rounded-lg border border-border bg-white py-2.5 pl-9 pr-4 text-sm text-text placeholder:text-text-secondary transition-colors duration-150 focus:border-primary focus:outline-none"
        />
      </div>

      {/* Province filter */}
      <select
        value={currentProvince}
        onChange={(e) => updateParams("province", e.target.value)}
        className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text transition-colors duration-150 focus:border-primary focus:outline-none cursor-pointer"
      >
        <option value="all">All Provinces</option>
        {provinces.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* HEC toggle */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={currentHec}
          onChange={(e) =>
            updateParams("hec", e.target.checked ? "true" : "")
          }
          className="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer"
        />
        <span className="text-sm text-text-secondary whitespace-nowrap">
          HEC Only
        </span>
      </label>

      {/* Loading indicator */}
      {isPending && (
        <span className="text-xs text-text-secondary animate-pulse">
          Loading...
        </span>
      )}
    </div>
  );
}
