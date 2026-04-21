import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import OpenAI from "openai";
// Defer importing PDF libraries (like `unpdf`) until runtime so we can
// ensure any required shims (e.g. `Promise.try`) are set beforehand.

// Define the schema as a plain object to inject into the system prompt
// Qwen works best when the schema is explicitly described in the instructions
const quizSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          topic_tag: { type: "string" },
          options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
          correct_answer: { type: "string" },
          explanation: { type: "string" }
        },
        required: ["text", "topic_tag", "options", "correct_answer", "explanation"]
      }
    }
  },
  required: ["title", "questions"]
};

// Helper: cleanup file in background (non-blocking)
async function cleanupFileBackground(supabase: any, bucket: string, path: string) {
  try {
    await supabase.storage.from(bucket).remove([path]);
  } catch (err) {
    console.error("Background cleanup error:", err);
  }
}

export async function POST(req: Request) {
  let bucketToCleanUp: string | null = null;
  let pathToCleanUp: string | null = null;

  const supabaseAdmin = createAdminClient();
  
  // FIX: Removed the extra 'h' in the baseURL
  const qwen = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://coding-intl.dashscope.aliyuncs.com/v1", 
  });

  try {
    const body = await req.json();
    const { storageBucket, storagePath } = body;

    if (!storageBucket || !storagePath) {
      return NextResponse.json({ error: "Missing storage path" }, { status: 400 });
    }

    bucketToCleanUp = storageBucket;
    pathToCleanUp = storagePath;

    // 1. Download PDF from Supabase
    const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
      .from(storageBucket)
      .download(storagePath);
      
    if (downloadError || !fileBlob) {
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }

    // 2. Extract text using `unpdf`.
    // Ensure `Promise.try` exists before loading any PDF libraries that expect it.
    if (!(Promise as any).try) {
      (Promise as any).try = function (fn: any, ...args: any[]) {
        try {
          const result = typeof fn === 'function' ? fn.apply(this, args) : fn;
          return Promise.resolve(result);
        } catch (err) {
          return Promise.reject(err);
        }
      };
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Dynamic import so the shim above runs before the module executes.
    const unpdfMod: any = await import('unpdf');
    const extractText = unpdfMod.extractText || unpdfMod.default?.extractText;
    if (!extractText) throw new Error('Failed to load PDF extractor (unpdf)');
    const { text: documentText } = await extractText(buffer);

    // 3. Call Qwen with optimized prompt for faster generation
    const completion = await qwen.chat.completions.create({
      model: "qwen3.6-plus", 
      messages: [
        { 
          role: "system", 
          content: `You are an expert educator. Create a multiple-choice quiz in JSON format. 
          Follow this exact schema: ${JSON.stringify(quizSchema)}. 
          Ensure output is valid JSON. Generate EXACTLY 5 questions (not more).` 
        },
        { 
          role: "user", 
          content: `Create a quick 5-question quiz based on this document. Language must match the document.\n\nDocument content:\n${documentText}` 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2000,
    });

    const jsonText = completion.choices[0].message.content || "{}";
    const quizData = JSON.parse(jsonText);

    return NextResponse.json(quizData);

  } catch (error: any) {
    console.error("Qwen Quiz generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate quiz" }, { status: 500 });
  } finally {
    // Cleanup file in background (don't block response)
    if (bucketToCleanUp && pathToCleanUp) {
      cleanupFileBackground(supabaseAdmin, bucketToCleanUp, pathToCleanUp);
    }
  }
}