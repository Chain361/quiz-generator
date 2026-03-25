"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CreateQuiz() {
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [quizCode, setQuizCode] = useState("");
  const [session, setSession] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const supabase = createClient();
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error("Error fetching session:", authError.message);
        setError("Could not fetch user session.");
        return;
      }
      setSession(session);
    }
    getSession();
    
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit. Please upload a smaller file.");
      return;
    }

    setFileName(file.name);
    setSelectedFile(file);
    setError("");
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setGeneratedQuiz(null);
    setQuizCode("");
    setStoragePath(null);
    
    try {
      if (!selectedFile) {
        throw new Error("Please select a PDF file first.");
      }

      // 1. Upload to Supabase Storage
      const supabase = createClient();
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${session?.user?.id || 'anonymous'}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, selectedFile);
        
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      
      setStoragePath(uploadData.path);

      // 2. Call the Gemini AI Route with the storage path
      const payload = { storageBucket: 'materials', storagePath: uploadData.path };

      // Call the Gemini AI Route we created earlier
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate quiz");
      }
      
      const data = await res.json();
      setGeneratedQuiz(data);
      console.log(data);
      
      // 3. Increment the user's file_uploaded count after successful generation
      if (session?.user?.id) {
        const { data: userData } = await supabase
          .from("users")
          .select("file_uploaded")
          .eq("id", session.user.id)
          .maybeSingle();

        if (userData) {
          await supabase
            .from("users")
            .update({ file_uploaded: (userData.file_uploaded || 0) + 1 })
            .eq("id", session.user.id);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedQuiz) return;
    setSaving(true);
    setError("");

    try {
      const payload: any = { quiz: generatedQuiz };
      if (storagePath) payload.storageBucket = 'materials', payload.storagePath = storagePath;

      const res = await fetch("/api/save-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to save quiz");

      setQuizCode(data.quizCode);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 space-y-8 font-sans">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create a New Quiz</h1>
          <p className="text-secondary-foreground">Upload a PDF of your lesson material below, and our AI will generate quiz instantly.</p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* PDF Upload Area */}
          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative ${fileName ? 'border-primary bg-card' : 'border-secondary hover:bg-card/50 bg-input'}`}>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Upload PDF"
            />
            <div className="space-y-2 pointer-events-none">
              <svg className={`mx-auto h-12 w-12 ${fileName ? 'text-primary' : 'text-secondary-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-foreground font-medium">
                {fileName ? (
                  <span className="text-primary">Selected: {fileName}</span>
                ) : (
                  "Drag and drop a PDF document, or click to browse"
                )}
              </p>
            {!fileName && <p className="text-sm text-secondary-foreground">Supports text, scanned images, and charts. Max file size: 10MB.</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedFile}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Material & Generating Quiz...
              </span>
            ) : (
              "Generate Quiz ✨"
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive">
            {error}
          </div>
        )}
        {/* Preview Section */}
        {generatedQuiz && (
          <div className="mt-8 p-6 bg-card border border-secondary rounded-xl shadow-md space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-secondary pb-4">
              <h2 className="text-2xl font-bold text-foreground">{generatedQuiz.title}</h2>
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Preview Mode</span>
            </div>
            
            <div className="space-y-8">
              {generatedQuiz.questions.map((q: any, i: number) => (
                <div key={i} className="space-y-3 bg-secondary p-4 rounded-lg border border-accent">
                  <p className="font-semibold text-foreground text-lg">
                    {q.text}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                    {q.options.map((opt: string, j: number) => (
                      <div 
                        key={j} 
                        className={`p-3 rounded-lg border text-sm flex items-center gap-3 ${
                          opt === q.correct_answer 
                            ? 'bg-accent text-accent-foreground font-medium border-accent' 
                            : 'bg-input border-secondary text-foreground'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex-shrink-0 ${opt === q.correct_answer ? 'bg-primary border-primary' : 'border-secondary'}`}></div>
                        {opt}
                      </div>
                    ))}
                  </div>
                  
                  <div className="pl-6 pt-3 mt-3 border-t border-secondary space-y-1">
                    <p className="text-sm text-secondary-foreground"><span className="font-bold text-foreground">Topic:</span> <span className="inline-block bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded ml-1">{q.topic_tag}</span></p>
                    <p className="text-sm text-secondary-foreground"><span className="font-bold text-foreground">Explanation:</span> {q.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-6">
              {!quizCode ? (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving to Database...
                    </span>
                  ) : (
                    "Save to Database & Get Quiz Code 🚀"
                  )}
                </button>
              ) : (
                <div className="bg-accent p-6 rounded-xl border border-accent text-center space-y-4">
                  <h3 className="text-2xl font-bold text-accent-foreground">Quiz Saved Successfully! 🎉</h3>
                  <p className="text-accent-foreground">Share this code with your students to let them take the quiz:</p>
                  <div className="bg-card text-4xl font-mono font-black tracking-widest text-foreground p-4 rounded-lg border-2 border-dashed border-primary inline-block select-all cursor-pointer">
                    {quizCode}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}