// --- Core Library Integrations ---
window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Expose PDFLib globally for dynamically loaded tools
window.PDFLibOptions = window.PDFLib || PDFLib;
const { PDFDocument, rgb, degrees } = window.PDFLibOptions;

// --- Global Application State ---
window.activeFiles = [];
window.currentToolId = null;

// --- DYNAMIC REGISTRY & LOADER ARCHITECTURE ---
window.ToolsRegistry = {};

class ToolManager {
    /**
     * Dynamically loads a tool's script based on its ID.
     * Assumes tool files are stored in a `/tools/` directory (e.g., /tools/image-resizer.js).
     */
    static async loadTool(toolId) {
        if (window.ToolsRegistry[toolId]) {
            return window.ToolsRegistry[toolId]; // Already loaded
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `./tools/${toolId}.js`; // Ensure this matches your directory structure
            
            script.onload = () => {
                if (window.ToolsRegistry[toolId]) {
                    resolve(window.ToolsRegistry[toolId]);
                } else {
                    reject(new Error(`Tool script loaded but failed to register ID: '${toolId}'.`));
                }
            };
            
            script.onerror = () => reject(new Error(`Failed to load tool script for: ${toolId}`));
            document.head.appendChild(script);
        });
    }
}

// --- GLOBAL UI MANAGER ---
class AppUI {
    static showToast(msg, type = 'success') {
        const t = document.getElementById('toast');
        const isError = type === 'error';
        t.innerHTML = isError 
            ? `<i class="fa-solid fa-circle-exclamation text-sm"></i> <span>${msg}</span>` 
            : `<i class="fa-solid fa-circle-check text-sm"></i> <span>${msg}</span>`;
        t.className = `fixed bottom-6 right-6 px-5 py-3 rounded-xl text-white text-xs font-semibold shadow-2xl flex items-center space-x-2 z-50 transition duration-300 transform translate-y-0 opacity-100 gpu-accelerate ${isError ? 'bg-red-500 shadow-red-200/50' : 'bg-emerald-600 shadow-emerald-200/50'}`;
        setTimeout(() => { t.classList.remove('translate-y-0', 'opacity-100'); t.classList.add('translate-y-20', 'opacity-0'); }, 4000);
    }

    static renderFileInput(tool, multiple = false, accept = ".pdf") {
        const cBase = tool.color.split('-')[0];
        return `
            <div class="space-y-3">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Source File(s)</label>
                <div id="drop-zone" class="relative w-full border-2 border-dashed border-${cBase}-300 rounded-2xl p-6 bg-${cBase}-50/50 transition-colors text-center hover:bg-${cBase}-100/60">
                    <input type="file" id="active-file-input" ${multiple ? 'multiple' : ''} accept="${accept}" 
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onchange="AppUI.handleFileSelect(event, ${multiple}, '${tool.color}')">
                    <div class="pointer-events-none space-y-2">
                        <i class="fa-solid fa-cloud-arrow-up text-3xl text-${tool.color} mb-1"></i>
                        <p class="text-sm font-semibold text-slate-600">Drag & drop files or click to browse</p>
                        <p class="text-xs text-slate-400">Maximum speed processing</p>
                    </div>
                </div>
                <div id="file-list" class="space-y-2 max-h-40 overflow-y-auto hidden"></div>
                <div id="preview-container" class="hidden w-full mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 preview-scroll"></div>
                <div id="progress-container" class="hidden w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div id="progress-bar" class="bg-${tool.color} h-1.5 rounded-full" style="width: 0%; transition: width 0.2s;"></div>
                </div>
            </div>
        `;
    }

    static handleFileSelect(event, multiple, colorClass) {
        const files = Array.from(event.target.files);
        if (!files.length) return;
        
        if (!multiple) window.activeFiles = files.slice(0,1);
        else window.activeFiles = [...window.activeFiles, ...files];
        
        this.updateFileList(colorClass);
    }

    static updateFileList(colorClass) {
        const list = document.getElementById('file-list');
        const preview = document.getElementById('preview-container');
        
        if (!window.activeFiles.length) { 
            list.classList.add('hidden'); 
            if(preview) preview.classList.add('hidden');
            return; 
        }
        list.classList.remove('hidden');
        
        const fragment = document.createDocumentFragment();
        window.activeFiles.forEach((f, i) => {
            const div = document.createElement('div');
            div.className = "flex items-center justify-between bg-white p-3 border border-slate-200 rounded-xl shadow-sm text-sm";
            div.draggable = true;
            div.ondragstart = (e) => AppUI.dragStart(e, i);
            div.ondragover = (e) => e.preventDefault();
            div.ondrop = (e) => AppUI.drop(e, i, colorClass);
            
            div.innerHTML = `
                <span class="truncate max-w-[200px] font-medium text-slate-700">
                    <i class="fa-solid fa-grip-vertical text-slate-300 cursor-move mr-2"></i> ${f.name}
                </span>
                <div class="flex items-center space-x-3">
                    <span class="text-slate-400 text-xs">${(f.size / 1024 / 1024).toFixed(2)} MB</span>
                    <button onclick="AppUI.removeFile(${i}, '${colorClass}')" class="text-red-400 hover:text-red-600 transition-colors"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;
            fragment.appendChild(div);
        });
        
        list.innerHTML = '';
        list.appendChild(fragment);

        // Dynamically request previews only if the active tool config requires it
        const currentTool = window.ToolsRegistry[window.currentToolId];
        const requiresPreview = currentTool && currentTool.requiresPreview;
        
        if (window.activeFiles.length === 1 && window.activeFiles[0].type === 'application/pdf' && requiresPreview) {
            this.renderThumbnails(window.activeFiles[0]);
        } else if (requiresPreview && preview) {
            preview.classList.add('hidden');
        }
    }

    static async renderThumbnails(file) {
        const container = document.getElementById('preview-container');
        if(!container) return;
        
        container.innerHTML = '<div class="text-xs text-slate-500 text-center py-2"><i class="fa-solid fa-spinner fa-spin"></i> Generating previews...</div>';
        container.classList.remove('hidden');
        
        try {
            const url = URL.createObjectURL(file);
            const pdf = await window.pdfjsLib.getDocument(url).promise;
            const maxPages = Math.min(pdf.numPages, 12); 
            
            let html = '<div class="flex gap-3 overflow-x-auto pb-2 preview-scroll">';
            for (let i = 1; i <= maxPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                await page.render({ canvasContext: ctx, viewport }).promise;
                
                html += `
                    <div class="shrink-0 flex flex-col items-center">
                        <img src="${canvas.toDataURL()}" class="h-24 w-auto border border-slate-200 rounded shadow-sm object-contain bg-white">
                        <span class="text-[10px] mt-1.5 font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Page ${i}</span>
                    </div>
                `;
            }
            if (pdf.numPages > maxPages) {
                html += `
                    <div class="shrink-0 flex items-center justify-center h-24 px-4 bg-slate-100 border border-slate-200 rounded text-xs text-slate-400 font-medium">
                        +${pdf.numPages - maxPages} more
                    </div>
                `;
            }
            html += '</div>';
            container.innerHTML = html;
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Preview rendering failed:", e);
            container.innerHTML = '<div class="text-xs text-red-400 text-center py-2">Preview unavailable</div>';
        }
    }

    static removeFile(index, colorClass) {
        window.activeFiles.splice(index, 1);
        this.updateFileList(colorClass);
        if(window.activeFiles.length === 0) document.getElementById('active-file-input').value = '';
    }

    static dragStart(e, index) { e.dataTransfer.setData("text/plain", index); }
    static drop(e, targetIndex, colorClass) {
        const sourceIndex = e.dataTransfer.getData("text/plain");
        const item = window.activeFiles.splice(sourceIndex, 1)[0];
        window.activeFiles.splice(targetIndex, 0, item);
        this.updateFileList(colorClass);
    }

    static updateProgress(percent) {
        const container = document.getElementById('progress-container');
        const bar = document.getElementById('progress-bar');
        if(container && bar) {
            container.classList.remove('hidden');
            bar.style.width = `${percent}%`;
        }
    }
}

// Expose AppUI to the global scope so dynamically loaded tools can access or extend it
window.AppUI = AppUI;

// --- GLOBAL ENGINE CONTROLLER ---
class PDFEngine {
    static async downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); 
        URL.revokeObjectURL(url);
    }

    static parsePageRanges(rangeStr, maxPages) {
        if(!rangeStr || rangeStr.trim() === '') return Array.from({length: maxPages}, (_, i) => i);
        const pages = new Set();
        const parts = rangeStr.split(',').map(p => p.trim());
        for (let part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                if (start > 0 && end <= maxPages && start <= end) {
                    for (let i = start; i <= end; i++) pages.add(i - 1);
                } else throw new Error(`Invalid range: ${part}`);
            } else {
                const num = Number(part);
                if (num > 0 && num <= maxPages) pages.add(num - 1);
                else throw new Error(`Invalid page number: ${part}`);
            }
        }
        return Array.from(pages).sort((a,b) => a-b);
    }

    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? rgb(parseInt(result[1], 16)/255, parseInt(result[2], 16)/255, parseInt(result[3], 16)/255) : rgb(0,0,0);
    }

    static async execute(id) {
        if (!window.activeFiles || window.activeFiles.length === 0) { 
            AppUI.showToast("Please upload required file(s).", 'error'); 
            return; 
        }
        
        const tool = window.ToolsRegistry[id];
        if (!tool || typeof tool.process !== 'function') {
            AppUI.showToast("Processor script for this tool is missing or invalid.", 'error');
            return;
        }

        const btn = document.getElementById('execute-btn');
        const originalBtnText = btn.innerHTML;
        btn.disabled = true; 
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Processing...`; 
        btn.classList.add('opacity-70', 'cursor-not-allowed');
        
        AppUI.updateProgress(10);
        await new Promise(r => setTimeout(r, 10)); 

        try {
            // Execution is strictly delegated to the dynamically loaded script
            const { blob, filename } = await tool.process(window.activeFiles, PDFEngine, AppUI, PDFDocument);
            
            AppUI.updateProgress(100);
            if (blob && filename) { 
                await this.downloadBlob(blob, filename); 
                AppUI.showToast("Operation completed successfully!"); 
            }
        } catch (error) { 
            console.error(error);
            AppUI.showToast(error.message, 'error'); 
        } finally { 
            btn.disabled = false; 
            btn.innerHTML = originalBtnText; 
            btn.classList.remove('opacity-70', 'cursor-not-allowed');
            setTimeout(() => { 
                const pc = document.getElementById('progress-container');
                if (pc) pc.classList.add('hidden'); 
            }, 1500);
        }
    }
}

// Expose PDFEngine
window.PDFEngine = PDFEngine;

// --- DYNAMIC EVENT LISTENERS ---
// The script dynamically captures the 'data-tool' attribute from the HTML card
// and utilizes it as the unified identifier/filename for the registry.
document.querySelectorAll('#tools-grid [data-tool]').forEach(card => {
    card.addEventListener('click', async (e) => {
        e.preventDefault();
        const dataTool = card.getAttribute('data-tool'); // e.g. "image-resizer", "split-pdf"
        
        try {
            // Visual feedback while loading the dynamic asset
            card.style.opacity = '0.7'; 
            
            // Load and parse the dedicated script dynamically
            await ToolManager.loadTool(dataTool);
            
            card.style.opacity = '1';
            
            // Render the tool
            activateWorkspace(dataTool);
            history.pushState(null, null, `#tool-${dataTool}`);
            
        } catch (error) {
            console.error(error);
            card.style.opacity = '1';
            AppUI.showToast(`Error initializing tool: ${error.message}`, 'error');
        }
    });
});

window.closeTool = function() {
    const panel = document.getElementById('hero-tool-panel');
    panel.classList.add('opacity-0');
    
    setTimeout(() => {
        panel.classList.add('hidden');
        panel.classList.remove('flex');
        
        document.getElementById('main-header').classList.remove('hidden');
        document.getElementById('our-tools').classList.remove('hidden');
        document.getElementById('about').classList.remove('hidden');
        document.getElementById('faq-section').classList.remove('hidden');
        
        // Small delay to allow display block to apply before fading in
        setTimeout(() => {
            document.getElementById('main-header').classList.remove('opacity-0');
            document.getElementById('our-tools').classList.remove('opacity-0');
            document.getElementById('about').classList.remove('opacity-0');
            document.getElementById('faq-section').classList.remove('opacity-0');
        }, 10);
        
        history.pushState(null, null, 'index.html');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
};

window.activateWorkspace = function(id) {
    // Fade out Home sections
    document.getElementById('main-header').classList.add('opacity-0');
    document.getElementById('our-tools').classList.add('opacity-0');
    document.getElementById('about').classList.add('opacity-0');
    document.getElementById('faq-section').classList.add('opacity-0');
    
    setTimeout(() => {
        // Hide Home sections
        document.getElementById('main-header').classList.add('hidden');
        document.getElementById('our-tools').classList.add('hidden');
        document.getElementById('about').classList.add('hidden');
        document.getElementById('faq-section').classList.add('hidden');
        
        // Show Hero Panel
        const panel = document.getElementById('hero-tool-panel');
        panel.classList.remove('hidden');
        panel.classList.add('flex');
        
        // Fade in
        setTimeout(() => panel.classList.remove('opacity-0'), 20);
        
        const box = document.getElementById('tool-workspace-box');
        const canvas = document.getElementById('canvas-content');
        
        // Fetch Tool Config from Dynamic Registry
        const tool = window.ToolsRegistry[id];
        
        window.activeFiles = []; 
        window.currentToolId = id;
        
        box.style.opacity = '0';
        box.style.transform = 'translateY(15px)';
        
        setTimeout(() => {
            const cBase = tool.color.split('-')[0];
            canvas.className = "text-left flex flex-col";
            canvas.innerHTML = `
                <div class="flex items-center space-x-5 mb-8 pb-8 border-b border-slate-100">
                    <div class="w-16 h-16 bg-${cBase}-50 text-${tool.color} rounded-[18px] flex items-center justify-center text-3xl shadow-sm border border-${cBase}-100/50 flex-shrink-0">
                        <i class="fa-solid ${tool.icon}"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">${tool.name}</h2>
                        <p class="text-sm md:text-base text-slate-500">${tool.desc}</p>
                    </div>
                </div>
                
                <div class="space-y-6 flex-grow">
                    ${tool.render(tool, AppUI)}
                </div>
                
                <div class="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                    <button id="execute-btn" onclick="PDFEngine.execute('${id}')" class="w-full sm:w-auto px-8 py-4 bg-${tool.color} hover:bg-${tool.color.replace('500', '600').replace('600', '700')} text-white text-sm font-bold rounded-xl shadow-lg shadow-${cBase}-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-3">
                        <span>Execute ${tool.name}</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            `;
            
            const dropZone = document.getElementById('drop-zone');
            if(dropZone) {
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, preventDefaults, false);
                });
                function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
                ['dragenter', 'dragover'].forEach(eventName => {
                    dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
                });
                ['dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
                });
                dropZone.addEventListener('drop', (e) => {
                    const dt = e.dataTransfer;
                    // Detect file constraints via the individual tool's dynamic registry
                    const isMultiple = tool.multipleFiles || false;
                    AppUI.handleFileSelect({target: {files: dt.files}}, isMultiple, tool.color);
                }, false);
            }

            // Execute isolated DOM/event setup logic if the separate tool file requires it
            if (typeof tool.init === 'function') {
                tool.init();
            }

            window.requestAnimationFrame(() => {
                box.style.opacity = '1'; 
                box.style.transform = 'translateY(0)';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }, 100);
    }, 300);
}
