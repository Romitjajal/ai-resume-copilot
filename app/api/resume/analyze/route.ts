import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import pdf from "pdf-parse-new";
export const runtime = "nodejs";
export const maxDuration = 60;

const SKILL_GROUPS = {
  frontend: ["react", "next.js", "javascript", "typescript", "html", "css", "tailwind"],
  backend: ["node.js", "express", "rest api", "rest apis", "api", "jwt", "authentication"],
  database: ["mongodb", "postgresql", "mysql", "sql"],
  cloud: ["aws", "docker", "ci/cd", "kubernetes"],
  testing: ["unit testing", "integration testing", "jest", "testing"],

  businessAnalyst: [
    "business analyst",
    "business process analyst",
    "business analysis",
    "business processes",
    "process analyst",
    "process analysis",
    "process mining",
    "process modelling",
    "process modeling",
    "process mapping",
    "process design",
    "process documentation",
    "process improvement",
    "continuous improvement",
    "workflow optimisation",
    "workflow optimization",
    "workflow diagrams",
    "work task management",
    "standardisation",
    "standardization",
    "operational efficiency",
    "compliance",
    "governance",
    "audit standards",
    "system controls",
    "change adoption",
    "training",
    "training packs",
    "facilitation",
    "workshops",
    "stakeholder",
    "stakeholders",
    "stakeholder management",
    "stakeholder communication",
    "requirements gathering",
    "requirement gathering",
    "functional requirements",
    "user stories",
    "uat",
    "user acceptance testing",
    "bpmn",
    "bpmn 2.0",
    "aris",
    "signavio",
    "celonis",
    "power bi",
    "excel",
    "brd",
    "frd",
    "agile",
  ],

  dataAnalyst: [
    "data analysis",
    "data analyst",
    "analytics",
    "excel",
    "sql",
    "power bi",
    "tableau",
    "dashboards",
    "dashboard",
    "reporting",
    "data visualization",
    "data visualisation",
    "kpi",
    "kpis",
  ],
};

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;

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
} else if (file.name.toLowerCase().endsWith(".pdf")) {
  try {
    const result = await pdf(buffer);
    resumeText = result.text.trim();
  } catch (err) {
    console.error("PDF Parse Error:", err);

    return NextResponse.json(
      {
        error: "Unable to read this PDF. Please upload another PDF or DOCX.",
      },
      { status: 400 }
    );
  }

  if (!resumeText) {
    return NextResponse.json(
      {
        error: "This PDF contains no selectable text. It may be scanned.",
      },
      { status: 400 }
    );
  }
} else {
  return NextResponse.json(
    { error: "Only DOCX and PDF files are supported right now" },
    { status: 400 }
  );
}
    const MAX_LENGTH = 12000;

    const trimmedResumeText =
      resumeText.length > MAX_LENGTH ? resumeText.slice(0, MAX_LENGTH) : resumeText;

    const trimmedJobDescription =
      jobDescription.length > MAX_LENGTH
        ? jobDescription.slice(0, MAX_LENGTH)
        : jobDescription;

    const normalizedResume = normalizeText(trimmedResumeText);
    const normalizedJD = normalizeText(trimmedJobDescription);

    const matchedKeywords = new Set<string>();
    const missingKeywords = new Set<string>();

    const detectedRole = detectRole(normalizedResume);

    let score = 0;

    if (detectedRole === "Business Analyst") {
      score += scoreSkillGroup(
        SKILL_GROUPS.businessAnalyst,
        normalizedResume,
        normalizedJD,
        60,
        matchedKeywords,
        missingKeywords
      );

      score += scoreSkillGroup(
        SKILL_GROUPS.dataAnalyst,
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
    } else if (detectedRole === "Data Analyst") {
      score += scoreSkillGroup(
        SKILL_GROUPS.dataAnalyst,
        normalizedResume,
        normalizedJD,
        60,
        matchedKeywords,
        missingKeywords
      );

      score += scoreSkillGroup(
        SKILL_GROUPS.database,
        normalizedResume,
        normalizedJD,
        20,
        matchedKeywords,
        missingKeywords
      );
    } else {
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
    }

    score += coreKeywordScore(normalizedResume, normalizedJD, matchedKeywords, missingKeywords);

    score = Math.min(score, 100);

    const sections = extractResumeSections(resumeText);

  const sectionScores = {
  summary: scoreSection(sections.summary, normalizedJD),
  skills: scoreSection(sections.skills, normalizedJD),
  experience: scoreSection(sections.experience, normalizedJD),

  projects:
    detectedRole === "Business Analyst"
      ? 100
      : scoreSection(sections.projects, normalizedJD),

  education: sections.education ? 100 : 0,
};
const keywordScore = score;

const sectionAverage = Math.round(
  (sectionScores.summary +
    sectionScores.skills +
    sectionScores.experience +
    sectionScores.projects +
    sectionScores.education) / 5
);

score = Math.round(keywordScore * 0.5 + sectionAverage * 0.5);

score = Math.min(score, 100);

const suggestions = buildSuggestions(
  Array.from(missingKeywords),
  sectionScores,
  detectedRole
);

    let savedScan = null;

    if (payload) {
      try {
        savedScan = await prisma.resumeScan.create({
          data: {
            userId: payload.userId,
            fileName: file.name,
            resumeText: trimmedResumeText,
            jobDescription: trimmedJobDescription,
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
      } catch (dbError) {
        console.error("History save failed:", dbError);
      }
    }

    return NextResponse.json({
      id: savedScan?.id,
      savedToHistory: Boolean(savedScan),
      score,
      sectionScores,
      detectedRole,
      matchedKeywords: Array.from(matchedKeywords),
      missingKeywords: Array.from(missingKeywords),
      suggestions,
      resumeText,
      message: savedScan
        ? "Resume analyzed and saved successfully"
        : "Resume analyzed successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[^a-z0-9+#./\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreSkillGroup(
  skills: string[],
  resume: string,
  jd: string,
  maxPoints: number,
  matched: Set<string>,
  missing: Set<string>
) {
  const normalizedResume = normalizeText(resume);
  const normalizedJD = normalizeText(jd);

  const relevantSkills = skills.filter((skill) =>
    normalizedJD.includes(normalizeText(skill))
  );

  if (relevantSkills.length === 0) return 0;

  let found = 0;

  for (const skill of relevantSkills) {
    const normalizedSkill = normalizeText(skill);

    if (normalizedResume.includes(normalizedSkill)) {
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
    "business analyst",
    "business process analyst",
    "business analysis",
    "business processes",
    "process analyst",
    "process mapping",
    "process design",
    "process documentation",
    "continuous improvement",
    "stakeholder",
    "stakeholders",
    "stakeholder management",
    "requirements gathering",
    "process improvement",
    "training",
    "facilitation",
    "workshops",
    "governance",
    "system controls",
    "uat",
    "data analyst",
    "data analysis",
    "analytics",
    "dashboards",
    "reporting",
  ];

  const normalizedResume = normalizeText(resume);
  const normalizedJD = normalizeText(jd);

  const relevantTerms = importantTerms.filter((term) =>
    normalizedJD.includes(normalizeText(term))
  );

  if (relevantTerms.length === 0) return 0;

  let found = 0;

  for (const term of relevantTerms) {
    const normalizedTerm = normalizeText(term);

    if (normalizedResume.includes(normalizedTerm)) {
      found++;
      matched.add(term);
    } else {
      missing.add(term);
    }
  }

  return Math.round((found / relevantTerms.length) * 30);
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

    if (
      isHeading(normalized, [
        "summary",
        "professional summary",
        "profile",
        "profile overview",
        "career summary",
      ])
    ) {
      currentSection = "summary";
      continue;
    }

    if (
      isHeading(normalized, [
        "skills",
        "technical skills",
        "core skills",
        "core competencies",
        "competencies",
      ])
    ) {
      currentSection = "skills";
      continue;
    }

    if (
      isHeading(normalized, [
        "experience",
        "work experience",
        "professional experience",
        "professional work experience",
        "employment",
        "employment history",
      ])
    ) {
      currentSection = "experience";
      continue;
    }

    if (
      isHeading(normalized, [
        "projects",
        "personal projects",
        "academic projects",
        "research project",
        "research projects",
        "academic project",
      ])
    ) {
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
  const cleanLine = line
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return possibleHeadings.some((heading) => cleanLine === heading);
}

function scoreSection(sectionText: string, normalizedJD: string) {
  const text = normalizeText(sectionText);

  if (!text) return 0;

  const jdKeywords = extractRelevantKeywords(normalizedJD);

  if (jdKeywords.length === 0) return 0;

  let found = 0;

  for (const keyword of jdKeywords) {
    if (text.includes(normalizeText(keyword))) {
      found++;
    }
  }

  const score = Math.round(
  (found / Math.max(jdKeywords.length * 0.35, 1)) * 100
);

return Math.min(100, score);
}

function extractRelevantKeywords(normalizedJD: string) {
  const allKeywords = [
    ...SKILL_GROUPS.frontend,
    ...SKILL_GROUPS.backend,
    ...SKILL_GROUPS.database,
    ...SKILL_GROUPS.cloud,
    ...SKILL_GROUPS.testing,
    ...SKILL_GROUPS.businessAnalyst,
    ...SKILL_GROUPS.dataAnalyst,
    "full stack",
    "software engineer",
    "scalable",
    "web applications",
    "git",
  ];

  const normalizedJDText = normalizeText(normalizedJD);

  return Array.from(
    new Set(
      allKeywords.filter((keyword) =>
        normalizedJDText.includes(normalizeText(keyword))
      )
    )
  );
}

function detectRole(text: string) {
  const normalizedText = normalizeText(text);

  const frontendHits = countMatches(normalizedText, SKILL_GROUPS.frontend);
  const backendHits = countMatches(normalizedText, SKILL_GROUPS.backend);
  const cloudHits = countMatches(normalizedText, SKILL_GROUPS.cloud);
  const databaseHits = countMatches(normalizedText, SKILL_GROUPS.database);
  const baHits = countMatches(normalizedText, SKILL_GROUPS.businessAnalyst);
  const dataHits = countMatches(normalizedText, SKILL_GROUPS.dataAnalyst);

  const hasStrongDevSignals =
    normalizedText.includes("software engineer") ||
    normalizedText.includes("software developer") ||
    normalizedText.includes("full stack developer") ||
    normalizedText.includes("frontend developer") ||
    normalizedText.includes("backend developer") ||
    normalizedText.includes("react") ||
    normalizedText.includes("node.js") ||
    normalizedText.includes("typescript") ||
    normalizedText.includes("javascript");

  if (
    normalizedText.includes("it support") ||
    normalizedText.includes("technical support") ||
    normalizedText.includes("help desk") ||
    normalizedText.includes("desktop support") ||
    normalizedText.includes("troubleshooting")
  ) {
    return "IT Support Specialist";
  }

  if (hasStrongDevSignals && frontendHits >= 3 && backendHits >= 2) {
    return "Full Stack Developer";
  }

  if (hasStrongDevSignals && frontendHits >= 3) {
    return "Frontend Developer";
  }

  if (hasStrongDevSignals && backendHits >= 3) {
    return "Backend Developer";
  }

  if (normalizedText.includes("software engineer") || normalizedText.includes("software developer")) {
    return "Software Engineer";
  }

  if (normalizedText.includes("devops") || cloudHits >= 2) {
    return "DevOps Engineer";
  }

  if (baHits >= 4 && frontendHits < 3 && backendHits < 2) {
    return "Business Analyst";
  }

  if (dataHits >= 4 && frontendHits < 3 && backendHits < 2) {
    return "Data Analyst";
  }

  if (databaseHits >= 2 && dataHits >= 3) {
    return "Data Analyst";
  }

  return "Other";
}

function countMatches(text: string, keywords: string[]) {
  const normalizedText = normalizeText(text);

  return keywords.filter((keyword) =>
    normalizedText.includes(normalizeText(keyword))
  ).length;
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
    if (detectedRole === "Business Analyst") {
      suggestions.push(
        "Add stronger business process skills such as process design, documentation, governance, stakeholder engagement, workshops, and continuous improvement."
      );
    } else if (detectedRole === "Data Analyst") {
      suggestions.push(
        "Add stronger data skills such as SQL, Excel, Power BI, Tableau, dashboards, reporting, and KPI analysis."
      );
    } else {
      suggestions.push("Add a stronger technical skills section with tools and frameworks relevant to the job.");
    }
  }

  if (sectionScores.experience < 60) {
    suggestions.push("Strengthen your experience section with clearer responsibilities and measurable impact.");
  }

  if (sectionScores.projects < 60 && detectedRole !== "Business Analyst") {
    suggestions.push("Add stronger project descriptions that show relevant technical work.");
  }

  if (missingKeywords.includes("process documentation")) {
    suggestions.push("Add examples of process documentation, training packs, or SOP-style materials if you have done this.");
  }

  if (missingKeywords.includes("governance") || missingKeywords.includes("system controls")) {
    suggestions.push("Mention governance, compliance, audit, or system control experience if relevant.");
  }

  if (missingKeywords.includes("training") || missingKeywords.includes("facilitation")) {
    suggestions.push("Highlight training, facilitation, or workshop experience.");
  }

  if (missingKeywords.includes("docker")) {
    suggestions.push("Add Docker experience if you have worked with containers.");
  }

  if (missingKeywords.includes("ci/cd")) {
    suggestions.push("Mention CI/CD pipelines or deployment automation if applicable.");
  }

  if (missingKeywords.includes("postgresql") || missingKeywords.includes("sql")) {
    suggestions.push("Mention SQL or database/reporting work if you have used it.");
  }

  if (missingKeywords.includes("aws")) {
    suggestions.push("Highlight AWS usage such as EC2, S3, or deployment workflows.");
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Your resume aligns well. Improve it further by adding quantified achievements and stronger impact."
    );
  }

  return suggestions.slice(0, 6);
}