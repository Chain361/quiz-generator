import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
  let bucketToCleanUp: string | null = null;
  let pathToCleanUp: string | null = null;

  try {
    const body = await req.json();
    const { storageBucket, storagePath } = body;

    if (!storageBucket || !storagePath) {
      return NextResponse.json({ error: "Missing storage path" }, { status: 400 });
    }

    bucketToCleanUp = storageBucket;
    pathToCleanUp = storagePath;

    // 1. Download the PDF from Supabase storage (server side)
    const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
      .from(storageBucket)
      .download(storagePath);
      
    if (downloadError || !fileBlob) {
      console.error('Failed to download file from storage', downloadError);
      return NextResponse.json({ error: 'Failed to download file from storage' }, { status: 500 });
    }

    // 2. Convert the Blob to a Base64 string for Gemini native OCR
    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfBase64 = buffer.toString('base64');

    const userParts: any[] = [
      { text: "Create a multiple-choice quiz based on the attached educational material document. Ensure the generated quiz content is written entirely in the same language as the source text." },
      {
        inlineData: {
          data: pdfBase64,
          mimeType: "application/pdf"
        }
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: userParts,
        }
      ],
      config: {
        systemInstruction: "You are an expert educator. Your job is to create engaging, accurate multiple-choice quizzes from source material. Output only the requested JSON data structure.",
        responseMimeType: "application/json",
        responseSchema: quizSchema,
        temperature: 0.0,
      }
    });

    const jsonText = response?.text || "";
    const quizData = JSON.parse(jsonText);

    return NextResponse.json(quizData);

  } catch (error: any) {
    console.error("Quiz generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate quiz" }, { status: 500 });
  } finally {
    // 3. Always clean up the uploaded file to prevent orphaned files in storage.
    // This ensures it gets deleted even if the user refreshes or generation fails.
    if (bucketToCleanUp && pathToCleanUp) {
      const { error: removeError } = await supabaseAdmin.storage
        .from(bucketToCleanUp)
        .remove([pathToCleanUp]);
        
      if (removeError) console.error("Failed to clean up storage file:", removeError);
    }
  }
}