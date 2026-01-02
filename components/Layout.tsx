
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <i className="fa-solid fa-camera-retro text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">ProAI Editor</h1>
            <p className="text-xs text-slate-500 font-medium">Professional Face-Safe Enhancement</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
          <i className="fa-solid fa-shield-halved text-emerald-500"></i>
          <span>Identity Protected</span>
        </div>
      </header>
      <main className="w-full max-w-2xl">
        {children}
      </main>
      <footer className="mt-auto py-8 text-slate-400 text-sm text-center">
        Powered by Gemini 2.5 Flash Image • AI Safety First
      </footer>
    </div>
  );
};
