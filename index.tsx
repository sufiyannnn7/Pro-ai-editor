
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// Constants
const MODEL_NAME = 'gemini-2.5-flash-image';
const SYSTEM_INSTRUCTION = `
You are a professional high-end photo retoucher. 
Strictly follow these rules:
1. Preserve facial identity: Do NOT change the structure of eyes, nose, lips, or face shape.
2. Enhance aesthetics: Improve lighting, color balance, skin tone clarity, and overall professional quality.
3. Handle the user request: [USER_REQUEST].
4. Output: Return the modified image as the primary part of the response.
`;

const App = () => {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({ language: 'English', goal: 'Natural enhancement' });
  const [image, setImage] = useState(null);
  const [mimeType, setMimeType] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError({ title: "File too large", message: "Please upload an image smaller than 10MB." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setMimeType(file.type);
        setStep(3);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = image.split(',')[1];
      
      const finalPrompt = SYSTEM_INSTRUCTION.replace('[USER_REQUEST]', prompt);

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: finalPrompt }
          ]
        }
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("EMPTY_RESPONSE");
      }

      let generatedImage = null;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (generatedImage) {
        setResult(generatedImage);
        setStep(4);
      } else {
        // Handle cases where AI returns text explaining a safety block
        const textPart = response.candidates[0].content.parts.find(p => p.text);
        if (textPart) {
          throw new Error(`SAFETY_BLOCK: ${textPart.text}`);
        }
        throw new Error("NO_IMAGE_DATA");
      }
    } catch (err) {
      console.error("AI Error:", err);
      let errorDetails = { title: "Processing Failed", message: "An unexpected error occurred." };

      if (err.message.includes("SAFETY_BLOCK")) {
        errorDetails = { 
          title: "Privacy Filter Active", 
          message: "The AI declined to edit this image to protect privacy or safety. Try an image with clearer lighting or a more neutral background." 
        };
      } else if (err.message.includes("429")) {
        errorDetails = { 
          title: "Too Many Requests", 
          message: "We're experiencing high traffic. Please wait a moment and try again." 
        };
      } else if (err.message.includes("API_KEY")) {
        errorDetails = { 
          title: "Configuration Error", 
          message: "The API key is missing or invalid. Please check your environment variables." 
        };
      } else if (err.message === "EMPTY_RESPONSE") {
        errorDetails = {
          title: "No Result",
          message: "The AI didn't return a result. Try adjusting your description."
        };
      }

      setError(errorDetails);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-12">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
            <i className="fa-solid fa-wand-sparkles text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">ProAI Editor</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity Secure Mode</p>
            </div>
          </div>
        </div>
        {step > 1 && step < 4 && (
          <button onClick={() => setStep(step - 1)} className="text-slate-400 hover:text-indigo-600 transition-colors font-bold text-sm flex items-center gap-2">
            <i className="fa-solid fa-arrow-left"></i> Back
          </button>
        )}
      </header>

      <main className="w-full max-w-2xl fade-in">
        {/* Step 1: Preferences */}
        {step === 1 && (
          <div className="glass-panel rounded-[2.5rem] p-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Refine Your Style</h2>
            <p className="text-slate-500 mb-8">Personalize how the AI approaches your photos.</p>
            
            <div className="space-y-8">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 block">Preferred Language</label>
                <div className="flex gap-3">
                  {['English', 'Hindi', 'Spanish'].map(l => (
                    <button 
                      key={l}
                      onClick={() => setPreferences({...preferences, language: l})}
                      className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${preferences.language === l ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-100 hover:border-indigo-200'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 block">Aesthetic Goal</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {id: 'Natural', icon: 'fa-leaf', desc: 'Subtle light & tone fixes'},
                    {id: 'Professional', icon: 'fa-user-tie', desc: 'Studio-quality polishing'}
                  ].map(g => (
                    <button 
                      key={g.id}
                      onClick={() => setPreferences({...preferences, goal: g.id})}
                      className={`p-6 rounded-3xl border-2 text-left transition-all flex items-start gap-4 ${preferences.goal === g.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${preferences.goal === g.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <i className={`fa-solid ${g.icon}`}></i>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{g.id}</p>
                        <p className="text-xs text-slate-500 mt-1">{g.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3">
                Continue to Upload <i className="fa-solid fa-chevron-right text-sm"></i>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload */}
        {step === 2 && (
          <div className="glass-panel rounded-[2.5rem] p-10 text-center">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Upload Photo</h2>
            <p className="text-slate-500 mb-8">Choose a portrait to enhance professionally.</p>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
            
            <button 
              onClick={() => fileInputRef.current.click()}
              className="w-full border-4 border-dashed border-slate-100 rounded-[2.5rem] p-12 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
            >
              <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-plus text-2xl"></i>
              </div>
              <p className="font-bold text-slate-700">Click to Browse</p>
              <p className="text-xs text-slate-400 mt-2">Maximum file size 10MB</p>
            </button>
          </div>
        )}

        {/* Step 3: Description */}
        {step === 3 && (
          <div className="glass-panel rounded-[2.5rem] p-10">
            <div className="flex gap-6 items-start mb-8">
              <div className="w-1/3 aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                <img src={image} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Editing Plan</h2>
                <p className="text-sm text-slate-500">Describe what you want to improve.</p>
              </div>
            </div>

            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Make the lighting warmer, sharpen the eyes, and fix the skin tone naturally..."
              className="w-full h-40 bg-white border border-slate-100 rounded-3xl p-6 text-slate-700 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all resize-none font-medium mb-6"
            />

            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 flex gap-4 items-start fade-in">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-circle-exclamation"></i>
                </div>
                <div>
                  <p className="font-bold text-rose-800 text-sm">{error.title}</p>
                  <p className="text-rose-600 text-xs mt-1">{error.message}</p>
                </div>
              </div>
            )}

            <button 
              onClick={processImage}
              disabled={loading || prompt.length < 5}
              className={`w-full py-5 rounded-3xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-3 ${loading || prompt.length < 5 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
            >
              {loading ? (
                <><i className="fa-solid fa-circle-notch animate-spin"></i> AI Processing...</>
              ) : (
                <><i className="fa-solid fa-wand-magic-sparkles"></i> Apply Enhancements</>
              )}
            </button>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 4 && (
          <div className="glass-panel rounded-[2.5rem] p-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Enhancement Complete</h2>
            <p className="text-slate-500 mb-8">Professional results while preserving your natural identity.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Original</span>
                <div className="aspect-square rounded-3xl overflow-hidden border-2 border-slate-100 grayscale-[0.5] opacity-80">
                  <img src={image} className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-2 ml-1">Enhanced Result</span>
                <div className="aspect-square rounded-3xl overflow-hidden border-4 border-white shadow-2xl relative group">
                  <img src={result} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    Pro Edit
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-white border border-slate-200 text-slate-600 py-5 rounded-3xl font-bold hover:bg-slate-50 transition-all">
                New Photo
              </button>
              <a 
                href={result} 
                download="pro-enhanced-photo.png"
                className="flex-[2] bg-slate-900 text-white py-5 rounded-3xl font-bold text-center hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
              >
                Download HD <i className="fa-solid fa-download"></i>
              </a>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-12 text-center text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest">
          <i className="fa-solid fa-shield-halved text-emerald-500"></i> Identity Protection Enabled
        </div>
        <p className="text-[10px]">Powered by Google Gemini 2.5 Flash • Professional Retouching Engine</p>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
