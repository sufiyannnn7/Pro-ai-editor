
import { GoogleGenAI } from "@google/genai";

// Configuration
const API_KEY = process.env.API_KEY;
const MODEL_NAME = 'gemini-3-flash-preview'; // Using stable flash for speed and reliability

const SYSTEM_PROMPT = `
Act as a professional high-end photo retoucher.
Strict Rules:
1. PRESERVE IDENTITY: Do NOT change facial structure, features, or identity.
2. ENHANCE: Improve lighting, skin tone, clarity, and professionalism.
3. CONTEXT: User wants: [USER_PROMPT].
4. OUTPUT: Return the primary edited image.
`;

// App State
const state = {
    step: 1,
    language: 'English',
    goal: 'natural',
    image: null,
    mimeType: null,
    loading: false
};

// UI Elements
const ui = {
    steps: [1, 2, 3, 4].map(n => document.getElementById(`step-${n}`)),
    langBtns: document.querySelectorAll('#lang-selector button'),
    goalBtns: document.querySelectorAll('#goal-selector button'),
    nextTo2: document.getElementById('next-to-2'),
    backBtns: document.querySelectorAll('.back-btn'),
    uploadTrigger: document.getElementById('upload-trigger'),
    fileInput: document.getElementById('file-input'),
    imagePreview: document.getElementById('image-preview'),
    promptInput: document.getElementById('prompt-input'),
    processBtn: document.getElementById('process-btn'),
    errorBox: document.getElementById('processing-error'),
    errorTitle: document.getElementById('error-title'),
    errorMsg: document.getElementById('error-msg'),
    finalResult: document.getElementById('final-result'),
    downloadBtn: document.getElementById('download-btn'),
    resetBtn: document.getElementById('reset-btn'),
    apiError: document.getElementById('api-error-overlay'),
    btnText: document.getElementById('btn-text'),
    btnIcon: document.getElementById('btn-icon')
};

// Navigation
function navigateTo(stepNum) {
    ui.steps.forEach((el, idx) => {
        if (idx + 1 === stepNum) el.classList.remove('step-hidden');
        else el.classList.add('step-hidden');
    });
    state.step = stepNum;
}

// Validation
function validateConfig() {
    if (!API_KEY || API_KEY.trim() === "") {
        ui.apiError.classList.remove('hidden');
        return false;
    }
    return true;
}

// Helpers
function showError(title, msg) {
    ui.errorBox.classList.remove('hidden');
    ui.errorTitle.innerText = title;
    ui.errorMsg.innerText = msg;
    console.error(`[AI Error] ${title}: ${msg}`);
}

async function processImage() {
    if (!validateConfig()) return;
    
    const prompt = ui.promptInput.value.trim();
    if (prompt.length < 3) {
        showError("Invalid Input", "Please provide a brief description of what to edit.");
        return;
    }

    state.loading = true;
    ui.processBtn.disabled = true;
    ui.btnText.innerText = "Retouching...";
    ui.btnIcon.className = "fa-solid fa-circle-notch animate-spin";
    ui.errorBox.classList.add('hidden');

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const cleanBase64 = state.image.split(',')[1];
        const finalPrompt = SYSTEM_PROMPT.replace('[USER_PROMPT]', prompt);

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64, mimeType: state.mimeType } },
                    { text: finalPrompt }
                ]
            }
        });

        if (!response.candidates?.[0]?.content?.parts) {
            throw new Error("EMPTY_RESPONSE");
        }

        let resultImage = null;
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
            }
        }

        if (resultImage) {
            ui.finalResult.src = resultImage;
            ui.downloadBtn.href = resultImage;
            navigateTo(4);
        } else {
            // Check for textual safety feedback
            const textPart = response.candidates[0].content.parts.find(p => p.text);
            if (textPart) throw new Error(`SAFETY: ${textPart.text}`);
            throw new Error("NO_IMAGE_DATA");
        }

    } catch (err) {
        let title = "Editing Failed";
        let msg = "An unexpected error occurred. Please try again.";

        const errStr = err.toString().toUpperCase();
        if (errStr.includes("SAFETY")) {
            title = "Safety Filter";
            msg = "The AI declined this edit for safety or privacy reasons. Try a clearer image.";
        } else if (errStr.includes("429")) {
            title = "Busy Server";
            msg = "Limit reached. Please wait 60 seconds and try again.";
        } else if (errStr.includes("NETWORK")) {
            title = "Connection Lost";
            msg = "Please check your internet connection.";
        }

        showError(title, msg);
    } finally {
        state.loading = false;
        ui.processBtn.disabled = false;
        ui.btnText.innerText = "Apply Enhancements";
        ui.btnIcon.className = "fa-solid fa-wand-magic-sparkles";
    }
}

// Listeners
ui.langBtns.forEach(btn => {
    btn.onclick = () => {
        ui.langBtns.forEach(b => b.className = "px-6 py-3 rounded-2xl text-sm font-bold transition-all bg-white text-slate-600 border border-slate-100 hover:bg-slate-50");
        btn.className = "px-6 py-3 rounded-2xl text-sm font-bold transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-100";
        state.language = btn.dataset.lang;
    };
});

ui.goalBtns.forEach(btn => {
    btn.onclick = () => {
        ui.goalBtns.forEach(b => {
            b.className = "p-6 rounded-3xl border-2 text-left transition-all flex items-start gap-4 border-slate-100 bg-white hover:border-indigo-200";
            b.querySelector('div').className = "w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center text-xl";
        });
        btn.className = "p-6 rounded-3xl border-2 text-left transition-all flex items-start gap-4 border-indigo-600 bg-indigo-50/50";
        btn.querySelector('div').className = "w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl";
        state.goal = btn.dataset.goal;
    };
});

ui.nextTo2.onclick = () => navigateTo(2);
ui.backBtns.forEach(btn => btn.onclick = () => navigateTo(state.step - 1));
ui.uploadTrigger.onclick = () => ui.fileInput.click();

ui.fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 10 * 1024 * 1024) {
            alert("File too large. Max 10MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            state.image = ev.target.result;
            state.mimeType = file.type;
            ui.imagePreview.src = state.image;
            navigateTo(3);
        };
        reader.readAsDataURL(file);
    }
};

ui.processBtn.onclick = processImage;
ui.resetBtn.onclick = () => {
    state.image = null;
    ui.fileInput.value = "";
    ui.promptInput.value = "";
    navigateTo(1);
};

// Initial Setup
validateConfig();
