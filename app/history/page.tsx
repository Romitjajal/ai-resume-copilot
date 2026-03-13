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

export default function HistoryPage() {
  const router = useRouter();

  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  const [openSections, setOpenSections] = useState({
    jobDescription: false,
    resumePreview: true,
  });

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
        throw new Error(data.error || "Failed to fetch history");
      }

      const history: Scan[] = Array.isArray(data.scans) ? data.scans : [];
      setScans(history);
      setSelectedScan(history[0] || null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch history");
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

  const toggleSection = (key: "jobDescription" | "resumePreview") => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const colors = useMemo(() => {
    if (theme === "light") {
      return {
        pageBg: "#f6f7fb",
        sidebarBg: "#ffffff",
        panelBg: "#ffffff",
        softBg: "#f8fafc",
        border: "#e5e7eb",
        text: "#0f172a",
        muted: "#64748b",
        previewBg: "#f8fafc",
        previewText: "#0f172a",
        secondaryButtonBg: "#ffffff",
        secondaryButtonText: "#0f172a",
        secondaryButtonBorder: "#d1d5db",
        dangerBg: "#fef2f2",
        dangerBorder: "#fecaca",
        dangerText: "#b91c1c",
        activeBg: "#f1f5f9",
        selectedBorder: "#3b82f6",
      };
    }

    return {
      pageBg: "#09090b",
      sidebarBg: "#0f1012",
      panelBg: "#111214",
      softBg: "#17181b",
      border: "#23262d",
      text: "#f8fafc",
      muted: "#94a3b8",
      previewBg: "#f4f4f5",
      previewText: "#111111",
      secondaryButtonBg: "transparent",
      secondaryButtonText: "#ffffff",
      secondaryButtonBorder: "#31343b",
      dangerBg: "#2a1414",
      dangerBorder: "#7f1d1d",
      dangerText: "#fca5a5",
      activeBg: "#1a1c20",
      selectedBorder: "#2563eb",
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

  const highestScore = scans.length ? Math.max(...scans.map((s) => s.score)) : 0;
  const latestScore = scans.length ? scans[0].score : 0;
  const averageScore = scans.length
    ? Math.round(scans.reduce((sum, scan) => sum + scan.score, 0) / scans.length)
    : 0;

  const hasSectionScores =
    selectedScan &&
    [
      selectedScan.summaryScore,
      selectedScan.skillsScore,
      selectedScan.experienceScore,
      selectedScan.projectsScore,
      selectedScan.educationScore,
    ].some((value) => typeof value === "number");

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
        Loading history...
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
                width={36}
                height={36}
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
            <SidebarLink label="History" active href="/history" colors={colors} />
            <SidebarLink label="Compare Scores" active={false} href="/compare" colors={colors} />
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
          <div style={{ maxWidth: "1120px" }}>
            <h1
              style={{
                fontSize: "30px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginBottom: "8px",
                lineHeight: 1.1,
              }}
            >
              Resume History
            </h1>

            <p
              style={{
                color: colors.muted,
                marginBottom: "18px",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              Review previous resume analyses without opening every detail at once.
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <StatCard title="Total Scans" value={String(scans.length)} colors={colors} />
              <StatCard title="Highest Score" value={`${highestScore}`} colors={colors} />
              <StatCard title="Latest Score" value={`${latestScore}`} colors={colors} />
              <StatCard title="Average Score" value={`${averageScore}`} colors={colors} />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "320px 1fr",
                gap: "16px",
                alignItems: "start",
              }}
            >
              <div
                style={{
                  background: colors.panelBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "16px",
                  padding: "14px",
                  maxHeight: "70vh",
                  overflow: "auto",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    marginBottom: "12px",
                  }}
                >
                  Saved Scans
                </h3>

                {scans.length === 0 ? (
                  <p style={{ color: colors.muted, fontSize: "13px" }}>No scans found yet.</p>
                ) : (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {scans.map((scan) => {
                      const isActive = selectedScan?.id === scan.id;

                      return (
                        <button
                          key={scan.id}
                          onClick={() => setSelectedScan(scan)}
                          style={{
                            textAlign: "left",
                            background: isActive ? colors.activeBg : "transparent",
                            border: `1px solid ${
                              isActive ? colors.selectedBorder : colors.border
                            }`,
                            borderRadius: "12px",
                            padding: "12px",
                            cursor: "pointer",
                            color: colors.text,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "14px",
                              marginBottom: "4px",
                              lineHeight: 1.4,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {scan.fileName}
                          </div>

                          <div
                            style={{
                              color: colors.muted,
                              fontSize: "12px",
                              marginBottom: "8px",
                            }}
                          >
                            {new Date(scan.createdAt).toLocaleString()}
                          </div>

                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: 700,
                              lineHeight: 1.1,
                              marginBottom: scan.detectedRole ? "6px" : 0,
                            }}
                          >
                            {scan.score}
                            <span
                              style={{
                                fontSize: "12px",
                                color: colors.muted,
                                marginLeft: "2px",
                                fontWeight: 500,
                              }}
                            >
                              /100
                            </span>
                          </div>

                          {scan.detectedRole && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: colors.muted,
                                lineHeight: 1.4,
                              }}
                            >
                              {scan.detectedRole}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                style={{
                  background: colors.panelBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "16px",
                  padding: "16px",
                }}
              >
                {!selectedScan ? (
                  <p style={{ color: colors.muted, fontSize: "13px" }}>
                    Select a scan to view details.
                  </p>
                ) : (
                  <>
                    <div style={{ marginBottom: "14px" }}>
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: 600,
                          lineHeight: 1.35,
                          marginBottom: "6px",
                          wordBreak: "break-word",
                        }}
                      >
                        {selectedScan.fileName}
                      </h3>

                      <p
                        style={{
                          color: colors.muted,
                          fontSize: "12px",
                          margin: 0,
                        }}
                      >
                        {new Date(selectedScan.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <StatCard
                        title="Score"
                        value={`${selectedScan.score}/100`}
                        colors={colors}
                      />
                      <StatCard
                        title="Matched"
                        value={String(selectedScan.matchedKeywords.length)}
                        colors={colors}
                      />
                      <StatCard
                        title="Missing"
                        value={String(selectedScan.missingKeywords.length)}
                        colors={colors}
                      />
                    </div>

                    {hasSectionScores && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                          gap: "12px",
                          marginBottom: "12px",
                        }}
                      >
                        <StatCard
                          title="Summary"
                          value={String(selectedScan.summaryScore ?? 0)}
                          colors={colors}
                        />
                        <StatCard
                          title="Skills"
                          value={String(selectedScan.skillsScore ?? 0)}
                          colors={colors}
                        />
                        <StatCard
                          title="Experience"
                          value={String(selectedScan.experienceScore ?? 0)}
                          colors={colors}
                        />
                        <StatCard
                          title="Projects"
                          value={String(selectedScan.projectsScore ?? 0)}
                          colors={colors}
                        />
                        <StatCard
                          title="Education"
                          value={String(selectedScan.educationScore ?? 0)}
                          colors={colors}
                        />
                      </div>
                    )}

                    {selectedScan.detectedRole && (
                      <div
                        style={{
                          background: colors.panelBg,
                          border: `1px solid ${colors.border}`,
                          borderRadius: "14px",
                          padding: "15px",
                          marginBottom: "12px",
                        }}
                      >
                        <div
                          style={{
                            color: colors.muted,
                            marginBottom: "8px",
                            fontSize: "12px",
                            fontWeight: 500,
                          }}
                        >
                          Detected Role
                        </div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: 700,
                            color: colors.text,
                            lineHeight: 1.2,
                          }}
                        >
                          {selectedScan.detectedRole}
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <CompactResultCard
                        title="Matched Keywords"
                        items={selectedScan.matchedKeywords}
                        colors={colors}
                      />
                      <CompactResultCard
                        title="Missing Keywords"
                        items={selectedScan.missingKeywords}
                        colors={colors}
                      />
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                      <CompactResultCard
                        title="Suggestions"
                        items={selectedScan.suggestions}
                        colors={colors}
                        multiline
                      />
                    </div>

                    <AccordionCard
                      title="Job Description"
                      isOpen={openSections.jobDescription}
                      onToggle={() => toggleSection("jobDescription")}
                      colors={colors}
                    >
                      <pre style={contentPre(colors.text, false)}>
                        {selectedScan.jobDescription}
                      </pre>
                    </AccordionCard>

                    <div style={{ height: "12px" }} />

                    <AccordionCard
                      title="Resume Preview"
                      isOpen={openSections.resumePreview}
                      onToggle={() => toggleSection("resumePreview")}
                      colors={colors}
                    >
                      <pre style={contentPre(colors.previewText, true, colors.previewBg)}>
                        {selectedScan.resumeText}
                      </pre>
                    </AccordionCard>
                  </>
                )}
              </div>
            </div>
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

function StatCard({
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
        borderRadius: "14px",
        padding: "14px",
        minHeight: "86px",
      }}
    >
      <div
        style={{
          color: colors.muted,
          marginBottom: "8px",
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: colors.text,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CompactResultCard({
  title,
  items,
  colors,
  multiline = false,
}: {
  title: string;
  items: string[];
  multiline?: boolean;
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
        borderRadius: "14px",
        padding: "14px",
        minHeight: multiline ? "unset" : "150px",
      }}
    >
      <h3
        style={{
          fontSize: "14px",
          fontWeight: 600,
          marginBottom: "10px",
          color: colors.text,
        }}
      >
        {title}
      </h3>

      {items.length === 0 ? (
        <p style={{ color: colors.muted, fontSize: "13px", margin: 0 }}>
          No items found.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {items.slice(0, multiline ? 6 : 5).map((item, index) => (
            <div
              key={`${item}-${index}`}
              style={{
                fontSize: "13px",
                color: colors.text,
                lineHeight: 1.5,
                ...(multiline
                  ? {
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }
                  : {
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }),
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

function AccordionCard({
  title,
  isOpen,
  onToggle,
  children,
  colors,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  colors: {
    panelBg: string;
    border: string;
    text: string;
    muted: string;
  };
}) {
  return (
    <div
      style={{
        background: colors.panelBg,
        border: `1px solid ${colors.border}`,
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={onToggle}
        type="button"
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          color: colors.text,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: 600,
          textAlign: "left",
        }}
      >
        <span>{title}</span>
        <span style={{ color: colors.muted, fontSize: "12px" }}>
          {isOpen ? "Hide" : "Show"}
        </span>
      </button>

      {isOpen && <div style={{ padding: "0 16px 16px 16px" }}>{children}</div>}
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

function contentPre(textColor: string, boxed: boolean, bg?: string) {
  return {
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
    fontFamily: "inherit",
    fontSize: "13px",
    lineHeight: 1.65,
    margin: 0,
    color: textColor,
    background: boxed ? bg : "transparent",
    padding: boxed ? "14px" : "0",
    borderRadius: boxed ? "12px" : "0",
    maxHeight: "320px",
    overflow: "auto" as const,
  };
}