"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CreateQuizPage() {
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
    
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
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
    <div className="max-w-4xl mx-auto p-6 space-y-8 font-sans">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create a New Quiz</h1>
        <p className="text-gray-500">Upload a PDF of your lesson material below, and our AI will generate a 5-question quiz instantly.</p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* PDF Upload Area */}
        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative ${fileName ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50 bg-white'}`}>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Upload PDF"
          />
          <div className="space-y-2 pointer-events-none">
            <svg className={`mx-auto h-12 w-12 ${fileName ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-700 font-medium">
              {fileName ? (
                <span className="text-blue-700">Selected: {fileName}</span>
              ) : (
                "Drag and drop a PDF document, or click to browse"
              )}
            </p>
            {!fileName && <p className="text-sm text-gray-500">Supports text, scanned images, and charts.</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !selectedFile}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-sm"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
          {error}
        </div>
      )}
      {/* Preview Section */}
      {generatedQuiz && (
        <div className="mt-8 p-6 bg-white border border-gray-200 rounded-xl shadow-md space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800">{generatedQuiz.title}</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Preview Mode</span>
          </div>
          
          <div className="space-y-8">
            {generatedQuiz.questions.map((q: any, i: number) => (
              <div key={i} className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="font-semibold text-gray-900 text-lg">
                  {q.text}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                  {q.options.map((opt: string, j: number) => (
                    <div 
                      key={j} 
                      className={`p-3 rounded-lg border text-sm flex items-center gap-3 ${
                        opt === q.correct_answer 
                          ? 'bg-green-50 border-green-300 text-green-800 font-medium' 
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex-shrink-0 ${opt === q.correct_answer ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}></div>
                      {opt}
                    </div>
                  ))}
                </div>
                
                <div className="pl-6 pt-3 mt-3 border-t border-gray-200 space-y-1">
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">Topic:</span> <span className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded ml-1">{q.topic_tag}</span></p>
                  <p className="text-sm text-gray-600"><span className="font-bold text-gray-800">Explanation:</span> {q.explanation}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-6">
            {!quizCode ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center space-y-4">
                <h3 className="text-2xl font-bold text-green-800">Quiz Saved Successfully! 🎉</h3>
                <p className="text-green-700">Share this code with your students to let them take the quiz:</p>
                <div className="bg-white text-4xl font-mono font-black tracking-widest text-gray-800 p-4 rounded-lg border-2 border-dashed border-green-300 inline-block select-all cursor-pointer">
                  {quizCode}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}