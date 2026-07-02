// --- Core Library Integrations & Framework Setup ---
window.CORE_FRAMEWORK_VERSION = "1.0.0"; 
window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Expose PDFLib globally for dynamically loaded tools
window.PDFLibOptions = window.PDFLib || PDFLib;
const { PDFDocument, rgb, degrees } = window.PDFLibOptions;

// --- Global Application State ---
window.activeFiles = [];
window.currentToolId = null;

// --- DYNAMIC REGISTRY & LOADER ARCHITECTURE ---
window.ToolsRegistry = {};
window.ToolLoadPromises = {}; 

class ToolManager {
    static async loadTool(toolId) {
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
                // Fetch Manifest 
                try {
                    const manifestRes = await fetch(`./tools/${toolId}/manifest.json`);
                    if (manifestRes.ok) {
                        const manifest = await manifestRes.json();
                        Object.assign(tool, manifest);
                    } else {
                        Object.assign(tool, { name: toolId.replace(/-/g, ' ').toUpperCase(), color: 'blue-500' });
                    }
                } catch(e) {
                    Object.assign(tool, { name: toolId.replace(/-/g, ' ').toUpperCase(), color: 'blue-500' });
                }

                // Fetch HTML Template (Optional)
                try {
                    const htmlRes = await fetch(`./tools/${toolId}/index.html`);
                    if (htmlRes.ok) tool.template = await htmlRes.text();
                } catch (e) {} 

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
                                await new Promise((resolve) => {
                                    const script = document.createElement('script');
                                    script.src = `./tools/${toolId}/${jsFile}`;
                                    script.setAttribute('data-tool-dependency', toolId);
                                    script.onload = resolve;
                                    script.onerror = resolve; 
                                    document.head.appendChild(script);
                                });
                            }
                        }
                    }
                }

                // Load Logic Script (Optional)
                if (!document.querySelector(`script[data-tool-id="${toolId}"]`)) {
                    await new Promise((resolve) => {
                        const script = document.createElement('script');
                        script.src = `./tools/${toolId}/script.js`;
                        script.setAttribute('data-tool-id', toolId);
                        script.onload = resolve;
                        script.onerror = resolve; 
                        document.head.appendChild(script);
                    });
                }

                tool.isLoaded = true;
                return tool;
                
            } catch (error) {
                console.error(`[ToolManager] error:`, error);
                tool.isLoaded = true;
                return tool; 
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
        const cBase = tColor.split('-')[0] || 'blue';
        return `
            <div class="space-y-3">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Source File(s)</label>
                <div id="drop-zone" class="relative w-full border-2 border-dashed border-${cBase}-300 rounded-2xl p-6 bg-${cBase}-50/50 transition-colors text-center hover:bg-${cBase}-100/60">
                    <input type="file" id="active-file-input" ${multiple ? 'multiple' : ''} accept="${accept}" 
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onchange="AppUI.handleFileSelect(event, ${multiple}, '${tColor}')">
                    <div class="pointer-events-none space-y-2">
ex, 0, item);
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

    static loadImgDims(input) {
        this.handleFileSelect({target: input}, false, 'red-500');
        if(window.activeFiles.length === 0) return;
        const file = window.activeFiles[0];
        if(!file.type.startsWith('image/')) { this.showToast("Please select a valid image.", 'error'); return; }
        const img = new Image();
        const url = URL.createObjectURL(file); 
        img.onload = () => { 
            const origDims = document.getElementById('orig-dims');
            if(origDims) origDims.innerHTML = `Original: <b>${img.width}x${img.height}</b> px`;
            
            document.getElementById('img-w').value = img.width; 
            document.getElementById('img-h').value = img.height; 
            document.getElementById('img-w').dataset.ratio = img.width / img.height;
            URL.revokeObjectURL(url); 
        }
        img.src = url;
    }

    static toggleResizeMode() {
        const mode = document.getElementById('resize-mode').value;
        if (mode === 'pct') {
            document.getElementById('dim-inputs').classList.add('hidden');
            document.getElementById('pct-inputs').classList.remove('hidden');
        } else {
            document.getElementById('dim-inputs').classList.remove('hidden');
            document.getElementById('pct-inputs').classList.add('hidden');
        }
    }

    static toggleWatermarkMode() {
        const type = document.getElementById('wm-type').value;
        if(type === 'image') {
            document.getElementById('wm-text-opts').classList.add('hidden');
            document.getElementById('wm-img-opts').classList.remove('hidden');
        } else {
            document.getElementById('wm-text-opts').classList.remove('hidden');
            document.getElementById('wm-img-opts').classList.add('hidden');
        }
    }

    static syncRatio(isWidth) {
        const lock = document.getElementById('lock-ratio').checked;
        if(!lock) return;
        const wInput = document.getElementById('img-w');
        const hInput = document.getElementById('img-h');
        const ratio = parseFloat(wInput.dataset.ratio);
        if(isWidth && wInput.value) hInput.value = Math.round(wInput.value / ratio);
        else if(!isWidth && hInput.value) wInput.value = Math.round(hInput.value * ratio);
    }

    static cleanupWorkspace() {
        window.activeFiles = [];

