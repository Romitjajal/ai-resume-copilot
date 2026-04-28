"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#09090b",
        color: "#f8fafc",
        padding: isMobile ? "20px" : "40px",
      }}
    >
      {/* NAV */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: isMobile ? "48px" : "80px",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#fff",
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            ✦
          </div>
          <h2
            style={{
              fontWeight: 700,
              fontSize: isMobile ? "14px" : "16px",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            AI Resume Copilot
          </h2>
        </div>

        <div style={{ display: "flex", gap: isMobile ? "10px" : "16px", alignItems: "center" }}>
          <Link
            href="/login"
            style={{
              color: "#cbd5f5",
              textDecoration: "none",
              fontSize: isMobile ? "13px" : "14px",
            }}
          >
            Login
          </Link>
          <Link
            href="/register"
            style={{
              padding: isMobile ? "7px 12px" : "8px 14px",
              background: "#6366f1",
              borderRadius: "8px",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: isMobile ? "13px" : "14px",
              whiteSpace: "nowrap",
            }}
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <h1
        style={{
          fontSize: isMobile ? "36px" : "56px",
          maxWidth: "750px",
          lineHeight: 1.2,
          background: "linear-gradient(90deg, #ffffff, #a5b4fc)",
          WebkitBackgroundClip: "text",
          color: "transparent",
          margin: 0,
        }}
      >
        Build job-ready resumes that actually pass ATS filters
      </h1>

      <p
        style={{
          color: "#94a3b8",
          marginTop: "16px",
          maxWidth: "600px",
          fontSize: isMobile ? "14px" : "16px",
          lineHeight: 1.6,
        }}
      >
        Upload your resume, paste a job description, and instantly get a tailored,
        ATS-optimized version.
      </p>

      {/* CTA */}
      <div style={{ marginTop: "30px" }}>
        <Link
          href="/tool"
          style={{
            display: "inline-block",
            padding: isMobile ? "12px 22px" : "14px 26px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "12px",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: isMobile ? "14px" : "15px",
            boxShadow: "0 10px 30px rgba(99,102,241,0.35)",
          }}
        >
          Start Optimizing Your Resume
        </Link>
      </div>

      {/* TRUST LINE */}
      <p
        style={{
          marginTop: "14px",
          fontSize: "12px",
          color: "#6b7280",
          lineHeight: 1.6,
        }}
      >
        Powered by advanced AI • No login required • Your data isn't stored
      </p>

      {/* FEATURES */}
      <div
        style={{
          marginTop: isMobile ? "60px" : "100px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? "28px" : "24px",
          maxWidth: "900px",
        }}
      >
        {[
          {
            title: "Smart Matching",
            desc: "Align your resume with job descriptions using AI-driven keyword analysis.",
          },
          {
            title: "Instant Optimization",
            desc: "Improve summary, experience, and skills in seconds.",
          },
          {
            title: "ATS-Ready Export",
            desc: "Download a clean resume designed to pass ATS systems.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            style={{
              padding: isMobile ? "18px" : "0",
              background: isMobile ? "#0f1012" : "transparent",
              border: isMobile ? "1px solid #1f2937" : "none",
              borderRadius: isMobile ? "12px" : "0",
            }}
          >
            <h4
              style={{
                margin: "0 0 8px 0",
                fontSize: "15px",
                fontWeight: 600,
                color: "#f8fafc",
              }}
            >
              {feature.title}
            </h4>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0, lineHeight: 1.6 }}>
              {feature.desc}
            </p>
          </div>
        ))}
      </div>

      {/* DEMO BLOCK */}
      <div
        style={{
          marginTop: isMobile ? "60px" : "100px",
          maxWidth: "700px",
          paddingBottom: "60px",
        }}
      >
        <h2 style={{ fontSize: isMobile ? "20px" : "24px", marginBottom: "10px" }}>
          See how it works
        </h2>

        <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
          Upload → Analyze → Download in seconds
        </p>

        <div
          style={{
            marginTop: "20px",
            padding: isMobile ? "16px" : "20px",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            color: "#9ca3af",
            fontSize: "13px",
            background: "#0f172a",
            lineHeight: 2,
          }}
        >
          Resume Score: 70 → 92 ↑ <br />
          Missing Skills: AWS, Testing <br />
          Improved Summary Generated <br />
          ATS Resume Ready for Download
        </div>
      </div>
    </main>
  );
}