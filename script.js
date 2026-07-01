// --- Core Library Integrations & Framework Setup ---
window.CORE_FRAMEWORK_VERSION = "1.0.0"; 
window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Expose PDFLib globally for dynamically loaded tools
window.PDFLibOptions = window.PDFLib || PDFLib;
const { PDFDocument, rgb, degrees } = window.PDFLibOptions;

// --- Global Application State ---
window.activeFiles = [];
window.currentToolId = null;
window.ActiveRegistry = []; // Source of truth for authorized tools

// --- DYNAMIC REGISTRY & LOADER ARCHITECTURE ---
window.ToolsRegistry = {};
window.ToolLoadPromises = {}; 

class ToolManager {
    static async loadTool(toolId) {
        // Security Gate: Reject requests for tools not in the active registry
        if (window.ActiveRegistry.length > 0 && !window.ActiveRegistry.includes(toolId)) {
            throw new Error(`Access Denied: Tool '${toolId}' is inactive or not configured.`);
        }

        if (window.ToolsRegistry[toolId] && window.ToolsRegistry[toolId].isLoaded) {
            return window.ToolsRegistry[toolId];
        }

        if (window.ToolLoadPromises[toolId]) {
            return window.ToolLoadPromises[toolId];
        }
        
        window.ToolsRegistry[toolId] = window.ToolsRegistry[toolId] || {};
        const tool = window.ToolsRegistry[toolId];

        window.ToolLoadPromises[toolId] = (async () => {
            try {
                // Fetch & Parse Manifest
                const manifestRes = await fetch(`./tools/${toolId}/manifest.json`);
                if (!manifestRes.ok) throw new Error(`Configuration missing for '${toolId}'.`);
                
                const manifest = await manifestRes.json();
                Object.assign(tool, manifest);

                // Version Compatibility Check
                if (tool.requiredFrameworkVersion) {
                    const reqMajor = tool.requiredFrameworkVersion.split('.')[0];
                    const coreMajor = window.CORE_FRAMEWORK_VERSION.split('.')[0];
                    if (reqMajor !== coreMajor) {
                        throw new Error(`Incompatible tool. Requires framework v${tool.requiredFrameworkVersion}.`);
                    }
                }

                // Fetch HTML Template
                try {
                    const htmlRes = await fetch(`./tools/${toolId}/index.html`);
                    if (htmlRes.ok) tool.template = await htmlRes.text();
                } catch (e) {
                    console.warn(`[ToolManager] No index.html found for '${toolId}'. Using default UI.`);
                }

                // Load Optional Dependencies
                if (tool.dependencies) {
                    if (tool.dependencies.css && Array.isArray(tool.dependencies.css)) {
                        tool.dependencies.css.forEach(cssFile => {
                            if (!document.querySelector(`link[href="./tools/${toolId}/${cssFile}"]`)) {
                                const link = document.createElement('link');
                                link.rel = 'stylesheet';
                                link.href = `./tools/${toolId}/${cssFile}`;
                                link.setAttribute('data-tool-dependency', toolId);
                                document.head.appendChild(link);
                            }
                        });
                    }
                    if (tool.dependencies.js && Array.isArray(tool.dependencies.js)) {
                        for (const jsFile of tool.dependencies.js) {
                            if (!document.querySelector(`script[src="./tools/${toolId}/${jsFile}"]`)) {
                                await new Promise((resolve, reject) => {
                                    const script = document.createElement('script');
                                    script.src = `./tools/${toolId}/${jsFile}`;
                                    script.setAttribute('data-tool-dependency', toolId);
                                    script.onload = resolve;
                                    script.onerror = () => reject(new Error(`Failed to load dependency: ${jsFile}`));
                                    document.head.appendChild(script);
                                });
                            }
                        }
                    }
                }

                // Load Logic Script
                if (!document.querySelector(`script[data-tool-id="${toolId}"]`)) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = `./tools/${toolId}/script.js`;
                        script.setAttribute('data-tool-id', toolId);
                        script.onload = resolve;
                        script.onerror = () => reject(new Error(`Logic script missing for '${toolId}'.`));
                        document.head.appendChild(script);
                    });
                }

                tool.isLoaded = true;
                return tool;
                
            } catch (error) {
                console.error(`[ToolManager] Error loading tool '${toolId}':`, error);
                delete window.ToolLoadPromises[toolId]; 
                throw error;
            }
        })();

        return window.ToolLoadPromises[toolId];
    }
}

// --- GLOBAL UI MANAGER ---
class AppUI {
    static showToast(msg, type = 'success') {
        const t = document.getElementById('toast');
        if(!t) return;
        const isError = type === 'error';
        t.innerHTML = isError 
            ? `<i class="fa-solid fa-circle-exclamation text-sm"></i> <span>${msg}</span>` 
            : `<i class="fa-solid fa-circle-check text-sm"></i> <span>${msg}</span>`;
        t.className = `fixed bottom-6 right-6 px-5 py-3 rounded-xl text-white text-xs font-semibold shadow-2xl flex items-center space-x-2 z-50 transition duration-300 transform translate-y-0 opacity-100 gpu-accelerate ${isError ? 'bg-red-500 shadow-red-200/50' : 'bg-emerald-600 shadow-emerald-200/50'}`;
        
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => { 
            t.classList.remove('translate-y-0', 'opacity-100'); 
            t.classList.add('translate-y-20', 'opacity-0'); 
        }, 4000);
    }

    static renderFileInput(tool, multiple = false, accept = ".pdf") {
        const tColor = tool.color || 'blue-500';
        const cBase = tColor.split('-')[0];
        return `
            <div class="space-y-3">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Source File(s)</label>
                <div id="drop-zone" class="relative w-full border-2 border-dashed border-${cBase}-300 rounded-2xl p-6 bg-${cBase}-50/50 transition-colors text-center hover:bg-${cBase}-100/60">
                    <input type="file" id="active-file-input" ${multiple ? 'multiple' : ''} accept="${accept}" 
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onchange="AppUI.handleFileSelect(event, ${multiple}, '${tColor}')">
                    <div class="pointer-events-none space-y-2">
                        <i class="fa-solid fa-cloud-arrow-up text-3xl text-${tColor} mb-1"></i>
                        <p class="text-sm font-semibold text-slate-600">Drag & drop files or click to browse</p>
                        <p class="text-xs text-slate-400">Maximum speed processing</p>
                    </div>
                </div>
                <div id="file-list" class="space-y-2 max-h-40 overflow-y-auto hidden"></div>
                <div id="preview-container" class="hidden w-full mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 preview-scroll"></div>
                <div id="progress-container" class="hidden w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div id="progress-bar" class="bg-${tColor} h-1.5 rounded-full" style="width: 0%; transition: width 0.2s;"></div>
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
            if(list) list.classList.add('hidden'); 
            if(preview) preview.classList.add('hidden');
            return; 
        }
        if(list) list.classList.remove('hidden');
        
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
        
        if(list) {
            list.innerHTML = '';
            list.appendChild(fragment);
        }

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
        
        let url = null;
        try {
            url = URL.createObjectURL(file);
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
        } catch (e) {
            console.error("[AppUI] Preview rendering failed:", e);
            container.innerHTML = '<div class="text-xs text-red-400 text-center py-2">Preview unavailable</div>';
        } finally {
            if (url) URL.revokeObjectURL(url);
        }
    }

    static removeFile(index, colorClass) {
        window.activeFiles.splice(index, 1);
        this.updateFileList(colorClass);
        const input = document.getElementById('active-file-input');
        if(window.activeFiles.length === 0 && input) input.value = '';
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

    static cleanupWorkspace() {
        window.activeFiles = [];

        if (window.currentToolId) {
            document.querySelectorAll(`[data-tool-dependency="${window.currentToolId}"]`).forEach(el => el.remove());
        }
        
        window.currentToolId = null;

        const list = document.getElementById('file-list');
        const preview = document.getElementById('preview-container');
        const progressContainer = document.getElementById('progress-container');
        const progressBar = document.getElementById('progress-bar');
        const canvas = document.getElementById('canvas-content');

        if (list) { list.innerHTML = ''; list.classList.add('hidden'); }
        if (preview) { preview.innerHTML = ''; preview.classList.add('hidden'); }
        if (progressContainer) { progressContainer.classList.add('hidden'); }
        if (progressBar) { progressBar.style.width = '0%'; }
        if (canvas) canvas.innerHTML = ''; 
    }
}

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
        if (!btn) return;
        const originalBtnText = btn.innerHTML;
        btn.disabled = true; 
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Processing...`; 
        btn.classList.add('opacity-70', 'cursor-not-allowed');
        
        AppUI.updateProgress(10);
        await new Promise(r => setTimeout(r, 10)); 

        try {
            const { blob, filename } = await tool.process(window.activeFiles, PDFEngine, AppUI, PDFDocument);
            
            AppUI.updateProgress(100);
            if (blob && filename) { 
                await this.downloadBlob(blob, filename); 
                AppUI.showToast("Operation completed successfully!"); 
            }
        } catch (error) { 
            console.error(`[PDFEngine] Execution Error:`, error);
            AppUI.showToast(error.message, 'error'); 
        } finally { 
            if (document.body.contains(btn)) {
                btn.disabled = false; 
                btn.innerHTML = originalBtnText; 
                btn.classList.remove('opacity-70', 'cursor-not-allowed');
            }
            setTimeout(() => { 
                const pc = document.getElementById('progress-container');
                if (pc) pc.classList.add('hidden'); 
            }, 1500);
        }
    }
}

window.PDFEngine = PDFEngine;

// --- CENTRALIZED TOOL LAUNCHER ---
window.openTool = async function(id, element = null) {
    if(element) element.style.opacity = '0.7';
    try {
        await ToolManager.loadTool(id);
        if(element) element.style.opacity = '1';
        window.activateWorkspace(id);
        history.pushState(null, null, `#tool-${id}`);
    } catch (error) {
        console.error(error);
        if(element) element.style.opacity = '1';
        AppUI.showToast(error.message, 'error');
    }
};

// --- DYNAMIC HUB INITIALIZATION ---
class HubManager {
    static async initialize() {
        try {
            // 1. Fetch registry first to establish the source of truth
            const res = await fetch('./tools/registry.json');
            if (!res.ok) throw new Error("Registry configuration could not be loaded.");
            const activeToolIds = await res.json();
            
            // Populate global registry state for security gatekeeping
            window.ActiveRegistry = activeToolIds;

            const grid = document.getElementById('tools-grid');
            if (!grid) return;

            // 2. Cache all hardcoded HTML elements and clear the grid
            const domElementsMap = {};
            document.querySelectorAll('[data-tool]').forEach(card => {
                domElementsMap[card.getAttribute('data-tool')] = card;
                card.remove(); 
            });

            // 3. Rebuild the DOM strictly based on the registry, preserving the registry array's exact order
            for (const id of activeToolIds) {
                if (domElementsMap[id]) {
                    // Tool exists in HTML: restore it, clean hidden classes, and attach safe event listener
                    const card = domElementsMap[id];
                    card.classList.remove('hidden');
                    
                    const safeCard = card.cloneNode(true);
                    safeCard.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.openTool(id, safeCard);
                    });
                    
                    grid.appendChild(safeCard);
                } else {
                    // Tool active in registry but missing in HTML: Fetch manifest & build dynamically
                    try {
                        const manifestRes = await fetch(`./tools/${id}/manifest.json`);
                        if (!manifestRes.ok) continue; 
                        const manifest = await manifestRes.json();
                        
                        window.ToolsRegistry[id] = window.ToolsRegistry[id] || {};
                        Object.assign(window.ToolsRegistry[id], manifest);

                        this.buildCard(grid, id, manifest);
                    } catch(e) {
                        console.error(`[HubManager] Failed to construct dynamic tool ${id}`, e);
                    }
                }
            }
        } catch (error) {
            console.error('Hub Initialization Error:', error);
            AppUI.showToast("Failed to sync system configuration.", "error");
        }
    }

    static buildCard(grid, id, manifest) {
        const tColor = manifest.color || 'blue-500';
        const cBase = tColor.split('-')[0];
        const card = document.createElement('a');
        card.href = `#tool-${id}`;
        card.className = "group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-start";
        card.setAttribute('data-tool', id);
        
        card.innerHTML = `
            <div class="w-14 h-14 bg-${cBase}-50 text-${tColor} rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <i class="fa-solid ${manifest.icon || 'fa-wrench'}"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-2 group-hover:text-${tColor} transition-colors">${manifest.name || 'Utility Tool'}</h3>
            <p class="text-sm text-slate-500 leading-relaxed mb-4 flex-grow">${manifest.desc || ''}</p>
            <div class="mt-auto inline-flex items-center text-sm font-semibold text-${tColor} group-hover:translate-x-1 transition-transform">
                Open Tool <i class="fa-solid fa-arrow-right ml-2 text-xs"></i>
            </div>
        `;

        card.addEventListener('click', (e) => {
            e.preventDefault();
            window.openTool(id, card);
        });

        grid.appendChild(card);
    }
}

// Boot up the hub when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    HubManager.initialize();
});

// --- WORKSPACE & ROUTING LOGIC ---
window.closeTool = function() {
    if (window.currentToolId) {
        const activeTool = window.ToolsRegistry[window.currentToolId];
        if (activeTool && typeof activeTool.cleanup === 'function') {
            try { activeTool.cleanup(); } catch (e) { console.error(`[Cleanup Error in ${window.currentToolId}]`, e); }
        }
    }

    const panel = document.getElementById('hero-tool-panel');
    if(panel) panel.classList.add('opacity-0');
    
    setTimeout(() => {
        if(panel) {
            panel.classList.add('hidden');
            panel.classList.remove('flex');
        }
        
        document.getElementById('main-header')?.classList.remove('hidden');
        document.getElementById('our-tools')?.classList.remove('hidden');
        document.getElementById('about')?.classList.remove('hidden');
        document.getElementById('faq-section')?.classList.remove('hidden');
        
        AppUI.cleanupWorkspace();

        setTimeout(() => {
            document.getElementById('main-header')?.classList.remove('opacity-0');
            document.getElementById('our-tools')?.classList.remove('opacity-0');
            document.getElementById('about')?.classList.remove('opacity-0');
            document.getElementById('faq-section')?.classList.remove('opacity-0');
        }, 10);
        
        history.pushState(null, null, 'index.html');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
};

window.activateWorkspace = function(id) {
    const tool = window.ToolsRegistry[id];
    
    if (!tool) {
        AppUI.showToast(`Tool details for '${id}' could not be loaded.`, 'error');
        return;
    }

    document.getElementById('main-header')?.classList.add('opacity-0');
    document.getElementById('our-tools')?.classList.add('opacity-0');
    document.getElementById('about')?.classList.add('opacity-0');
    document.getElementById('faq-section')?.classList.add('opacity-0');
    
    setTimeout(() => {
        document.getElementById('main-header')?.classList.add('hidden');
        document.getElementById('our-tools')?.classList.add('hidden');
        document.getElementById('about')?.classList.add('hidden');
        document.getElementById('faq-section')?.classList.add('hidden');
        
        const panel = document.getElementById('hero-tool-panel');
        if(panel) {
            panel.classList.remove('hidden');
            panel.classList.add('flex');
            setTimeout(() => panel.classList.remove('opacity-0'), 20);
        }
        
        const box = document.getElementById('tool-workspace-box');
        const canvas = document.getElementById('canvas-content');
        
        window.activeFiles = []; 
        window.currentToolId = id;
        
        if(box) {
            box.style.opacity = '0';
            box.style.transform = 'translateY(15px)';
        }
        
        setTimeout(() => {
            const tColor = tool.color || 'blue-500';
            const cBase = tColor.split('-')[0];
            const tIcon = tool.icon || 'fa-wrench';
            const tName = tool.name || 'Utility Tool';
            const tDesc = tool.desc || '';
            const multipleFiles = tool.multipleFiles !== undefined ? tool.multipleFiles : false;
            const acceptAttr = tool.accept || '*/*';
            
            let toolUI = '';
            if (tool.template) {
                toolUI = tool.template;
            } else if (typeof tool.render === 'function') {
                try {
                    toolUI = tool.render(tool, AppUI);
                } catch (renderError) {
                    console.error(`[Render Error in ${id}]`, renderError);
                    toolUI = `<div class="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">Failed to render custom UI. Using fallback.</div>` + AppUI.renderFileInput(tool, multipleFiles, acceptAttr);
                }
            } else {
                toolUI = AppUI.renderFileInput(tool, multipleFiles, acceptAttr);
            }

            if(canvas) {
                canvas.className = "text-left flex flex-col";
                canvas.innerHTML = `
                    <div class="flex items-center space-x-5 mb-8 pb-8 border-b border-slate-100">
                        <div class="w-16 h-16 bg-${cBase}-50 text-${tColor} rounded-[18px] flex items-center justify-center text-3xl shadow-sm border border-${cBase}-100/50 flex-shrink-0">
                            <i class="fa-solid ${tIcon}"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">${tName}</h2>
                            <p class="text-sm md:text-base text-slate-500">${tDesc}</p>
                        </div>
                    </div>
                    
                    <div class="space-y-6 flex-grow">
                        ${toolUI}
                    </div>
                    
                    <div class="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                        <button id="execute-btn" onclick="PDFEngine.execute('${id}')" class="w-full sm:w-auto px-8 py-4 bg-${tColor} hover:bg-${tColor.replace('500', '600').replace('600', '700')} text-white text-sm font-bold rounded-xl shadow-lg shadow-${cBase}-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-3">
                            <span>Execute ${tName}</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                `;
            }
            
            const dropZone = document.getElementById('drop-zone');
            if(dropZone) {
                const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, preventDefaults, false);
                });
                ['dragenter', 'dragover'].forEach(eventName => {
                    dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
                });
                ['dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
                });
                dropZone.addEventListener('drop', (e) => {
                    const dt = e.dataTransfer;
                    AppUI.handleFileSelect({target: {files: dt.files}}, multipleFiles, tColor);
                }, false);
            }

            if (typeof tool.init === 'function') {
                try { tool.init(); } catch (initError) { console.error(`[Init Error in ${id}]`, initError); }
            }

            window.requestAnimationFrame(() => {
                if(box) {
                    box.style.opacity = '1'; 
                    box.style.transform = 'translateY(0)';
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }, 100);
    }, 300);
}
