import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type TailorResponse = {
  tailoredSummary: string;
  improvedBullets: string[];
  skillsToAdd: string[];
  atsSuggestions: string[];
  finalResumeText: string;
};

function extractJson(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

export async function POST(req: Request) {
  try {
   
    

  
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume text and job description are required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is missing" },
        { status: 500 }
      );
    }
const prompt = `
You are an expert ATS resume writer and modern resume designer.

Your task is to rewrite the resume so it is:
- Highly aligned with the job description
- ATS-friendly
- Visually clean and premium in structure

IMPORTANT:
The output must feel like a modern, professionally designed resume (similar to Notion, Canva, or Stripe style).
Use clean spacing, short sections, and strong readability.

CORE RULES:
- Do NOT invent fake experience.
- Do NOT invent tools, companies, or seniority.
- Keep all content truthful to the original resume.
- Rewrite content to improve clarity, impact, and alignment with the job description.

TITLE RULES:
- Use ONE clear professional title under the name.
- Adjust it based on job description if relevant.
- Do NOT combine multiple titles.

SUMMARY RULES:
- 2–3 lines maximum
- Clear, impactful, and role-focused
- Mention systems built (APIs, dashboards, platforms)

SKILLS RULES:
- Preserve original categories EXACTLY
- Keep formatting clean and scannable
- Prioritize most relevant skills first
- Do NOT add unsupported tools

EXPERIENCE RULES:
- Keep company, role, and dates unchanged
- Rewrite all bullet points
- Use "-" bullet style ONLY
- Keep bullets short (1–2 lines max)
- Focus on impact + technologies used

PROJECT RULES:
- Same as experience
- Highlight tech stack clearly

DESIGN & FORMATTING RULES:
- Use consistent spacing between sections
- Use clear uppercase section headings
- Keep lines short and readable
- Avoid long paragraphs
- Maintain strong visual hierarchy

STRUCTURE:

NAME
Professional Title
Location · Phone · Email · Portfolio/GitHub/LinkedIn

SUMMARY
...

SKILLS
...

EXPERIENCE
Company · Role · Dates
- Bullet
- Bullet

PROJECTS
Project Name · Tech Stack
- Bullet
- Bullet

EDUCATION
Degree · Institution · Year

OUTPUT FORMAT:
{
  "tailoredSummary": "",
  "improvedBullets": [],
  "skillsToAdd": [],
  "atsSuggestions": [],
  "finalResumeText": ""
}
Return valid JSON only. Do not include markdown, comments, or explanation.
Resume:
${resumeText}

Job Description:
${jobDescription}
`;
   const response = await client.responses.create({
  model: "gpt-4.1",
  input: prompt,
  temperature: 0.3,
  text: {
    format: {
      type: "json_schema",
      name: "tailored_resume_response",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          tailoredSummary: { type: "string" },
          improvedBullets: {
            type: "array",
            items: { type: "string" },
          },
          skillsToAdd: {
            type: "array",
            items: { type: "string" },
          },
          atsSuggestions: {
            type: "array",
            items: { type: "string" },
          },
          finalResumeText: { type: "string" },
        },
        required: [
          "tailoredSummary",
          "improvedBullets",
          "skillsToAdd",
          "atsSuggestions",
          "finalResumeText",
        ],
      },
    },
  },
});
    const aiText = response.output_text;
    const parsed = extractJson(aiText) as TailorResponse;

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI tailor error:", error);

    return NextResponse.json(
      { error: "Failed to generate AI tailored resume" },
      { status: 500 }
    );
  }
}