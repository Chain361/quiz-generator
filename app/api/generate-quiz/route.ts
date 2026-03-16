import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Define the strict JSON schema we want Gemini to return
const quizSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A catchy, short title for the quiz based on the material.",
    },
    questions: {
      type: Type.ARRAY,
      description: "A list of multiple choice questions. Questions should be covered all of contents in the file. At least 10 question and maximum 20 questions.",
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The question text." },
          topic_tag: { type: Type.STRING, description: "A 1-3 word category tag for this question (e.g., 'Cell Biology', 'Fractions')." },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 4 possible answers.",
          },
          correct_answer: { type: Type.STRING, description: "The exact string of the correct answer from the options array." },
          explanation: { type: Type.STRING, description: "A short, 1-sentence explanation of why the answer is correct." },
        },
        required: ["text", "topic_tag", "options", "correct_answer", "explanation"],
      },
    },
  },
  required: ["title", "questions"],
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Now we expect a base64 string of the PDF from the frontend
    const { pdfBase64 } = body; 

    if (!pdfBase64) {
      return NextResponse.json({ error: "No PDF provided" }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { 
          role: 'user', 
          parts: [
            { text: "Create a multiple-choice quiz based on the attached educational material document. Ensure the generated quiz content is written entirely in the same language as the source text." },
            { 
              // Send the PDF directly to Gemini!
              inlineData: { 
                data: pdfBase64, 
                mimeType: "application/pdf" 
              } 
            }
          ] 
        }
      ],
      config: {
        systemInstruction: "You are an expert educator. Your job is to create engaging, accurate multiple-choice quizzes from source material. Output only the requested JSON data structure.",
        responseMimeType: "application/json",
        responseSchema: quizSchema,
        temperature: 0.2, 
      }
    });

    const jsonText = response?.text || "";
    const quizData = JSON.parse(jsonText);

    return NextResponse.json(quizData);

  } catch (error: any) {
    console.error("Quiz generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate quiz" }, { status: 500 });
  }
}