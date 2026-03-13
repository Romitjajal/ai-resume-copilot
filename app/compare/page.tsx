"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Scan = {
  id: string;
  fileName: string;
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  jobDescription: string;
  resumeText: string;
  createdAt: string;
  detectedRole?: string;
  summaryScore?: number | null;
  skillsScore?: number | null;
  experienceScore?: number | null;
  projectsScore?: number | null;
  educationScore?: number | null;
};

type StoredUser = {
  id: string;
  name: string;
  email: string;
};

type ThemeMode = "dark" | "light";

export default function ComparePage() {
  const router = useRouter();

  const [scans, setScans] = useState<Scan[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [compareId, setCompareId] = useState("");
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem("theme") as ThemeMode | null;
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    fetchHistory(token);
  }, [router]);

  const fetchHistory = async (token: string) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/resume/history", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch comparison history");
      }

      const history: Scan[] = Array.isArray(data.scans) ? data.scans : [];
      setScans(history);

      if (history.length > 0) {
        setCurrentId(history[0].id);
      }

      if (history.length > 1) {
        setCompareId(history[1].id);
      } else if (history.length > 0) {
        setCompareId(history[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch comparison history");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  };

  const colors = useMemo(() => {
    if (theme === "light") {
      return {
        pageBg: "#f6f7fb",
        sidebarBg: "#ffffff",
        panelBg: "#ffffff",
        softBg: "#f8fafc",
        softerBg: "#f1f5f9",
        border: "#e5e7eb",
        text: "#0f172a",
        muted: "#64748b",
        selectBg: "#ffffff",
        secondaryButtonBg: "#ffffff",
        secondaryButtonText: "#0f172a",
        secondaryButtonBorder: "#d1d5db",
        dangerBg: "#fef2f2",
        dangerBorder: "#fecaca",
        dangerText: "#b91c1c",
        activeBg: "#f1f5f9",
      };
    }

    return {
      pageBg: "#09090b",
      sidebarBg: "#0f1012",
      panelBg: "#111214",
      softBg: "#17181b",
      softerBg: "#1a1d22",
      border: "#23262d",
      text: "#f8fafc",
      muted: "#94a3b8",
      selectBg: "#0b0c0f",
      secondaryButtonBg: "transparent",
      secondaryButtonText: "#ffffff",
      secondaryButtonBorder: "#31343b",
      dangerBg: "#2a1414",
      dangerBorder: "#7f1d1d",
      dangerText: "#fca5a5",
      activeBg: "#1a1c20",
    };
  }, [theme]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const currentScan = scans.find((scan) => scan.id === currentId) || null;
  const compareOptions = scans.filter((scan) => scan.id !== currentId);

  useEffect(() => {
    if (!currentId) return;

    if (!compareOptions.length) {
      setCompareId(currentId);
      return;
    }

    const exists = compareOptions.some((scan) => scan.id === compareId);
    if (!exists) {
      setCompareId(compareOptions[0].id);
    }
  }, [currentId, compareId, compareOptions]);

  const compareScan =
    scans.find((scan) => scan.id === compareId) || compareOptions[0] || null;

  const scoreDiff =
    currentScan && compareScan ? currentScan.score - compareScan.score : 0;

  const improvementLabel =
    scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff < 0 ? `${scoreDiff}` : "0";

  const improvementText =
    scoreDiff > 0 ? "Improved" : scoreDiff < 0 ? "Dropped" : "No Change";

  const newlyMatched =
    currentScan && compareScan
      ? currentScan.matchedKeywords.filter(
          (item) => !compareScan.matchedKeywords.includes(item)
        )
      : [];

  const stillMissing =
    currentScan && compareScan
      ? currentScan.missingKeywords.filter((item) =>
          compareScan.missingKeywords.includes(item)
        )
      : [];

  const noLongerMissing =
    currentScan && compareScan
      ? compareScan.missingKeywords.filter(
          (item) => !currentScan.missingKeywords.includes(item)
        )
      : [];

  const currentHasSections =
    currentScan &&
    [
      currentScan.summaryScore,
      currentScan.skillsScore,
      currentScan.experienceScore,
      currentScan.projectsScore,
      currentScan.educationScore,
    ].some((value) => typeof value === "number");

  const compareHasSections =
    compareScan &&
    [
      compareScan.summaryScore,
      compareScan.skillsScore,
      compareScan.experienceScore,
      compareScan.projectsScore,
      compareScan.educationScore,
    ].some((value) => typeof value === "number");

  const trendColor =
    scoreDiff > 0 ? "#22c55e" : scoreDiff < 0 ? "#ef4444" : colors.text;

  const trendSymbol = scoreDiff > 0 ? "↑" : scoreDiff < 0 ? "↓" : "•";

  if (!mounted || loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: colors.pageBg,
          color: colors.text,
          display: "grid",
          placeItems: "center",
          fontSize: "14px",
        }}
      >
        Loading comparison...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.pageBg,
        color: colors.text,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "214px 1fr",
          minHeight: "100vh",
        }}
      >
        <aside
          style={{
            background: colors.sidebarBg,
            borderRight: `1px solid ${colors.border}`,
            padding: "16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Image
                src="/microchip.png"
                alt="AI CV Score"
                width={34}
                height={34}
                style={{
                  objectFit: "contain",
                  filter: theme === "dark" ? "invert(1)" : "none",
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Resume Match Analyzer
                </div>
                <div style={{ fontSize: "11px", color: colors.muted }}>
                  Resume Analyzer
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: colors.panelBg,
              border: `1px solid ${colors.border}`,
              borderRadius: "14px",
              padding: "14px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "999px",
                display: "grid",
                placeItems: "center",
                background: colors.softBg,
                fontWeight: 700,
                fontSize: "16px",
                marginBottom: "10px",
              }}
            >
              {initials}
            </div>

            <div
              style={{
                fontSize: "15px",
                fontWeight: 600,
                lineHeight: 1.3,
                marginBottom: "4px",
              }}
            >
              {user?.name || "User"}
            </div>
            <div
              style={{
                color: colors.muted,
                fontSize: "12px",
                lineHeight: 1.45,
                wordBreak: "break-word",
              }}
            >
              {user?.email || "No email"}
            </div>
          </div>

          <nav
            style={{
              background: colors.panelBg,
              border: `1px solid ${colors.border}`,
              borderRadius: "14px",
              padding: "8px",
              display: "grid",
              gap: "4px",
            }}
          >
            <SidebarLink label="Resume Analyzer" active={false} href="/" colors={colors} />
            <SidebarLink label="History" active={false} href="/history" colors={colors} />
            <SidebarLink label="Compare Scores" active href="/compare" colors={colors} />
          </nav>

          <div
            style={{
              background: colors.panelBg,
              border: `1px solid ${colors.border}`,
              borderRadius: "14px",
              padding: "12px",
              display: "grid",
              gap: "8px",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "13px" }}>Appearance</div>

            <button onClick={handleToggleTheme} style={secondaryButton(colors)}>
              Switch to {theme === "dark" ? "Light" : "Dark"} Mode
            </button>

            <button onClick={handleLogout} style={secondaryButton(colors)}>
              Logout
            </button>
          </div>
        </aside>

        <section style={{ padding: "24px 28px" }}>
          <div style={{ maxWidth: "1080px" }}>
            <h1
              style={{
                fontSize: "30px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginBottom: "8px",
                lineHeight: 1.1,
              }}
            >
              Compare Resume Scores
            </h1>

            <p
              style={{
                color: colors.muted,
                marginBottom: "18px",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              Compare two saved resume scans to see score changes, role fit, and section differences.
            </p>

            {error && (
              <div
                style={{
                  background: colors.dangerBg,
                  border: `1px solid ${colors.dangerBorder}`,
                  color: colors.dangerText,
                  padding: "12px 14px",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  fontSize: "13px",
                }}
              >
                {error}
              </div>
            )}

            {scans.length < 2 ? (
              <div
                style={{
                  background: colors.panelBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "16px",
                  padding: "18px",
                  fontSize: "14px",
                  color: colors.muted,
                }}
              >
                You need at least 2 saved scans to compare results.
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "14px",
                    marginBottom: "16px",
                  }}
                >
                  <SelectCard
                    label="Current Scan"
                    value={currentId}
                    onChange={setCurrentId}
                    scans={scans}
                    colors={colors}
                  />

                  <SelectCard
                    label="Compare Against"
                    value={compareId}
                    onChange={setCompareId}
                    scans={compareOptions}
                    colors={colors}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <MetricCard
                    title="Current Score"
                    value={`${currentScan?.score ?? 0}/100`}
                    colors={colors}
                  />
                  <MetricCard
                    title="Previous Score"
                    value={`${compareScan?.score ?? 0}/100`}
                    colors={colors}
                  />
                  <ImprovementCard
                    title="Improvement"
                    label={improvementText}
                    difference={improvementLabel}
                    symbol={trendSymbol}
                    accent={trendColor}
                    colors={colors}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <RoleCard
                    title="Current Role"
                    value={currentScan?.detectedRole || "General Software Developer"}
                    colors={colors}
                  />
                  <RoleCard
                    title="Previous Role"
                    value={compareScan?.detectedRole || "General Software Developer"}
                    colors={colors}
                  />
                </div>

                {currentHasSections && compareHasSections && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "10px",
                      marginBottom: "16px",
                    }}
                  >
                    <DiffStatCard
                      title="Summary"
                      currentValue={currentScan?.summaryScore ?? 0}
                      compareValue={compareScan?.summaryScore ?? 0}
                      colors={colors}
                    />
                    <DiffStatCard
                      title="Skills"
                      currentValue={currentScan?.skillsScore ?? 0}
                      compareValue={compareScan?.skillsScore ?? 0}
                      colors={colors}
                    />
                    <DiffStatCard
                      title="Experience"
                      currentValue={currentScan?.experienceScore ?? 0}
                      compareValue={compareScan?.experienceScore ?? 0}
                      colors={colors}
                    />
                    <DiffStatCard
                      title="Projects"
                      currentValue={currentScan?.projectsScore ?? 0}
                      compareValue={compareScan?.projectsScore ?? 0}
                      colors={colors}
                    />
                    <DiffStatCard
                      title="Education"
                      currentValue={currentScan?.educationScore ?? 0}
                      compareValue={compareScan?.educationScore ?? 0}
                      colors={colors}
                    />
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "10px",
                  }}
                >
                  <InsightCard
                    title="Newly Matched"
                    items={newlyMatched}
                    emptyText="No newly matched skills."
                    itemColor="#22c55e"
                    accentColor="#22c55e"
                    colors={colors}
                  />
                  <InsightCard
                    title="No Longer Missing"
                    items={noLongerMissing}
                    emptyText="No missing skills were fixed."
                    itemColor="#38bdf8"
                    accentColor="#38bdf8"
                    colors={colors}
                  />
                  <InsightCard
                    title="Still Missing"
                    items={stillMissing}
                    emptyText="No repeated missing skills."
                    itemColor="#ef4444"
                    accentColor="#ef4444"
                    colors={colors}
                  />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SidebarLink({
  label,
  active,
  href,
  colors,
}: {
  label: string;
  active: boolean;
  href: string;
  colors: {
    activeBg: string;
    text: string;
    muted: string;
  };
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "10px 12px",
        borderRadius: "10px",
        textDecoration: "none",
        background: active ? colors.activeBg : "transparent",
        fontWeight: active ? 600 : 500,
        color: active ? colors.text : colors.muted,
        display: "block",
        fontSize: "14px",
      }}
    >
      {label}
    </Link>
  );
}

function SelectCard({
  label,
  value,
  onChange,
  scans,
  colors,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  scans: Scan[];
  colors: {
    panelBg: string;
    border: string;
    text: string;
    muted: string;
    selectBg: string;
  };
}) {
  return (
    <div
      style={{
        background: colors.panelBg,
        border: `1px solid ${colors.border}`,
        borderRadius: "16px",
        padding: "16px",
      }}
    >
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "13px",
          fontWeight: 600,
          color: colors.muted,
        }}
      >
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: "42px",
          borderRadius: "12px",
          border: `1px solid ${colors.border}`,
          background: colors.selectBg,
          color: colors.text,
          padding: "0 12px",
          fontSize: "14px",
          outline: "none",
        }}
      >
        {scans.map((scan) => (
          <option key={scan.id} value={scan.id}>
            {scan.fileName} — {new Date(scan.createdAt).toLocaleString()}
          </option>
        ))}
      </select>
    </div>
  );
}

function MetricCard({
  title,
  value,
  colors,
}: {
  title: string;
  value: string;
  colors: {
    panelBg: string;
    border: string;
    muted: string;
    text: string;
  };
}) {
  return (
    <div
      style={{
        background: colors.panelBg,
        border: `1px solid ${colors.border}`,
        borderRadius: "16px",
        padding: "14px",
        minHeight: "100px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          color: colors.muted,
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "22px",
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
          color: colors.text,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ImprovementCard({
  title,
  label,
  difference,
  symbol,
  accent,
  colors,
}: {
  title: string;
  label: string;
  difference: string;
  symbol: string;
  accent: string;
  colors: {
    panelBg: string;
    border: string;
    muted: string;
    text: string;
    softerBg: string;
  };
}) {
  return (
    <div
      style={{
        background: colors.panelBg,
        border: `1px solid ${colors.border}`,
        borderRadius: "16px",
        padding: "14px",
        minHeight: "100px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          color: colors.muted,
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        {title}
      </div>

      <div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 10px",
            borderRadius: "999px",
            background: colors.softerBg,
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              color: accent,
              fontSize: "18px",
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {symbol}
          </span>
          <span
            style={{
              color: accent,
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            {difference}
          </span>
        </div>

        <div
          style={{
            fontSize: "16px",
            fontWeight: 700,
            lineHeight: 1.15,
            color: accent,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  title,
  value,
  colors,
}: {
  title: string;
  value: string;
  colors: {
    panelBg: string;
    border: string;
    muted: string;
    text: string;
  };
}) {
  return (
    <div
      style={{
        background: colors.panelBg,
        border: `1px solid ${colors.border}`,
        borderRadius: "16px",
        padding: "14px",
      }}
    >
      <div
        style={{
          color: colors.muted,
          fontSize: "13px",
          fontWeight: 500,
          marginBottom: "8px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: colors.text,
          lineHeight: 1.25,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DiffStatCard({
  title,
  currentValue,
  compareValue,
  colors,
}: {
  title: string;
  currentValue: number;
  compareValue: number;
  colors: {
    panelBg: string;
    border: string;
    muted: string;
    text: string;
    softerBg: string;
  };
}) {
  const diff = currentValue - compareValue;
  const diffText = diff > 0 ? `+${diff}` : `${diff}`;
  const diffColor = diff > 0 ? "#22c55e" : diff < 0 ? "#ef4444" : colors.muted;

  return (
    <div
      style={{
        background: colors.panelBg,
        border: `1px solid ${colors.border}`,
        borderRadius: "14px",
        padding: "14px",
      }}
    >
      <div
        style={{
          color: colors.muted,
          marginBottom: "10px",
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: colors.text,
          lineHeight: 1.1,
          marginBottom: "8px",
        }}
      >
        {currentValue}
      </div>

      <div
        style={{
          height: "6px",
          borderRadius: "999px",
          background: colors.softerBg,
          overflow: "hidden",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, currentValue))}%`,
            height: "100%",
            borderRadius: "999px",
            background: diff > 0 ? "#22c55e" : diff < 0 ? "#ef4444" : "#64748b",
          }}
        />
      </div>

      <div
        style={{
          fontSize: "12px",
          color: colors.muted,
          lineHeight: 1.4,
        }}
      >
        Previous: {compareValue}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: diffColor,
          marginTop: "4px",
          fontWeight: 600,
        }}
      >
        {diff === 0 ? "No change" : diffText}
      </div>
    </div>
  );
}

function InsightCard({
  title,
  items,
  emptyText,
  itemColor,
  accentColor,
  colors,
}: {
  title: string;
  items: string[];
  emptyText: string;
  itemColor: string;
  accentColor: string;
  colors: {
    panelBg: string;
    border: string;
    muted: string;
    text: string;
  };
}) {
  return (
    <div
      style={{
        background: colors.panelBg,
        border: `1px solid ${colors.border}`,
        borderTop: `3px solid ${accentColor}`,
        borderRadius: "16px",
        padding: "16px",
        minHeight: "170px",
      }}
    >
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 600,
          marginBottom: "12px",
          color: colors.text,
        }}
      >
        {title}
      </h3>

      {items.length === 0 ? (
        <p style={{ color: colors.muted, fontSize: "14px", margin: 0 }}>
          {emptyText}
        </p>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {items.slice(0, 8).map((item, index) => (
            <div
              key={`${item}-${index}`}
              style={{
                fontSize: "14px",
                lineHeight: 1.45,
                color: itemColor,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function secondaryButton(colors: {
  secondaryButtonBg: string;
  secondaryButtonText: string;
  secondaryButtonBorder: string;
}) {
  return {
    padding: "10px 12px",
    borderRadius: "10px",
    border: `1px solid ${colors.secondaryButtonBorder}`,
    background: colors.secondaryButtonBg,
    color: colors.secondaryButtonText,
    cursor: "pointer",
    textAlign: "left" as const,
    fontWeight: 500,
    fontSize: "13px",
  };
}