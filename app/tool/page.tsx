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

type AiTailorResult = {
  tailoredSummary: string;
  improvedBullets: string[];
  skillsToAdd: string[];
  atsSuggestions?: string[];
  finalResumeText?: string;
};

export default function Home() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [aiData, setAiData] = useState<AiTailorResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<StoredUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeMode | null;
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

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
    router.replace("/");
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleAnalyzeAndImprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setAiData(null);
    setShowPreview(false);

    if (!file) {
      setError("Please upload a DOCX resume.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
  setError("Please upload a DOCX file under 5MB.");
  return;
}
    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);

    try {
      setLoading(true);

      const analyzeRes = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const analyzeData = await analyzeRes.json();

      if (!analyzeRes.ok) {
        throw new Error(analyzeData.error || "Failed to analyze resume");
      }

      setResult(analyzeData);
      setLoading(false);
      setAiLoading(true);

      const tailorRes = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          resumeText: analyzeData.resumeText,
          jobDescription,
        }),
      });
      const tailorText = await tailorRes.text();

      let tailorData: AiTailorResult;
      try {
        tailorData = JSON.parse(tailorText);
      } catch {
        throw new Error("AI response could not be parsed.");
      }

      if (!tailorRes.ok) {
        throw new Error((tailorData as any).error || "Failed to improve resume with AI");
      }

      setAiData(tailorData);
      setShowPreview(true);
    } catch (err: any) {
      console.error("Resume processing error:", err);
     setError(
  err.message === "Failed to fetch"
    ? "Something went wrong. Please try again. If the issue continues, check your internet connection or try a smaller DOCX file."
    : err.message || "Something went wrong"
);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!aiData) return;

    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      AlignmentType,
      BorderStyle,
    } = await import("docx");
    const { saveAs } = await import("file-saver");

    const lines =
      aiData.finalResumeText
        ?.split("\n")
        .map((line: string) => line.trim())
        .filter(Boolean) || [];

    const children = lines.map((line: string, index: number) => {
      const isFirstLine = index === 0;
      const isContactLine = index === 1 && (line.includes("@") || line.includes("|"));

      const isHeading =
        line === line.toUpperCase() &&
        line.length < 45 &&
        !line.includes("@") &&
        !line.includes("|") &&
        !isFirstLine;

      const isBullet =
        line.startsWith("•") ||
        line.startsWith("-") ||
        line.startsWith("*") ||
        /^\d+\./.test(line);

      if (isFirstLine) {
        return new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({ text: line.toUpperCase(), bold: true, size: 34 }),
          ],
        });
      }

      if (isContactLine) {
        return new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 220 },
          children: [new TextRun({ text: line, size: 20 })],
        });
      }

      if (isHeading) {
        return new Paragraph({
          spacing: { before: 180, after: 80 },
          border: {
            bottom: { color: "999999", space: 1, style: BorderStyle.SINGLE, size: 4 },
          },
          children: [new TextRun({ text: line, bold: true, size: 24 })],
        });
      }

      if (isBullet) {
        return new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 70 },
          indent: { left: 360 },
          children: [
            new TextRun({
              text: line.replace(/^(\d+\.|[-•*])\s*/, ""),
              size: 21,
            }),
          ],
        });
      }

      return new Paragraph({
        spacing: { after: 90 },
        children: [new TextRun({ text: line, size: 21 })],
      });
    });
const handleDownloadPDF = async () => {
  const html2pdf = (await import("html2pdf.js")).default;
  const element = document.getElementById("resume-pdf-template");

  if (!element) return;

  html2pdf()
    .set({
      margin: 0.4,
      filename: "AI_Tailored_Resume.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    })
    .from(element)
    .save();
};
    const doc = new Document({
      sections: [
        {
          properties: {
            page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
          },
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "ATS_Tailored_Resume.docx");
  };

  const scoreColor =
    result && result.score >= 80
      ? "#22c55e"
      : result && result.score >= 60
      ? "#f59e0b"
      : "#ef4444";

  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
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
    <main style={{ minHeight: "100vh", background: colors.pageBg, color: colors.text }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "214px 1fr",
          minHeight: "100vh",
        }}
      >
        {/* ── SIDEBAR / TOP NAV ── */}
        <aside
          style={{
            background: colors.sidebarBg,
            borderRight: isMobile ? "none" : `1px solid ${colors.border}`,
            borderBottom: isMobile ? `1px solid ${colors.border}` : "none",
            padding: isMobile ? "12px 16px" : "16px 14px",
            display: "flex",
            flexDirection: isMobile ? "row" : "column",
            alignItems: isMobile ? "center" : "stretch",
            justifyContent: isMobile ? "space-between" : "flex-start",
            gap: isMobile ? "0" : "16px",
            position: isMobile ? "sticky" : "relative",
            top: 0,
            zIndex: 50,
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Image
              src="/rj.png"
              alt="AI Resume Copilot"
              width={isMobile ? 30 : 36}
              height={isMobile ? 30 : 36}
              style={{ borderRadius: "8px", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}
            />
            <div>
              <div
                style={{
                  fontSize: isMobile ? "14px" : "16px",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              >
                AI Resume Copilot
              </div>
              {!isMobile && (
                <div style={{ fontSize: "11px", color: colors.muted }}>
                  ATS Resume Builder
                </div>
              )}
            </div>
          </div>

          {/* Mobile right-side actions */}
          {isMobile ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={handleToggleTheme}
                style={{
                  width: "34px", height: "34px", borderRadius: "8px",
                  border: `1px solid ${colors.border}`, background: colors.softBg,
                  color: colors.text, cursor: "pointer", fontSize: "15px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button
                onClick={() => setShowMobileMenu((v) => !v)}
                style={{
                  width: "34px", height: "34px", borderRadius: "8px",
                  border: `1px solid ${colors.border}`, background: colors.softBg,
                  color: colors.text, cursor: "pointer", fontSize: "18px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {showMobileMenu ? "✕" : "☰"}
              </button>
            </div>
          ) : (
            <>
              {/* Desktop user card */}
              <div
                style={{
                  background: colors.panelBg, border: `1px solid ${colors.border}`,
                  borderRadius: "14px", padding: "14px",
                }}
              >
                <div
                  style={{
                    width: "46px", height: "46px", borderRadius: "999px",
                    display: "grid", placeItems: "center", background: colors.softBg,
                    fontWeight: 700, fontSize: "16px", marginBottom: "10px",
                  }}
                >
                  {initials}
                </div>
                <div style={{ fontSize: "15px", fontWeight: 600, lineHeight: 1.3, marginBottom: "4px" }}>
                  {user?.name || "Guest"}
                </div>
                <div style={{ color: colors.muted, fontSize: "12px", lineHeight: 1.45, wordBreak: "break-word" }}>
                  {user?.email || "Not Signed In"}
                </div>
              </div>

              {/* Desktop nav */}
              <nav
                style={{
                  background: colors.panelBg, border: `1px solid ${colors.border}`,
                  borderRadius: "14px", padding: "8px", display: "grid", gap: "4px",
                }}
              >
                <SidebarLink label="Resume Optimizer" active href="/" colors={colors} />
                <SidebarLink label="History" active={false} href="/history" colors={colors} />
              </nav>

              {/* Desktop appearance */}
              <div
                style={{
                  background: colors.panelBg, border: `1px solid ${colors.border}`,
                  borderRadius: "14px", padding: "12px", display: "grid", gap: "8px",
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
            </>
          )}
        </aside>

        {/* Mobile dropdown menu */}
        {isMobile && showMobileMenu && (
          <div
            style={{
              background: colors.sidebarBg, borderBottom: `1px solid ${colors.border}`,
              padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px",
            }}
          >
            {/* User info */}
            <div
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", background: colors.panelBg,
                border: `1px solid ${colors.border}`, borderRadius: "12px",
              }}
            >
              <div
                style={{
                  width: "36px", height: "36px", borderRadius: "999px",
                  display: "grid", placeItems: "center", background: colors.softBg,
                  fontWeight: 700, fontSize: "13px", flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{user?.name || "Guest"}</div>
                <div style={{ fontSize: "12px", color: colors.muted }}>{user?.email || "Not Signed In"}</div>
              </div>
            </div>

            <Link
              href="/"
              onClick={() => setShowMobileMenu(false)}
              style={{
                padding: "10px 12px", borderRadius: "10px", textDecoration: "none",
                background: colors.activeBg, fontWeight: 600, color: colors.text, fontSize: "14px",
              }}
            >
              Resume Optimizer
            </Link>
            <Link
              href="/history"
              onClick={() => setShowMobileMenu(false)}
              style={{
                padding: "10px 12px", borderRadius: "10px", textDecoration: "none",
                background: "transparent", fontWeight: 500, color: colors.muted, fontSize: "14px",
              }}
            >
              History
            </Link>
            <button onClick={handleLogout} style={{ ...secondaryButton(colors), width: "100%" }}>
              Logout
            </button>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <section style={{ padding: isMobile ? "16px" : "24px 28px" }}>
          <div style={{ maxWidth: "980px" }}>
            <h1
              style={{
                fontSize: isMobile ? "24px" : "32px",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                marginBottom: "8px",
                lineHeight: 1.1,
              }}
            >
              AI Resume Copilot
            </h1>

            {/* Step indicator — hidden on mobile */}
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
                {["Upload Resume", "Paste Job Description", "Generate ATS Resume"].map((step, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "28px", height: "28px", borderRadius: "50%",
                        background: "#6366f1", color: "#fff", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: "13px", fontWeight: 700,
                        boxShadow: "0 6px 18px rgba(99,102,241,0.4)",
                      }}
                    >
                      {index + 1}
                    </div>
                    <span style={{ fontSize: "14px", color: "#cbd5f5", fontWeight: 500 }}>{step}</span>
                    {index !== 2 && (
                      <div style={{ width: "40px", height: "2px", background: "#374151", marginLeft: "10px" }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleAnalyzeAndImprove}
              style={{
                display: "grid", gap: "16px", background: colors.panelBg,
                border: `1px solid ${colors.border}`, borderRadius: "16px",
                padding: isMobile ? "14px" : "18px", marginBottom: "16px",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600 }}>
                  Resume
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
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
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      height: "38px", padding: "0 14px",
                      background: theme === "dark" ? "#191b1f" : "#f8fafc",
                      border: `1px solid ${colors.border}`, borderRadius: "10px",
                      cursor: "pointer", fontWeight: 600, fontSize: "13px",
                    }}
                  >
                    Upload DOCX
                  </label>
                  <span style={{ color: file ? colors.text : colors.muted, fontSize: "13px", lineHeight: 1.4 }}>
                    {file ? file.name : "Upload your resume to get started"}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600 }}>
                  Job Description
                </label>
                <textarea
                  rows={7}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: "12px",
                    border: `1px solid ${colors.border}`, background: colors.inputBg,
                    color: colors.text, fontSize: "14px", lineHeight: 1.6,
                    resize: "vertical", minHeight: "180px", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || aiLoading}
                style={{
                  width: isMobile ? "100%" : "260px",
                  minHeight: "46px", borderRadius: "12px",
                  transition: "all 0.2s ease", border: "none",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 10px 30px rgba(99,102,241,0.35)",
                  color: "#ffffff", fontWeight: 700,
                  cursor: loading || aiLoading ? "not-allowed" : "pointer",
                  fontSize: "14px", lineHeight: 1.3,
                }}
                onMouseEnter={(e) => {
                  if (!loading && !aiLoading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 14px 40px rgba(99,102,241,0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(99,102,241,0.35)";
                }}
              >
                {loading ? "Analyzing Resume..." : aiLoading ? "Improving with AI..." : "Analyze & Generate ATS Resume"}
              </button>
            </form>

            {error && (
              <div
                style={{
                  background: colors.dangerBg, border: `1px solid ${colors.dangerBorder}`,
                  color: colors.dangerText, padding: "12px 14px", borderRadius: "12px",
                  marginBottom: "16px", fontSize: "13px",
                }}
              >
                {error}
              </div>
            )}

            {result && (
              <>
                {/* Top 3 stat cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(2, minmax(0,1fr))" : "repeat(3, minmax(0,1fr))",
                    gap: "12px", marginBottom: "14px",
                  }}
                >
                  <StatCard title="Overall Score" value={`${result.score}/100`} valueColor={scoreColor} colors={colors} />
                  <StatCard title="Matched Skills" value={`${result.matchedKeywords?.length || 0}`} colors={colors} />
                  <StatCard title="Missing Skills" value={`${result.missingKeywords?.length || 0}`} colors={colors} />
                </div>

                {result.sectionScores && (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "repeat(2, minmax(0,1fr))" : "repeat(5, minmax(0,1fr))",
                        gap: "12px", marginBottom: "14px",
                      }}
                    >
                      <StatCard title="Summary" value={`${result.sectionScores.summary}`} colors={colors} />
                      <StatCard title="Skills" value={`${result.sectionScores.skills}`} colors={colors} />
                      <StatCard title="Experience" value={`${result.sectionScores.experience}`} colors={colors} />
                      <StatCard title="Projects" value={`${result.sectionScores.projects}`} colors={colors} />
                      <StatCard title="Education" value={`${result.sectionScores.education}`} colors={colors} />
                    </div>

                    <div
                      style={{
                        background: colors.panelBg, border: `1px solid ${colors.border}`,
                        borderRadius: "14px", padding: "15px", marginBottom: "14px",
                      }}
                    >
                      <div style={{ color: colors.muted, marginBottom: "8px", fontSize: "12px", fontWeight: 500 }}>
                        Detected Role
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>
                        {result.detectedRole || "General Software Developer"}
                      </div>
                    </div>
                  </>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0,1fr))",
                    gap: "12px", marginBottom: "14px",
                  }}
                >
                  <ResultCard title="Matched Keywords" items={result.matchedKeywords || []} color="#22c55e" colors={colors} />
                  <ResultCard title="Missing Keywords" items={result.missingKeywords || []} color="#ef4444" colors={colors} />
                  <ResultCard title="Suggestions" items={result.suggestions || []} color="#f59e0b" colors={colors} />
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* ── MODAL ── */}
      {showPreview && aiData && (
        <div
          style={{
            position: "fixed", inset: 0, width: "100%", height: "100%",
            background: "rgba(0,0,0,0.65)", display: "flex", justifyContent: "center",
            alignItems: isMobile ? "flex-end" : "center",
            zIndex: 1000, padding: isMobile ? "0" : "20px",
          }}
        >
          <div
            style={{
              width: isMobile ? "100%" : "800px",
              maxHeight: isMobile ? "92vh" : "80vh",
              overflowY: "auto", background: "#111827",
              borderRadius: isMobile ? "16px 16px 0 0" : "18px",
              padding: isMobile ? "16px" : "24px",
              border: "1px solid #374151", boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: "18px", gap: "10px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: isMobile ? "16px" : "18px" }}>AI Resume Preview</h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
                <button
                  onClick={handleDownloadResume}
                  style={{
                    padding: isMobile ? "8px 12px" : "10px 16px", borderRadius: "10px",
                    border: "none", background: "#6366f1", color: "#ffffff",
                    fontWeight: 700, fontSize: isMobile ? "12px" : "13px",
                    cursor: "pointer", boxShadow: "0 8px 20px rgba(99,102,241,0.35)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Download ATS Resume
                </button>
                
                <button
                  onClick={() => setShowPreview(false)}
                  style={{
                    padding: "8px 10px", borderRadius: "10px",
                    border: "1px solid #374151", background: "transparent",
                    color: "#ffffff", cursor: "pointer", fontSize: "16px",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: "12px", background: "#0b1220", border: "1px solid #1f2937",
                padding: isMobile ? "14px" : "22px", borderRadius: "14px",
                maxHeight: "65vh", overflowY: "auto", fontSize: "14px", lineHeight: 1.7,
              }}
            >
              {(aiData.finalResumeText || "").split("\n").map((line: string, index: number) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return null;

                const isHeading =
                  trimmedLine === trimmedLine.toUpperCase() &&
                  trimmedLine.length < 45 &&
                  !trimmedLine.includes("@") &&
                  !trimmedLine.includes("|");

                const isBullet =
                  trimmedLine.startsWith("•") ||
                  trimmedLine.startsWith("-") ||
                  /^\d+\./.test(trimmedLine);

                return (
                  <div
                    key={index}
                    style={{
                      marginTop: isHeading ? "18px" : "0",
                      marginBottom: isHeading ? "8px" : "6px",
                      fontWeight: isHeading ? 700 : 400,
                      fontSize: isHeading ? "15px" : "14px",
                      borderBottom: isHeading ? "1px solid #374151" : "none",
                      paddingBottom: isHeading ? "4px" : "0",
                      paddingLeft: isBullet ? "18px" : "0",
                      color: "#f8fafc",
                    }}
                  >
                    {trimmedLine}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SidebarLink({
  label, active, href, colors,
}: {
  label: string; active: boolean; href: string;
  colors: { activeBg: string; text: string; muted: string };
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "10px 12px", borderRadius: "10px", textDecoration: "none",
        background: active ? colors.activeBg : "transparent",
        fontWeight: active ? 600 : 500,
        color: active ? colors.text : colors.muted,
        display: "block", fontSize: "14px",
      }}
    >
      {label}
    </Link>
  );
}

function StatCard({
  title, value, valueColor, colors,
}: {
  title: string; value: string; valueColor?: string;
  colors: { panelBg: string; border: string; muted: string; text: string };
}) {
  return (
    <div style={{ background: colors.panelBg, border: `1px solid ${colors.border}`, borderRadius: "14px", padding: "15px" }}>
      <div style={{ color: colors.muted, marginBottom: "8px", fontSize: "12px", fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: "26px", fontWeight: 700, color: valueColor || colors.text, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
        {value}
      </div>
    </div>
  );
}

function ResultCard({
  title, items, color, colors,
}: {
  title: string; items: string[]; color: string;
  colors: { panelBg: string; border: string; muted: string; text: string };
}) {
  return (
    <div style={{ background: colors.panelBg, border: `1px solid ${colors.border}`, borderRadius: "14px", padding: "15px" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: colors.text }}>{title}</h3>
      {items.length === 0 ? (
        <p style={{ color: colors.muted, fontSize: "13px", margin: 0 }}>No items found.</p>
      ) : (
        <ul style={{ paddingLeft: "18px", margin: 0 }}>
          {items.map((item, index) => (
            <li key={`${item}-${index}`} style={{ marginBottom: "7px", color, fontSize: "13px", lineHeight: 1.5 }}>
              <span style={{ color: colors.text }}>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function secondaryButton(colors: {
  secondaryButtonBg: string; secondaryButtonText: string; secondaryButtonBorder: string;
}) {
  return {
    padding: "10px 12px", borderRadius: "10px",
    border: `1px solid ${colors.secondaryButtonBorder}`,
    background: colors.secondaryButtonBg, color: colors.secondaryButtonText,
    cursor: "pointer", textAlign: "left" as const, fontWeight: 500, fontSize: "13px",
  };
}