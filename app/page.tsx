"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type AnalyzeResult = {
  id?: string;
  score: number;
  resumeText: string;
  message: string;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  suggestions?: string[];
  detectedRole?: string;
  sectionScores?: {
    summary: number;
    skills: number;
    experience: number;
    projects: number;
    education: number;
  };
};

type StoredUser = {
  id: string;
  name: string;
  email: string;
};

type ThemeMode = "dark" | "light";

export default function Home() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState<StoredUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
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

    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

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
        inputBg: "#ffffff",
        previewBg: "#f8fafc",
        previewText: "#0f172a",
        buttonBg: "#111827",
        buttonText: "#ffffff",
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
      border: "#23262d",
      text: "#f8fafc",
      muted: "#94a3b8",
      inputBg: "#0b0c0f",
      previewBg: "#f4f4f5",
      previewText: "#111111",
      buttonBg: "#ffffff",
      buttonText: "#111111",
      secondaryButtonBg: "transparent",
      secondaryButtonText: "#ffffff",
      secondaryButtonBorder: "#31343b",
      dangerBg: "#2a1414",
      dangerBorder: "#7f1d1d",
      dangerText: "#fca5a5",
      activeBg: "#1a1c20",
    };
  }, [theme]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Please upload a DOCX resume.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);

    try {
      setLoading(true);

      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze resume");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor =
    result && result.score >= 80
      ? "#22c55e"
      : result && result.score >= 60
      ? "#f59e0b"
      : "#ef4444";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  if (checkingAuth) {
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
        Checking login...
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
            <SidebarLink label="Resume Analyzer" active href="/" colors={colors} />
            <SidebarLink label="History" active={false} href="/history" colors={colors} />
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
          <div style={{ maxWidth: "980px" }}>
            <h1
              style={{
                fontSize: "30px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginBottom: "8px",
                lineHeight: 1.1,
              }}
            >
              Resume Analyzer
            </h1>

            <p
              style={{
                color: colors.muted,
                marginBottom: "18px",
                fontSize: "14px",
                lineHeight: 1.6,
                maxWidth: "720px",
              }}
            >
              Upload your resume, paste a job description, and check how well your CV matches the role.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gap: "16px",
                background: colors.panelBg,
                border: `1px solid ${colors.border}`,
                borderRadius: "16px",
                padding: "18px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Resume
                </label>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    id="resumeUpload"
                    type="file"
                    accept=".docx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    style={{ display: "none" }}
                  />

                  <label
                    htmlFor="resumeUpload"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "38px",
                      padding: "0 14px",
                      background: theme === "dark" ? "#191b1f" : "#f8fafc",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    Upload DOCX
                  </label>

                  <span
                    style={{
                      color: file ? colors.text : colors.muted,
                      fontSize: "13px",
                      lineHeight: 1.4,
                    }}
                  >
                    {file ? file.name : "No file selected"}
                  </span>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Job Description
                </label>

                <textarea
                  rows={7}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: `1px solid ${colors.border}`,
                    background: colors.inputBg,
                    color: colors.text,
                    fontSize: "14px",
                    lineHeight: 1.6,
                    resize: "vertical",
                    minHeight: "180px",
                    outline: "none",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "170px",
                  height: "42px",
                  borderRadius: "12px",
                  border: "none",
                  background: colors.buttonBg,
                  color: colors.buttonText,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {loading ? "Analyzing..." : "Analyze Resume"}
              </button>
            </form>

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

            {result && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  <StatCard
                    title="Overall Score"
                    value={`${result.score}/100`}
                    valueColor={scoreColor}
                    colors={colors}
                  />
                  <StatCard
                    title="Matched Skills"
                    value={`${result.matchedKeywords?.length || 0}`}
                    colors={colors}
                  />
                  <StatCard
                    title="Missing Skills"
                    value={`${result.missingKeywords?.length || 0}`}
                    colors={colors}
                  />
                </div>

                {result.sectionScores && (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                        gap: "12px",
                        marginBottom: "14px",
                      }}
                    >
                      <StatCard
                        title="Summary"
                        value={`${result.sectionScores.summary}`}
                        colors={colors}
                      />
                      <StatCard
                        title="Skills"
                        value={`${result.sectionScores.skills}`}
                        colors={colors}
                      />
                      <StatCard
                        title="Experience"
                        value={`${result.sectionScores.experience}`}
                        colors={colors}
                      />
                      <StatCard
                        title="Projects"
                        value={`${result.sectionScores.projects}`}
                        colors={colors}
                      />
                      <StatCard
                        title="Education"
                        value={`${result.sectionScores.education}`}
                        colors={colors}
                      />
                    </div>

                    <div
                      style={{
                        background: colors.panelBg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: "14px",
                        padding: "15px",
                        marginBottom: "14px",
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
                        {result.detectedRole || "General Software Developer"}
                      </div>
                    </div>
                  </>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  <ResultCard
                    title="Matched Keywords"
                    items={result.matchedKeywords || []}
                    color="#22c55e"
                    colors={colors}
                  />
                  <ResultCard
                    title="Missing Keywords"
                    items={result.missingKeywords || []}
                    color="#ef4444"
                    colors={colors}
                  />
                  <ResultCard
                    title="Suggestions"
                    items={result.suggestions || []}
                    color="#f59e0b"
                    colors={colors}
                  />
                </div>

                <div
                  style={{
                    background: colors.panelBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "16px",
                    padding: "16px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      marginBottom: "10px",
                    }}
                  >
                    Resume Preview
                  </h3>

                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      background: colors.previewBg,
                      color: colors.previewText,
                      padding: "14px",
                      borderRadius: "12px",
                      maxHeight: "340px",
                      overflow: "auto",
                      fontSize: "13px",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {result.resumeText.slice(0, 2500)}
                  </pre>
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

function StatCard({
  title,
  value,
  valueColor,
  colors,
}: {
  title: string;
  value: string;
  valueColor?: string;
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
        padding: "15px",
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
          fontSize: "26px",
          fontWeight: 700,
          color: valueColor || colors.text,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ResultCard({
  title,
  items,
  color,
  colors,
}: {
  title: string;
  items: string[];
  color: string;
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
        padding: "15px",
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
        <ul style={{ paddingLeft: "18px", margin: 0 }}>
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              style={{
                marginBottom: "7px",
                color,
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: colors.text }}>{item}</span>
            </li>
          ))}
        </ul>
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