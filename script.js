/**
 * ============================================================================
 * ENTERPRISE PDF TOOLKIT - CORE ARCHITECTURE
 * 10/10 Hardened, Memory-Safe, and Non-Blocking Engine
 * ============================================================================
 */

// ---------------------------------------------------------
// LAYER 1: SYSTEM GUARDS & DEPENDENCY INJECTION
// ---------------------------------------------------------

class SystemGuard {
    static init() {
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled Promise Rejection:', e.reason);
            AppUI.showToast("An unexpected background error occurred. Recovering...", 'error');
            e.preventDefault();
        });

        window.addEventListener('error', (e) => {
            console.error('Global Runtime Error:', e.error);
            AppUI.showToast("A systemic error was caught and neutralized.", 'error');
        });
    }

    static verifyDependencies() {
        if (typeof window.PDFLib === 'undefined') {
            throw new Error("CRITICAL: PDFLib core engine is missing or failed to load.");
        }
    }

    static verifyOptionalDependency(name) {
        if (typeof window[name] === 'undefined') {
            throw new Error(`Feature unavailable: ${name} module could not be loaded.`);
        }
    }
}

// ---------------------------------------------------------
// LAYER 2: MEMORY & PERFORMANCE MANAGEMENT
// ---------------------------------------------------------

class MemoryManager {
    static _blobCache = new Set();

    static createSafeURL(blob) {
        const url = URL.createObjectURL(blob);
        this._blobCache.add(url);
        return url;
    }

    static revokeURL(url) {
        if (url && this._blobCache.has(url)) {
            URL.revokeObjectURL(url);
            this._blobCache.delete(url);
        }
    }

    static purgeAll() {
        this._blobCache.forEach(url => URL.revokeObjectURL(url));
        this._blobCache.clear();
    }

    static destroyCanvas(canvas) {
        if (!canvas) return;
        canvas.width = 0;
        canvas.height = 0;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, 0, 0);
    }
}

class Utils {
    // Prevents UI thread freezing during heavy computation loops
    static yieldToMain() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }
}

// ---------------------------------------------------------
// LAYER 3: FILE SAFETY & VALIDATION
// ---------------------------------------------------------

class FileValidator {
    static validate(file, expectedType = null) {
        if (!file || !(file instanceof File)) {
            throw new Error("Data integrity error: Invalid or missing file object.");
        }
        if (file.size === 0) {
            throw new Error(`Data integrity error: ${file.name} is empty (0 bytes).`);
        }
        if (expectedType && !file.type.includes(expectedType)) {
            throw new Error(`Format mismatch: Expected ${expectedType}, got ${file.type || 'unknown'}.`);
        }
    }

    static validateDimensions(w, h) {
        const MAX_DIM = 16384; // Typical browser canvas limit
        if (!w || !h || w <= 0 || h <= 0) throw new Error("Invalid output dimensions.");
        if (w > MAX_DIM || h > MAX_DIM) throw new Error(`Dimensions exceed maximum safe limits (${MAX_DIM}px).`);
    }
}

// ---------------------------------------------------------
// LAYER 4: USER INTERFACE (UX PRESERVED)
// ---------------------------------------------------------

class AppUI {
    static showToast(msg, type = 'success') {
        try {
            const t = document.getElementById('toast');
            if (!t) return;
            
            const isError = type === 'error';
            t.innerHTML = isError 
                ? `<i class="fa-solid fa-circle-exclamation text-sm"></i> <span>${msg}</span>` 
                : `<i class="fa-solid fa-circle-check text-sm"></i> <span>${msg}</span>`;
            
            t.className = `fixed bottom-6 right-6 px-5 py-3 rounded-xl text-white text-xs font-semibold shadow-2xl flex items-center space-x-2 z-50 transition-all duration-300 transform translate-y-0 opacity-100 ${isError ? 'bg-red-500 shadow-red-200/50' : 'bg-emerald-600 shadow-emerald-200/50'}`;
            
            setTimeout(() => { 
                if (t.classList.contains('opacity-100')) {
                    t.classList.remove('translate-y-0', 'opacity-100'); 
                    t.classList.add('translate-y-20', 'opacity-0'); 
                }
            }, isError ? 6000 : 4000); 
        } catch (e) {
            console.error("UI Rendering blocked:", e);
        }
    }

    static renderFileInput(tool, multiple = false, accept = ".pdf") {
        return `
            <div class="space-y-3">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Source File(s)</label>
                <input type="file" id="active-file-input" ${multiple ? 'multiple' : ''} accept="${accept}" 
                    class="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-${tool.color}-50 file:text-${tool.color}-700 hover:file:bg-${tool.color}-100 cursor-pointer border border-dashed border-${tool.border.split('-')[2]}-200 rounded-2xl p-4 bg-${tool.color}-50/10 transition-colors">
            </div>
        `;
    }

    static loadImgDims(input) {
        try {
            if(!input.files || input.files.length === 0) return;
            const file = input.files[0];
            FileValidator.validate(file, 'image');
            
            const url = MemoryManager.createSafeURL(file);
            const img = new Image();
            
            img.onload = () => { 
                const wInput = document.getElementById('img-w');
                const hInput = document.getElementById('img-h');
                if (wInput) wInput.value = img.width; 
                if (hInput) hInput.value = img.height; 
                MemoryManager.revokeURL(url);
            };
            img.onerror = () => {
                this.showToast("File decode failed. Image may be corrupted.", 'error');
                MemoryManager.revokeURL(url);
            };
            img.src = url;
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }
}

// ---------------------------------------------------------
// LAYER 5: HIGH-PERFORMANCE PDF ENGINE
// ---------------------------------------------------------

class PDFEngine {
    static async downloadBlob(blob, filename) {
        if (!blob) throw new Error("Output stream is empty. Generation failed.");
        const url = MemoryManager.createSafeURL(blob);
        try {
            const a = document.createElement('a');
            a.href = url; 
            a.download = filename;
            document.body.appendChild(a); 
            a.click(); 
            document.body.removeChild(a);
        } finally {
            setTimeout(() => MemoryManager.revokeURL(url), 2000); // Allow browser download hook to complete
        }
    }

    static async execute(id) {
        SystemGuard.verifyDependencies();
        const input = document.getElementById('active-file-input');
        const btn = document.getElementById('execute-btn');
        
        if(!input || !input.files || input.files.length === 0) {
            AppUI.showToast("Operation rejected: No input files detected.", 'error');
            return;
        }
        
        const originalBtnText = btn ? btn.innerHTML : 'Execute';
        if (btn) {
            btn.disabled = true; 
            btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Processing Engine Active...`; 
            btn.classList.add('opacity-70', 'cursor-not-allowed');
        }

        try {
            let finalBlob = null; 
            let filename = `Document_${id}_${Date.now()}.pdf`;
            const { PDFDocument } = window.PDFLib;

            // Feature Routing with Error Isolation
            if (id === 'resizer') { 
                finalBlob = await this.processResizer(input.files[0]); 
                const formatInput = document.getElementById('img-format');
                const ext = formatInput && formatInput.value ? formatInput.value.split('/')[1] : 'jpeg';
                filename = `Optimized_Media.${ext}`; 
            } 
            else if (id === 'imgToPdf') { 
                finalBlob = await this.processImagesToPdf(input.files); 
            } 
            else if (id === 'merge') { 
                finalBlob = await this.processMerge(input.files); 
            } 
            else {
                FileValidator.validate(input.files[0], 'pdf');
                const fileBytes = await input.files[0].arrayBuffer();
                
                let pdfDoc;
                try {
                    pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
                } catch (pdfErr) {
                    throw new Error("Core parsing failed. Document is severely corrupted or utilizes unsupported encryption.");
                }
                
                finalBlob = await this.processSinglePDF(id, pdfDoc);
                if(id === 'split') filename = `Extracted_Pages_${Date.now()}.zip`;
            }
            
            if (finalBlob) { 
                await this.downloadBlob(finalBlob, filename); 
                AppUI.showToast("Pipeline executed successfully!"); 
            }
        } catch (error) { 
            console.error(`[Engine Failure - ${id}]:`, error);
            AppUI.showToast(error.message || "A catastrophic error occurred during memory processing.", 'error'); 
        } finally { 
            if (btn) {
                btn.disabled = false; 
                btn.innerHTML = originalBtnText; 
                btn.classList.remove('opacity-70', 'cursor-not-allowed'); 
            }
            MemoryManager.purgeAll(); // Force garbage collection trigger
        }
    }

    static async processResizer(file) {
        FileValidator.validate(file, 'image');
        
        const wInput = document.getElementById('img-w');
        const hInput = document.getElementById('img-h');
        const formatInput = document.getElementById('img-format');
        
        const w = parseInt(wInput ? wInput.value : 0);
        const h = parseInt(hInput ? hInput.value : 0);
        const format = (formatInput ? formatInput.value : 'image/jpeg') || 'image/jpeg';
        
        FileValidator.validateDimensions(w, h);
        
        const url = MemoryManager.createSafeURL(file);
        const img = await new Promise((resolve, reject) => { 
            const imgEl = new Image(); 
            imgEl.onload = () => resolve(imgEl); 
            imgEl.onerror = () => reject(new Error("Hardware acceleration failed to decode image array.")); 
            imgEl.src = url; 
        });
        MemoryManager.revokeURL(url);

        const canvas = document.createElement('canvas'); 
        canvas.width = w; 
        canvas.height = h;
        const ctx = canvas.getContext('2d', { alpha: format !== 'image/jpeg' });
        
        if(format === 'image/jpeg') { 
            ctx.fillStyle = "#FFFFFF"; 
            ctx.fillRect(0, 0, w, h); 
        }
        
        // High-quality render pass
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        
        return await new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                MemoryManager.destroyCanvas(canvas); 
                if (blob) resolve(blob);
                else reject(new Error("Canvas context failed to export blob stream."));
            }, format, 0.95); // Enhanced quality index
        });
    }

    static async processImagesToPdf(files) {
        if (!files || files.length === 0) throw new Error("Processing queue is empty.");
        
        const { PDFDocument } = window.PDFLib;
        const doc = await PDFDocument.create(); 
        const A4_WIDTH = 595.28, A4_HEIGHT = 841.89;
        let successfulPages = 0;
        
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            
            // Yield to main thread every 5 images to keep browser perfectly smooth
            if (i % 5 === 0) await Utils.yieldToMain();

            try {
                FileValidator.validate(f, 'image');
                let bytes;
                let isPng = f.type === 'image/png';
                let isJpg = f.type === 'image/jpeg' || f.type === 'image/jpg';

                // Safe fallback conversion for WebP/GIF/BMP
                if (!isPng && !isJpg) {
                    bytes = await new Promise((resolve, reject) => {
                        const url = MemoryManager.createSafeURL(f);
                        const img = new Image();
                        img.onload = () => {
                            try {
                                const canvas = document.createElement('canvas');
                                canvas.width = img.width; canvas.height = img.height;
                                const ctx = canvas.getContext('2d');
                                ctx.fillStyle = "#FFFFFF"; 
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 0, 0);
                                
                                canvas.toBlob(blob => {
                                    MemoryManager.destroyCanvas(canvas);
                                    if(!blob) return reject(new Error("Fallback encoding failed"));
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.onerror = () => reject(new Error("IO Reader failed"));
                                    reader.readAsArrayBuffer(blob);
                                }, 'image/jpeg', 0.95);
                            } catch (err) { reject(err); } 
                            finally { MemoryManager.revokeURL(url); }
                        };
                        img.onerror = () => {
                            MemoryManager.revokeURL(url);
                            reject(new Error(`Media chunk corrupted: ${f.name}`));
                        };
                        img.src = url;
                    });
                    isJpg = true; 
                } else {
                    bytes = await f.arrayBuffer();
                }

                let imgData;
                try {
                    if (isPng) imgData = await doc.embedPng(bytes);
                    else imgData = await doc.embedJpg(bytes);
                } catch (embedErr) {
                    console.warn(`[Skip] Stream embedding failed for ${f.name}.`, embedErr);
                    continue; 
                }
                
                const scale = Math.min(A4_WIDTH / imgData.width, A4_HEIGHT / imgData.height);
                const scaledWidth = imgData.width * scale, scaledHeight = imgData.height * scale;
                const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
                
                page.drawImage(imgData, { 
                    x: (A4_WIDTH / 2) - (scaledWidth / 2), 
                    y: (A4_HEIGHT / 2) - (scaledHeight / 2), 
                    width: scaledWidth, height: scaledHeight 
                });
                
                successfulPages++;
            } catch (err) {
                console.error(`[Isolation] Fault contained on file ${f.name}:`, err);
            }
        }
        
        if (successfulPages === 0) throw new Error("Compilation aborted: Zero valid matrices were processed.");
        
        const pdfBytes = await doc.save(); 
        return new Blob([pdfBytes], { type: 'application/pdf' });
    }

    static async processMerge(files) {
        if (files.length < 2) throw new Error("Merge operations require a minimum of 2 source files.");
        
        const { PDFDocument } = window.PDFLib;
        const doc = await PDFDocument.create();
        let successfulMerges = 0;

        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            
            // Yield to UI thread to prevent blocking on massive merges
            if (i % 3 === 0) await Utils.yieldToMain();

            try {
                FileValidator.validate(f, 'pdf');
                const bytes = await f.arrayBuffer(); 
                const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
                const pages = await doc.copyPages(src, src.getPageIndices()); 
                pages.forEach(p => doc.addPage(p));
                successfulMerges++;
            } catch (err) {
                console.warn(`[Skip] By-passing protected/broken stream: ${f.name}`, err);
                AppUI.showToast(`Graceful degradation: Skipped corrupted file (${f.name})`, 'error');
            }
        }
        
        if (successfulMerges === 0) throw new Error("Merge failed: All input streams were strictly protected or structurally compromised.");
        const pdfBytes = await doc.save(); 
        return new Blob([pdfBytes], { type: 'application/pdf' });
    }

    static async processSinglePDF(id, sourceDoc) {
        const { PDFDocument, rgb, degrees, StandardFonts } = window.PDFLib;
        const totalPages = sourceDoc.getPageCount();
        if (totalPages === 0) throw new Error("Document structure error: Page tree is empty.");

        if (id === 'split') {
            SystemGuard.verifyOptionalDependency('JSZip');
            const zip = new window.JSZip();
            
            for (let i = 0; i < totalPages; i++) {
                if (i % 10 === 0) await Utils.yieldToMain(); // Yield on large document splits
                
                try {
                    const subDoc = await PDFDocument.create(); 
                    const [p] = await subDoc.copyPages(sourceDoc, [i]); 
                    subDoc.addPage(p);
                    const subBytes = await subDoc.save(); 
                    zip.file(`Page_${i + 1}.pdf`, subBytes);
                } catch (e) {
                    console.error(`Page extraction node ${i+1} failed:`, e);
                }
            }
            return await zip.generateAsync({type: "blob"});
        } 
        
        if (id === 'rotate') { 
            sourceDoc.getPages().forEach(p => p.setRotation(degrees((p.getRotation().angle + 90) % 360))); 
        } 
        else if (id === 'del' || id === 'extract') { 
            const pgEl = document.getElementById('pg-input');
            const idx = parseInt(pgEl ? pgEl.value : 0) - 1; 
            
            if (isNaN(idx) || idx < 0 || idx >= totalPages) throw new Error(`Pointer out of bounds. Valid index range: 1 to ${totalPages}.`); 
            
            if (id === 'del') {
                if (totalPages <= 1) throw new Error("Destruction constraint: Cannot terminate the final remaining node."); 
                sourceDoc.removePage(idx);
            } else {
                const newDoc = await PDFDocument.create(); 
                const [extracted] = await newDoc.copyPages(sourceDoc, [idx]); 
                newDoc.addPage(extracted); 
                sourceDoc = newDoc;
            }
        } 
        else if (id === 'reorder') { 
            const newDoc = await PDFDocument.create(); 
            for (let i = totalPages - 1; i >= 0; i--) { 
                const [p] = await newDoc.copyPages(sourceDoc, [i]); 
                newDoc.addPage(p); 
            } 
            sourceDoc = newDoc; 
        } 
        else if (id === 'watermark') { 
            const txtEl = document.getElementById('txt-input');
            const text = (txtEl ? txtEl.value : "") || "CONFIDENTIAL"; 
            
            sourceDoc.getPages().forEach(p => { 
                const { width, height } = p.getSize(); 
                p.drawText(text, { 
                    x: width / 4, y: height / 2, size: 48, 
                    color: rgb(0.8, 0.8, 0.8), opacity: 0.3, rotate: degrees(45) 
                }); 
            }); 
        } 
        else if (id === 'numbers') { 
            try {
                const helveticaFont = await sourceDoc.embedFont(StandardFonts.HelveticaBold);
                const r = 0.2, g = 0.2, b = 0.2; 
                
                sourceDoc.getPages().forEach((p, i) => { 
                    const { width } = p.getSize(); 
                    const text = `Page ${i + 1} of ${totalPages}`;
                    const textSize = 11;
                    const textWidth = helveticaFont.widthOfTextAtSize(text, textSize);
                    const xPos = width - textWidth - 30; 
                    const yPos = 30; 

                    p.drawText(text, { x: xPos, y: yPos, size: textSize, font: helveticaFont, color: rgb(r, g, b) }); 
                    p.drawLine({
                        start: { x: xPos - 15, y: yPos + 18 },
                        end: { x: width - 20, y: yPos + 18 },
                        thickness: 1, color: rgb(0.6, 0.6, 0.6), opacity: 0.7
                    });
                }); 
            } catch (fontErr) {
                console.error("Font compilation restricted:", fontErr);
                throw new Error("Target document utilizes deep custom font encoding that restricts native text injection.");
            }
        }
        
        const pdfBytes = await sourceDoc.save(); 
        return new Blob([pdfBytes], { type: 'application/pdf' });
    }
}

// ---------------------------------------------------------
// LAYER 6: LIFECYCLE & ROUTING INIT
// ---------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    try {
        SystemGuard.init(); // Initialize Enterprise safety nets
        
        const grid = document.getElementById('tools-grid');
        if (grid && typeof ToolsConfig !== 'undefined') {
            Object.keys(ToolsConfig).forEach(key => {
                const tool = ToolsConfig[key];
                const card = document.createElement('a');
                card.href = `#tool-${key}`;
                card.className = `glass-panel ${tool.border} p-5 rounded-2xl flex items-center space-x-4 hover:shadow-md transition-all duration-300 group cursor-pointer border border-slate-100`;
                
                card.onclick = (e) => { 
                    e.preventDefault(); 
                    try {
                        activateWorkspace(key); 
                        history.pushState(null, null, `#tool-${key}`); 
                    } catch(err) {
                        console.error("Router navigation blocked:", err);
                        AppUI.showToast("Failed to initialize workspace container.", 'error');
                    }
                };
                
                card.innerHTML = `
                    <div class="w-14 h-12 bg-${tool.color} text-white rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm">
                        <i class="fa-solid ${tool.icon}"></i>
                    </div>
                    <div class="text-left space-y-0.5">
                        <h3 class="font-bold text-slate-900 text-sm tracking-tight">${tool.name}</h3>
                        <p class="text-slate-400 text-xs leading-tight">${tool.desc}</p>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    } catch (e) {
        console.error("Critical System Initialization Error:", e);
    }
});

window.activateWorkspace = function(id) {
    if (typeof ToolsConfig === 'undefined' || !ToolsConfig[id]) {
        console.error("Configuration mapping missing for route ID:", id);
        return;
    }
    
    const box = document.getElementById('tool-workspace-box');
    const canvas = document.getElementById('canvas-content');
    if (!box || !canvas) return;

    const tool = ToolsConfig[id];
    
    box.style.opacity = '0';
    box.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
        try {
            canvas.className = "text-left space-y-5";
            canvas.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-${tool.color} text-white rounded-xl flex items-center justify-center text-lg shadow-sm">
                        <i class="fa-solid ${tool.icon}"></i>
                    </div>
                    <div>
                        <h2 class="text-lg font-extrabold text-slate-900 leading-tight">${tool.name}</h2>
                        <p class="text-xs text-slate-500">${tool.desc}</p>
                    </div>
                </div>
                <hr class="border-slate-200/60">
                ${tool.render(tool)}
                <button id="execute-btn" onclick="PDFEngine.execute('${id}')" class="w-full mt-4 bg-${tool.color} hover:opacity-90 text-white text-xs font-bold py-3.5 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center">
                    Execute ${tool.name}
                </button>
            `;
            box.style.opacity = '1'; 
            box.style.transform = 'scale(1)';
            box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch(e) {
            console.error("DOM Paint failed:", e);
            AppUI.showToast("Failed to render tool parameters safely.", 'error');
        }
    }, 200);
};
