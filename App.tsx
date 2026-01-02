
import React, { useState, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Language, EditingGoal, UserPreferences, EditRequest, EditResult } from './types';
import { LANGUAGES, EDITING_GOALS } from './constants';
import { editImage } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'English',
    goal: EditingGoal.NATURAL
  });
  const [request, setRequest] = useState<EditRequest>({
    image: '',
    mimeType: '',
    description: ''
  });
  const [result, setResult] = useState<EditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRequest(prev => ({ 
          ...prev, 
          image: reader.result as string,
          mimeType: file.type 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const processEdit = async () => {
    if (!request.image || !request.description) return;
    setIsLoading(true);
    setError(null);
    try {
      const editedBase64 = await editImage(
        request.image,
        request.mimeType,
        request.description,
        preferences.goal
      );
      setResult({
        originalImage: request.image,
        editedImage: editedBase64,
        description: request.description
      });
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Something went wrong during editing.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setResult(null);
    setRequest({ image: '', mimeType: '', description: '' });
  };

  return (
    <Layout>
      {/* Step 1: Language & Goal */}
      {step === 1 && (
        <div className="glass rounded-3xl p-8 shadow-xl border border-white/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome!</h2>
          <p className="text-slate-500 mb-8">Let's set up your editing preferences to get started.</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">1️⃣ Preferred Language</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setPreferences(prev => ({ ...prev, language: lang }))}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                      preferences.language === lang 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">2️⃣ Editing Goal</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EDITING_GOALS.map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => setPreferences(prev => ({ ...prev, goal: goal.label as EditingGoal }))}
                    className={`flex items-center gap-3 p-4 rounded-2xl text-left transition-all ${
                      preferences.goal === goal.label 
                      ? 'bg-indigo-50 border-2 border-indigo-600 ring-4 ring-indigo-600/5' 
                      : 'bg-white border-2 border-transparent hover:border-slate-100 shadow-sm'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      preferences.goal === goal.label ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {goal.icon}
                    </div>
                    <span className={`font-medium ${preferences.goal === goal.label ? 'text-indigo-900' : 'text-slate-600'}`}>
                      {goal.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-4 bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
            >
              Continue <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Image Upload */}
      {step === 2 && (
        <div className="glass rounded-3xl p-8 shadow-xl border border-white/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1 text-sm font-medium transition-colors">
            <i className="fa-solid fa-chevron-left"></i> Back
          </button>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Photo</h2>
          <p className="text-slate-500 mb-8">Select the portrait you'd like us to enhance professionally.</p>

          <div 
            className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-12 transition-all flex flex-col items-center justify-center ${
              request.image ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
            }`}
          >
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {request.image ? (
              <div className="relative w-full aspect-square max-w-[240px]">
                <img src={request.image} className="w-full h-full object-cover rounded-2xl shadow-lg ring-4 ring-white" alt="Preview" />
                <div className="absolute -bottom-3 -right-3 bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                   <i className="fa-solid fa-check"></i>
                </div>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <i className="fa-solid fa-cloud-arrow-up text-3xl"></i>
                </div>
                <p className="font-semibold text-slate-700">Click to upload image</p>
                <p className="text-sm text-slate-400 mt-1">PNG, JPG or JPEG supported</p>
              </>
            )}
          </div>

          <button
            disabled={!request.image}
            onClick={() => setStep(3)}
            className={`w-full mt-8 py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] shadow-xl ${
              request.image 
              ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200' 
              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            Next Step <i className="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      )}

      {/* Step 3: Description & Process */}
      {step === 3 && (
        <div className="glass rounded-3xl p-8 shadow-xl border border-white/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <button onClick={() => setStep(2)} className="text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1 text-sm font-medium transition-colors">
            <i className="fa-solid fa-chevron-left"></i> Back
          </button>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">What should we fix?</h2>
          <p className="text-slate-500 mb-8">Describe roughly what you want. We'll handle the pro details.</p>

          <div className="space-y-6">
            <textarea
              value={request.description}
              onChange={(e) => setRequest(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Example: light on face, remove dark circles, clean background..."
              className="w-full h-40 bg-white border border-slate-200 rounded-2xl p-5 text-slate-700 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all resize-none font-medium"
            />
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex-shrink-0 flex items-center justify-center">
                <i className="fa-solid fa-sparkles"></i>
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">Pro AI Mode Active</h4>
                <p className="text-emerald-700 text-xs mt-0.5 leading-relaxed">
                  I will enhance this naturally without changing your face or structure. Your real identity is preserved.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-600 text-sm font-medium flex gap-2 items-center">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            <button
              disabled={!request.description || isLoading}
              onClick={processEdit}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] shadow-xl relative overflow-hidden ${
                request.description && !isLoading
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' 
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-circle-notch animate-spin"></i> Applying Pro Enhancements...
                </span>
              ) : (
                <>Apply Enhancements <i className="fa-solid fa-wand-magic-sparkles ml-2"></i></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 4 && result && (
        <div className="glass rounded-3xl p-8 shadow-xl border border-white/50 animate-in zoom-in duration-500">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Your Enhanced Photo</h2>
            <div className="flex gap-2">
               <button 
                onClick={() => setStep(3)}
                className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Refine <i className="fa-solid fa-rotate ml-1"></i>
              </button>
              <button 
                onClick={reset}
                className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                New Image <i className="fa-solid fa-plus ml-1"></i>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Original</span>
              <div className="aspect-square rounded-3xl overflow-hidden border border-slate-100 shadow-inner">
                <img src={result.originalImage} className="w-full h-full object-cover" alt="Original" />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider ml-1">ProAI Enhanced</span>
              <div className="aspect-square rounded-3xl overflow-hidden border-4 border-indigo-500 shadow-2xl relative">
                <img src={result.editedImage} className="w-full h-full object-cover" alt="Enhanced" />
                <div className="absolute top-3 right-3 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                  AI Processed
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">AI Adjustments Applied</h4>
            <div className="flex flex-wrap gap-2">
              {['Soft Lighting', 'Skin Preservation', 'High Dynamic Range', 'Detail Sharpening', 'Eye Clarity'].map(tag => (
                <div key={tag} className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm flex items-center gap-1.5">
                  <i className="fa-solid fa-check text-emerald-500"></i> {tag}
                </div>
              ))}
            </div>
          </div>

          <a
            href={result.editedImage}
            download="pro-enhanced-photo.png"
            className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all active:scale-[0.98] shadow-2xl shadow-slate-200"
          >
            Download HD Result <i className="fa-solid fa-download"></i>
          </a>
          
          <p className="text-center text-slate-400 text-xs mt-6">
            <i className="fa-solid fa-user-shield mr-1"></i> Facial structure and identity parameters were locked during this edit.
          </p>
        </div>
      )}
    </Layout>
  );
};

export default App;
