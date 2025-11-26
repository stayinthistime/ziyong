// src/services/gemini.ts

import { GoogleGenAI } from "@google/genai";

import type {
  AnalysisResponse,
  Subject,
  VocabularyResponse,
} from "../types";

import { SUBJECT_LABELS } from "../types";

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  console.error("❌ API Key is missing! 请检查 .env 中的 VITE_API_KEY");
}

const ai = new GoogleGenAI({ apiKey });
const modelId = "gemini-2.5-flash";

// ----------------------
// JSON Schema（普通 JS 对象，不用 Type/Schema）
// ----------------------

// 错题分析的结构约束
const analysisSchema = {
  type: "object",
  properties: {
    mistakeDiagnosis: {
      type: "string",
      description: "A friendly analysis of what the student likely did wrong or misunderstood.",
    },
    coreConcept: {
      type: "string",
      description: "The name of the physics/math/chemistry/english concept involved.",
    },
    stepByStepSolution: {
      type: "array",
      items: { type: "string" },
      description: "A step-by-step correct solution or analysis of the problem.",
    },
    practiceQuestion: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "A new, similar problem for practice.",
        },
        answer: {
          type: "string",
          description: "The final answer to the practice problem.",
        },
        explanation: {
          type: "string",
          description: "Brief explanation of the practice problem.",
        },
      },
      required: ["question", "answer", "explanation"],
    },
  },
  required: ["mistakeDiagnosis", "coreConcept", "stepByStepSolution", "practiceQuestion"],
} as const;

// 生词表的结构约束
const vocabularySchema = {
  type: "object",
  properties: {
    topic: { type: "string" },
    words: {
      type: "array",
      items: {
        type: "object",
        properties: {
          word: { type: "string" },
          pronunciation: {
            type: "string",
            description: "IPA pronunciation",
          },
          definition: {
            type: "string",
            description: "Concise Chinese definition",
          },
          example: {
            type: "string",
            description: "English example sentence using the word",
          },
        },
        required: ["word", "pronunciation", "definition", "example"],
      },
    },
  },
  required: ["topic", "words"],
} as const;

// ----------------------
// 错题分析
// ----------------------
export const analyzeProblem = async (
  textInput: string,
  subject: Subject,
  imageBase64?: string
): Promise<AnalysisResponse> => {
  const subjectName = SUBJECT_LABELS[subject];

  const promptText = `
    你是一名中国资深高中${subjectName}教师。
    请帮助学生分析这道${subjectName}错题。
    
    任务：
    1. 诊断错误：分析学生可能在哪里出错（思路、计算、语法等），语气要鼓励且专业。
    2. 核心考点：明确指出这道题考察的知识点。
    3. 正确解析：给出详细的步骤解析（如果是英语题，请进行语法拆解或篇章分析）。
    4. 举一反三：出一道考察相同知识点的变式题。

    题目内容：${textInput}
  `;

  const parts: any[] = [{ text: promptText }];

  if (imageBase64) {
    const cleanBase64 = imageBase64.split(",")[1] || imageBase64;
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanBase64,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema as any,
        systemInstruction:
          "Always respond in Simplified Chinese. Format mathematical symbols clearly.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AnalysisResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// ----------------------
// 生词本生成
// ----------------------
export const generateVocabulary = async (
  topic: string
): Promise<VocabularyResponse> => {
  const promptText = `
    为高中生生成一份关于 "${topic}" 的英语词汇表。
    
    要求：
    1. 选取 5-8 个与该主题高度相关且符合高考大纲要求的单词或短语。
    2. 难度适中（高中英语水平）。
    3. 提供音标、中文释义和例句。
    4. 不要重复提供。
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: vocabularySchema as any,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as VocabularyResponse;
  } catch (error) {
    console.error("Vocabulary Gen Error:", error);
    throw error;
  }
};
