import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

const SKILL_GROUPS = {
  frontend: ["react", "next.js", "javascript", "typescript", "html", "css", "tailwind"],
  backend: ["node.js", "express", "rest api", "rest apis", "api", "jwt", "authentication"],
  database: ["mongodb", "postgresql", "mysql", "sql"],
  cloud: ["aws", "docker", "ci/cd", "kubernetes"],
  testing: ["unit testing", "integration testing", "jest", "testing"],
};

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await req.formData();

    const file = formData.get("resume");
    const jobDescription = formData.get("jobDescription");

    if (!(file instanceof File) || typeof jobDescription !== "string") {
      return NextResponse.json(
        { error: "Valid resume file and job description required" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let resumeText = "";

    if (file.name.toLowerCase().endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      resumeText = result.value.trim();
    } else {
      return NextResponse.json(
        { error: "Only DOCX is supported right now" },
        { status: 400 }
      );
    }

    const normalizedResume = normalizeText(resumeText);
    const normalizedJD = normalizeText(jobDescription);

    const matchedKeywords = new Set<string>();
    const missingKeywords = new Set<string>();

    let score = 0;

    score += scoreSkillGroup(
      SKILL_GROUPS.frontend,
      normalizedResume,
      normalizedJD,
      15,
      matchedKeywords,
      missingKeywords
    );

    score += scoreSkillGroup(
      SKILL_GROUPS.backend,
      normalizedResume,
      normalizedJD,
      20,
      matchedKeywords,
      missingKeywords
    );

    score += scoreSkillGroup(
      SKILL_GROUPS.database,
      normalizedResume,
      normalizedJD,
      10,
      matchedKeywords,
      missingKeywords
    );

    score += scoreSkillGroup(
      SKILL_GROUPS.cloud,
      normalizedResume,
      normalizedJD,
      10,
      matchedKeywords,
      missingKeywords
    );

    score += scoreSkillGroup(
      SKILL_GROUPS.testing,
      normalizedResume,
      normalizedJD,
      5,
      matchedKeywords,
      missingKeywords
    );

    score += coreKeywordScore(normalizedResume, normalizedJD, matchedKeywords, missingKeywords);

    if (score > 100) score = 100;

    const sections = extractResumeSections(resumeText);

    const sectionScores = {
      summary: scoreSection(sections.summary, normalizedJD),
      skills: scoreSection(sections.skills, normalizedJD),
      experience: scoreSection(sections.experience, normalizedJD),
      projects: scoreSection(sections.projects, normalizedJD),
      education: scoreSection(sections.education, normalizedJD),
    };

    const detectedRole = detectRole(normalizedJD);

    const suggestions = buildSuggestions(
      Array.from(missingKeywords),
      sectionScores,
      detectedRole
    );

    const savedScan = await prisma.resumeScan.create({
      data: {
        userId: payload.userId,
        fileName: file.name,
        resumeText,
        jobDescription,
        score,
        summaryScore: sectionScores.summary,
        skillsScore: sectionScores.skills,
        experienceScore: sectionScores.experience,
        projectsScore: sectionScores.projects,
        educationScore: sectionScores.education,
        detectedRole,
        matchedKeywords: Array.from(matchedKeywords),
        missingKeywords: Array.from(missingKeywords),
        suggestions,
      },
    });

    return NextResponse.json({
      id: savedScan.id,
      score,
      sectionScores,
      detectedRole,
      matchedKeywords: Array.from(matchedKeywords),
      missingKeywords: Array.from(missingKeywords),
      suggestions,
      resumeText,
      message: "Resume analyzed successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreSkillGroup(
  skills: string[],
  resume: string,
  jd: string,
  maxPoints: number,
  matched: Set<string>,
  missing: Set<string>
) {
  const relevantSkills = skills.filter((skill) => jd.includes(skill));
  if (relevantSkills.length === 0) return 0;

  let found = 0;

  for (const skill of relevantSkills) {
    if (resume.includes(skill)) {
      found++;
      matched.add(skill);
    } else {
      missing.add(skill);
    }
  }

  return Math.round((found / relevantSkills.length) * maxPoints);
}

function coreKeywordScore(
  resume: string,
  jd: string,
  matched: Set<string>,
  missing: Set<string>
) {
  const importantTerms = [
    "software engineer",
    "full stack",
    "scalable",
    "web applications",
    "rest",
    "apis",
    "git",
    "aws",
    "react",
    "node.js",
  ];

  const relevantTerms = importantTerms.filter((term) => jd.includes(term));
  if (relevantTerms.length === 0) return 40;

  let found = 0;

  for (const term of relevantTerms) {
    if (resume.includes(term)) {
      found++;
      matched.add(term);
    } else {
      missing.add(term);
    }
  }

  return Math.round((found / relevantTerms.length) * 40);
}

function extractResumeSections(resumeText: string) {
  const lines = resumeText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sections = {
    summary: "",
    skills: "",
    experience: "",
    projects: "",
    education: "",
  };

  let currentSection: keyof typeof sections | null = null;

  for (const line of lines) {
    const normalized = line.toLowerCase();

    if (isHeading(normalized, ["summary", "professional summary", "profile"])) {
      currentSection = "summary";
      continue;
    }

    if (isHeading(normalized, ["skills", "technical skills", "core skills"])) {
      currentSection = "skills";
      continue;
    }

    if (
      isHeading(normalized, [
        "experience",
        "work experience",
        "professional experience",
        "employment",
      ])
    ) {
      currentSection = "experience";
      continue;
    }

    if (isHeading(normalized, ["projects", "personal projects", "academic projects"])) {
      currentSection = "projects";
      continue;
    }

    if (isHeading(normalized, ["education", "academic background"])) {
      currentSection = "education";
      continue;
    }

    if (currentSection) {
      sections[currentSection] += `${line}\n`;
    }
  }

  return sections;
}

function isHeading(line: string, possibleHeadings: string[]) {
  return possibleHeadings.some((heading) => line === heading);
}

function scoreSection(sectionText: string, normalizedJD: string) {
  const text = normalizeText(sectionText);

  if (!text) return 0;

  const jdKeywords = extractRelevantKeywords(normalizedJD);
  if (jdKeywords.length === 0) return 70;

  let found = 0;
  for (const keyword of jdKeywords) {
    if (text.includes(keyword)) {
      found++;
    }
  }

  return Math.min(100, Math.round((found / jdKeywords.length) * 100));
}

function extractRelevantKeywords(normalizedJD: string) {
  const allKeywords = [
    ...SKILL_GROUPS.frontend,
    ...SKILL_GROUPS.backend,
    ...SKILL_GROUPS.database,
    ...SKILL_GROUPS.cloud,
    ...SKILL_GROUPS.testing,
    "full stack",
    "software engineer",
    "scalable",
    "web applications",
    "git",
  ];

  return Array.from(new Set(allKeywords.filter((keyword) => normalizedJD.includes(keyword))));
}

function detectRole(text: string) {

  if (
    text.includes("it support") ||
    text.includes("technical support") ||
    text.includes("help desk") ||
    text.includes("desktop support") ||
    text.includes("troubleshooting")
  ) {
    return "IT Support Specialist";
  }

  if (text.includes("software engineer")) {
    return "Software Engineer";
  }

  const frontendHits = countMatches(text, SKILL_GROUPS.frontend);
  const backendHits = countMatches(text, SKILL_GROUPS.backend);
  const cloudHits = countMatches(text, SKILL_GROUPS.cloud);

  if (text.includes("devops") || cloudHits >= 2) {
    return "DevOps Engineer";
  }

  if (frontendHits >= 3 && backendHits >= 3) {
    return "Full Stack Developer";
  }

  if (frontendHits >= 3) {
    return "Frontend Developer";
  }

  if (backendHits >= 3) {
    return "Backend Developer";
  }

  return "Software Developer";
}
function countMatches(text: string, keywords: string[]) {
  return keywords.filter((keyword) => text.includes(keyword)).length;
}
function buildSuggestions(
  missingKeywords: string[],
  sectionScores: {
    summary: number;
    skills: number;
    experience: number;
    projects: number;
    education: number;
  },
  detectedRole: string
) {
  const suggestions: string[] = [];

  if (sectionScores.summary < 60) {
    suggestions.push("Improve your summary section to better align with the target role.");
  }

  if (sectionScores.skills < 60) {
    suggestions.push("Add a stronger technical skills section with tools and frameworks relevant to the job.");
  }

  if (sectionScores.experience < 60) {
    suggestions.push("Strengthen your experience section with clearer responsibilities and impact.");
  }

  if (sectionScores.projects < 60) {
    suggestions.push("Add stronger project descriptions that show relevant technical work.");
  }

  if (missingKeywords.includes("docker")) {
    suggestions.push("Add Docker experience if you have worked with containers.");
  }

  if (missingKeywords.includes("ci/cd")) {
    suggestions.push("Mention CI/CD pipelines or deployment automation if applicable.");
  }

  if (
    missingKeywords.includes("unit testing") ||
    missingKeywords.includes("integration testing") ||
    missingKeywords.includes("testing")
  ) {
    suggestions.push("Add testing experience such as Jest, unit testing, or integration testing.");
  }

  if (missingKeywords.includes("postgresql") || missingKeywords.includes("sql")) {
    suggestions.push("Mention SQL or PostgreSQL projects if you have used relational databases.");
  }

  if (missingKeywords.includes("aws")) {
    suggestions.push("Highlight AWS usage such as EC2, S3, or deployment workflows.");
  }

  if (detectedRole === "Frontend Developer") {
    suggestions.push(
      "Your resume looks frontend-heavy. Add backend or deployment work if applying for full stack roles."
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Your resume aligns well. Improve it further by adding quantified achievements and stronger project impact."
    );
  }

  return suggestions.slice(0, 6);
}