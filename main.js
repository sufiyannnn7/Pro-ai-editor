
import { GoogleGenAI } from 'https://esm.sh/@google/genai';

// --- CONFIGURATION ---
const API_KEY = "AIzaSyCDIbD4ay8qslsl6cThrGnjBKuGkBiXP7w";
const MODEL_NAME = "gemini-2.5-flash-image";

const SYSTEM_PROMPT = `
Act as a professional high-end photo retoucher.
Instruction: [REQUEST]
Context: [GOAL]
STRICT RULES:
1. Do NOT change facial geometry, eyes, nose, or lips structure.
2. Enhance skin tones, lighting, and clarity only.
3. Keep the identity 100% recognizable.
4. Return ONLY the edited image as the result.
`;

// --- STATE ---
let state = {
    step: 1,
    language: "English",
    goal: "Natural enhancement",
    image: null,
    mimeType: null,
    description: ""
};

// --- DOM HELPERS ---
const getEl = id => document.getElementById(id);
const ui = {
    steps: [getEl('step-1'), getEl('step-2'), getEl('step-3'), getEl('step-4')],
    langBtns: document.querySelectorAll('.lang-btn'),
    goalBtns: document.querySelectorAll('.goal-btn'),
    toStep2: getEl('to-step-2'),
    toStep3: getEl('to-step-3'),
    fileInput: getEl('file-input'),
    preview: getEl('image-preview'),
    previewContainer: getEl('image-preview-container'),
    placeholder: getEl('upload-placeholder'),
    promptInput: getEl('prompt-input'),
    processBtn: getEl('process-btn'),
    btnContent: getEl('btn-content'),
    btnLoading: getEl('btn-loading'),
    errorContainer: getEl('error-container'),
    errorTitle: getEl('error-title'),
    errorText: getEl('error-text'),
    finalResult: getEl('final-result'),
    downloadLink: getEl('download-link'),
    newImageBtn: getEl('new-image-btn'),
    backBtns: document.querySelectorAll('.back-btn')
};

// --- CORE LOGIC ---

function navigate(stepNum) {
    ui.steps.forEach((el, idx) => {
        if (idx + 1 === stepNum) {
            el.classList.remove('hidden-step');
        } else {
            el.classList.add('hidden-step');
        }
    });
    state.step = stepNum;
}

function handleError(err) {
    ui.errorContainer.classList.remove('hidden');
    console.error("AI Error:", err);
    
    let title = "Processing Error";
    let message = err.message || "An unexpected error occurred.";

    // Specific Gemini Error Handling
    if (message.includes("SAFETY")) {
        title = "Privacy Filter Active";
        message = "The AI declined to edit this specific image for safety reasons. This often happens if the image is blurry, contains sensitive content, or the face isn't clear enough.";
    } else if (message.includes("API key")) {
        title = "Key Configuration Issue";
        message = "The API key provided is invalid or expired. Please verify your Gemini API access.";
    } else if (message.includes("fetch")) {
        title = "Network Connection Lost";
        message = "We couldn't reach the AI servers. Check your internet connection and try again.";
    } else if (message.includes("quota")) {
        title = "Usage Limit Reached";
        message = "You have reached the free tier limit for Gemini. Please try again in a few minutes.";
    }

    ui.errorTitle.innerText = title;
    ui.errorText.innerText = message;
}

// --- LISTENERS ---

ui.langBtns.forEach(btn => {
    btn.onclick = () => {
        ui.langBtns.forEach(b => b.className = "lang-btn px-6 py-3 rounded-2xl text-sm font-bold transition-all bg-white text-slate-600 border border-slate-100");
        btn.className = "lang-btn px-6 py-3 rounded-2xl text-sm font-bold transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-200";
        state.language = btn.dataset.lang;
    };
});

ui.goalBtns.forEach(btn => {
    btn.onclick = () => {
        ui.goalBtns.forEach(b => {
            b.className = "goal-btn flex items-center gap-4 p-5 rounded-2xl text-left transition-all bg-white border-2 border-transparent hover:border-slate-100 shadow-sm";
            b.querySelector('i').className = b.querySelector('i').className.replace('text-indigo-600', 'text-slate-400');
            b.querySelector('span').className = "font-bold text-slate-600";
        });
        btn.className = "goal-btn flex items-center gap-4 p-5 rounded-2xl text-left transition-all bg-indigo-50 border-2 border-indigo-600";
        btn.querySelector('i').className = btn.querySelector('i').className.replace('text-slate-400', 'text-indigo-600');
        btn.querySelector('span').className = "font-bold text-indigo-900";
        state.goal = btn.dataset.goal;
    };
});

ui.toStep2.onclick = () => navigate(2);

ui.fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 10 * 1024 * 1024) {
            alert("File is too large! Please choose an image under 10MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            state.image = event.target.result;
            state.mimeType = file.type;
            ui.preview.src = state.image;
            ui.previewContainer.classList.remove('hidden');
            ui.placeholder.classList.add('hidden');
            ui.toStep3.disabled = false;
            ui.toStep3.className = "w-full mt-8 py-5 rounded-2xl font-bold text-lg bg-slate-900 text-white hover:bg-slate-800 shadow-xl";
        };
        reader.readAsDataURL(file);
    }
};

ui.toStep3.onclick = () => navigate(3);

ui.promptInput.oninput = (e) => {
    state.description = e.target.value;
    const isValid = state.description.trim().length >= 3;
    ui.processBtn.disabled = !isValid;
    ui.processBtn.className = isValid 
        ? "w-full py-5 rounded-2xl font-bold text-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100" 
        : "w-full py-5 rounded-2xl font-bold text-lg bg-slate-100 text-slate-300 cursor-not-allowed transition-all";
};

ui.processBtn.onclick = async () => {
    ui.btnContent.classList.add('hidden');
    ui.btnLoading.classList.remove('hidden');
    ui.errorContainer.classList.add('hidden');
    ui.processBtn.disabled = true;

    try {
        if (!API_KEY || API_KEY.startsWith("YOUR_")) {
            throw new Error("API key is not configured correctly.");
        }

        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const cleanBase64 = state.image.split(',')[1];
        
        const prompt = SYSTEM_PROMPT
            .replace("[REQUEST]", state.description)
            .replace("[GOAL]", state.goal);

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64, mimeType: state.mimeType } },
                    { text: prompt }
                ]
            }
        });

        const parts = response.candidates[0].content.parts;
        let finalImg = null;

        for (const p of parts) {
            if (p.inlineData) {
                finalImg = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
                break;
            }
        }

        if (finalImg) {
            ui.finalResult.src = finalImg;
            ui.downloadLink.href = finalImg;
            navigate(4);
        } else {
            throw new Error("SAFETY: The model produced a text response instead of an image. This usually indicates a safety content filter.");
        }

    } catch (err) {
        handleError(err);
    } finally {
        ui.btnContent.classList.remove('hidden');
        ui.btnLoading.classList.add('hidden');
        ui.processBtn.disabled = false;
    }
};

ui.backBtns.forEach(btn => btn.onclick = () => navigate(state.step - 1));
ui.newImageBtn.onclick = () => window.location.reload();
