"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const rotatingWords = [
  "job roles.",
  "applications.",
  "match scores.",
  "skill gaps.",
];

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);

      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setVisible(true);
      }, 220);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "#09090b",
        color: "white",
      }}
    >
      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          borderRight: "1px solid #27272a",
        }}
      >
        <div style={{ maxWidth: "540px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "28px",
            }}
          >
            <img
              src="/headhunting.png"
              alt="Resume Match Analyzer"
              style={{
                width: "46px",
                height: "46px",
                objectFit: "contain",
                background: "#f8fafc",
                padding: "7px",
                borderRadius: "12px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
              }}
            />

            <div>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>
                Resume Match Analyzer
              </div>
              <div style={{ color: "#a1a1aa", fontSize: "14px", lineHeight: 1.5 }}>
                Analyze your resume against job descriptions and track improvements.
              </div>
            </div>
          </div>

          <h1
            style={{
              fontSize: "64px",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              fontWeight: 300,
              marginBottom: "18px",
            }}
          >
            Create an account to track your resume across
            <br />
            <span
              style={{
                display: "inline-block",
                minWidth: "260px",
                color: "#60a5fa",
                transition: "opacity 220ms ease, transform 220ms ease",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(6px)",
              }}
            >
              {rotatingWords[wordIndex]}
            </span>
          </h1>

          <p
            style={{
              color: "#a1a1aa",
              fontSize: "18px",
              lineHeight: 1.7,
              maxWidth: "520px",
              marginBottom: "22px",
            }}
          >
            Save your analyses, compare past results, and see how your resume
            performs across different job roles.
          </p>

          <div
            style={{
              display: "grid",
              gap: "10px",
              color: "#d4d4d8",
              fontSize: "15px",
            }}
          >
            <div>✓ Resume match scoring</div>
            <div>✓ Missing skill detection</div>
            <div>✓ Comparison and progress tracking</div>
          </div>
        </div>
      </section>

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "460px",
            background: "#111111",
            border: "1px solid #27272a",
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          }}
        >
          <h2 style={{ fontSize: "36px", marginBottom: "8px", fontWeight: 600 }}>
            Create account
          </h2>
          <p style={{ color: "#a1a1aa", marginBottom: "24px", fontSize: "16px" }}>
            Sign up to save your resume analyses and compare results over time.
          </p>

          <form
            onSubmit={handleRegister}
            style={{ display: "grid", gap: "16px" }}
            autoComplete="off"
          >
            <input
              type="text"
              name="name"
              autoComplete="off"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #3f3f46",
                background: "#0b0b0b",
                color: "white",
                fontSize: "16px",
                outline: "none",
              }}
            />

            <input
              type="email"
              name="email"
              autoComplete="off"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #3f3f46",
                background: "#0b0b0b",
                color: "white",
                fontSize: "16px",
                outline: "none",
              }}
            />

            <input
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #3f3f46",
                background: "#0b0b0b",
                color: "white",
                fontSize: "16px",
                outline: "none",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "14px 16px",
                borderRadius: "12px",
                border: "none",
                background: "white",
                color: "black",
                fontWeight: 700,
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {error && (
            <div
              style={{
                marginTop: "16px",
                background: "#2b1111",
                border: "1px solid #7f1d1d",
                color: "#fca5a5",
                padding: "12px 14px",
                borderRadius: "12px",
              }}
            >
              {error}
            </div>
          )}

          <p style={{ marginTop: "24px", color: "#a1a1aa", fontSize: "15px" }}>
            Already have an account?{" "}
            <span
              onClick={() => router.push("/login")}
              style={{ color: "white", cursor: "pointer", fontWeight: 600 }}
            >
              Login
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}