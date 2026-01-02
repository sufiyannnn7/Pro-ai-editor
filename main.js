
import { GoogleGenAI } from 'https://esm.sh/@google/genai';

// --- CONFIGURATION ---
const API_KEY = "AIzaSyCDIbD4ay8qslsl6cThrGnjBKuGkBiXP7w";
const MODEL_NAME = "gemini-2.5-flash-image";

const SYSTEM_PROMPT = `
Act as a professional high-end photo retoucher.
Identity preservation is MANDATORY: Do NOT change face shape, eyes, or nose structure.
Enhance lighting, skin tone clarity, and overall professional aesthetic.
Return ONLY the modified image.
Goal context: [GOAL]
User instruction: [REQUEST]
`;

// --- STATE MANAGEMENT ---
let currentState = {
    step: 1,
    language: "English",
    goal: "Natural enhancement",
    image: null,
    mimeType: null,
    description: ""
};

// --- UI ELEMENTS ---
const elements = {
    steps: [
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3'),
        document.getElementById('step-4')
    ],
    langBtns: document.querySelectorAll('.lang-btn'),
    goalBtns: document.querySelectorAll('.goal-btn'),
    toStep2: document.getElementById('to-step-2'),
    toStep3: document.getElementById('to-step-3'),
    fileInput: document.getElementById('file-input'),
    preview: document.getElementById('image-preview'),
    previewContainer: document.getElementById('image-preview-container'),
    placeholder: document.getElementById('upload-placeholder'),
    promptInput: document.getElementById('prompt-input'),
    processBtn: document.getElementById('process-btn'),
    btnContent: document.getElementById('btn-content'),
    btnLoading: document.getElementById('btn-loading'),
    errorMsg: document.getElementById('error-msg'),
    errorText: document.getElementById('error-text'),
    finalOriginal: document.getElementById('final-original'),
    finalResult: document.getElementById('final-result'),
    downloadLink: document.getElementById('download-link'),
    newImageBtn: document.getElementById('new-image-btn'),
    backBtns: document.querySelectorAll('.back-btn')
};

// --- NAVIGATION ---
function showStep(stepNum) {
    elements.steps.forEach((el, idx) => {
        if (idx + 1 === stepNum) {
            el.classList.remove('hidden-step');
            el.style.display = 'block';
            setTimeout(() => el.style.opacity = '1', 10);
        } else {
            el.classList.add('hidden-step');
            el.style.display = 'none';
        }
    });
    currentState.step = stepNum;
}

// --- EVENT HANDLERS ---

// Step 1: Selection
elements.langBtns.forEach(btn => {
    btn.onclick = () => {
        elements.langBtns.forEach(b => b.className = "lang-btn px-5 py-2.5 rounded-full text-sm font-medium transition-all bg-white text-slate-600 border border-slate-100");
        btn.className = "lang-btn px-5 py-2.5 rounded-full text-sm font-medium transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105";
        currentState.language = btn.dataset.lang;
    };
});

elements.goalBtns.forEach(btn => {
    btn.onclick = () => {
        elements.goalBtns.forEach(b => {
            b.className = "goal-btn flex items-center gap-3 p-4 rounded-2xl text-left transition-all bg-white border-2 border-transparent hover:border-slate-100 shadow-sm";
            b.querySelector('div').className = "w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-slate-100 text-slate-400";
            b.querySelector('span').className = "font-medium text-slate-600";
        });
        btn.className = "goal-btn flex items-center gap-3 p-4 rounded-2xl text-left transition-all bg-indigo-50 border-2 border-indigo-600 ring-4 ring-indigo-600/5";
        btn.querySelector('div').className = "w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-indigo-600 text-white";
        btn.querySelector('span').className = "font-medium text-indigo-900";
        currentState.goal = btn.dataset.goal;
    };
});

elements.toStep2.onclick = () => showStep(2);

// Step 2: Upload
elements.fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            currentState.image = event.target.result;
            currentState.mimeType = file.type;
            elements.preview.src = currentState.image;
            elements.previewContainer.classList.remove('hidden');
            elements.placeholder.classList.add('hidden');
            elements.toStep3.disabled = false;
            elements.toStep3.className = "w-full mt-8 py-4 rounded-2xl font-bold text-lg bg-slate-900 text-white hover:bg-slate-800 shadow-xl transition-all";
        };
        reader.readAsDataURL(file);
    }
};

elements.toStep3.onclick = () => showStep(3);

// Step 3: Prompt & API
elements.promptInput.oninput = (e) => {
    currentState.description = e.target.value;
    const canProcess = currentState.description.trim().length > 2;
    elements.processBtn.disabled = !canProcess;
    if (canProcess) {
        elements.processBtn.className = "w-full py-4 rounded-2xl font-bold text-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 transition-all active:scale-[0.98]";
    } else {
        elements.processBtn.className = "w-full py-4 rounded-2xl font-bold text-lg bg-slate-100 text-slate-300 cursor-not-allowed";
    }
};

async function callGemini() {
    elements.btnContent.classList.add('hidden');
    elements.btnLoading.classList.remove('hidden');
    elements.errorMsg.classList.add('hidden');
    elements.processBtn.disabled = true;

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const finalPrompt = SYSTEM_PROMPT
            .replace("[GOAL]", currentState.goal)
            .replace("[REQUEST]", currentState.description);

        const imageBase64 = currentState.image.split(',')[1];
        
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                parts: [
                    { inlineData: { data: imageBase64, mimeType: currentState.mimeType } },
                    { text: finalPrompt }
                ]
            }
        });

        const parts = response.candidates[0].content.parts;
        let resultImage = null;

        for (const part of parts) {
            if (part.inlineData) {
                resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
            }
        }

        if (resultImage) {
            elements.finalOriginal.src = currentState.image;
            elements.finalResult.src = resultImage;
            elements.downloadLink.href = resultImage;
            showStep(4);
        } else {
            throw new Error("The AI didn't return a new image. Try being more specific!");
        }

    } catch (err) {
        console.error(err);
        elements.errorText.innerText = err.message || "Something went wrong. Please check your connection or try again.";
        elements.errorMsg.classList.remove('hidden');
    } finally {
        elements.btnContent.classList.remove('hidden');
        elements.btnLoading.classList.add('hidden');
        elements.processBtn.disabled = false;
    }
}

elements.processBtn.onclick = callGemini;

// Global Actions
elements.backBtns.forEach(btn => {
    btn.onclick = () => showStep(currentState.step - 1);
});

elements.newImageBtn.onclick = () => {
    window.location.reload();
};
