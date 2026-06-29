// Global State - Fixed Typo (window instead of Window)
window.activeFiles = [];
window.currentTool = null;

// DOM object will be populated after page load to prevent White Screen crash
const DOM = {};

class AppUI {
    static initDOM() {
        DOM.homeView = document.getElementById('home-view');
        DOM.toolsGrid = document.getElementById('tools-grid');
        DOM.activeView = document.getElementById('active-tool-view');
        DOM.dynamicUI = document.getElementById('tool-dynamic-ui');
        DOM.dropzone = document.getElementById('dropzone');
        DOM.toast = document.getElementById('toast');
        DOM.btnText = document.getElementById('process-btn-text');
    }

    static renderToolsGrid() {
        if (!DOM.toolsGrid) return;
        DOM.toolsGrid.innerHTML = '';
        
        // Safety check for ToolsConfig to prevent app crash
        if (typeof ToolsConfig === 'undefined') {
            console.error("Error: ToolsConfig is missing!");
            DOM.toolsGrid.innerHTML = '<p class="text-red-500 font-bold p-4 text-center w-full">Error: Tools configuration not found. Please check your config file.</p>';
            return;
        }

        for (const key in ToolsConfig) {
            const tool = ToolsConfig[key];
            const cardHtml = `
                <div class="tool-card ${tool.cssClass || ''}" onclick="AppUI.openTool('${key}')">
                    <div class="tool-icon-wrapper">
                        <i class="fa-solid ${tool.icon || 'fa-wrench'}"></i>
                    </div>
                    <div class="tool-content">
                        <h3 class="tool-title">${tool.name}</h3>
                        <p class="tool-desc">${tool.desc}</p>
                    </div>
                    <div class="tool-arrow">
                        <i class="fa-solid fa-arrow-right text-sm"></i>
                    </div>
                </div>
            `;
            DOM.toolsGrid.insertAdjacentHTML('beforeend', cardHtml);
        }
    }

    static openTool(key) {
        if (typeof ToolsConfig === 'undefined' || !ToolsConfig[key]) return;
        
        window.currentTool = key;
        const tool = ToolsConfig[key];
        
        DOM.homeView.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        DOM.activeView.classList.remove('hidden');

        document.getElementById('tool-header-icon').className = `fa-solid ${tool.icon || 'fa-wrench'}`;
        document.getElementById('tool-header-icon-container').className = `w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white shadow-lg text-2xl sm:text-3xl shrink-0 ${tool.bgClass || 'bg-blue-600'}`;
        document.getElementById('tool-header-title').innerText = tool.name;
        document.getElementById('tool-header-desc').innerText = tool.desc;
        DOM.btnText.innerText = `${tool.name} Now`;

        DOM.dynamicUI.innerHTML = tool.render ? tool.render(key) : '';
        window.activeFiles = [];
        AppUI.renderFileList();
    }

    static closeTool() {
        DOM.activeView.classList.add('hidden');
        DOM.homeView.classList.remove('hidden');
        window.activeFiles = [];
        window.currentTool = null;
    }

    static renderComplexInput(toolId, multiple, accept) {
        return `
            <div class="border-2 border-dashed border-slate-300 rounded-[2rem] p-8 sm:p-14 text-center bg-white hover:bg-blue-50/50 hover:border-blue-500 transition-all cursor-pointer group" onclick="document.getElementById('hidden-file-input').click()">
                <input type="file" id="hidden-file-input" class="hidden" ${multiple ? 'multiple' : ''} accept="${accept || '*/*'}" onchange="AppUI.handleFileSelect(event)">
                <i class="fa-solid fa-cloud-arrow-up text-4xl sm:text-5xl text-blue-600 mb-4 block"></i>
                <h3 class="text-xl font-black text-slate-800">Click or drag & drop files here</h3>
                <div id="file-list-container" class="mt-6 flex flex-col gap-3 text-left" onclick="event.stopPropagation()"></div>
            </div>`;
    }

    static handleFileSelect(event) {
        if (event.target.files && event.target.files.length > 0) {
            const newFiles = Array.from(event.target.files);
            const isMultiple = document.getElementById('hidden-file-input').multiple;
            
            if (!isMultiple) {
                window.activeFiles = [newFiles[0]];
            } else {
                window.activeFiles.push(...newFiles);
            }
            AppUI.renderFileList();
        }
    }

    static renderFileList() {
        const container = document.getElementById('file-list-container');
        if (!container) return;
        container.innerHTML = '';
        
        window.activeFiles.forEach((file, index) => {
            container.innerHTML += `
                <div class="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span class="font-semibold text-sm truncate flex-1 pr-4">${file.name}</span>
                    <button onclick="window.activeFiles.splice(${index}, 1); AppUI.renderFileList();" class="text-red-500 hover:text-red-700 transition-colors p-2">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>`;
        });
    }

    static showToast(message, type = "success") {
        if (!DOM.toast) return;
        
        const icon = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";
        DOM.toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
        
        // Handling dynamic color based on error/success
        if (type === "error") {
            DOM.toast.classList.replace('bg-green-600', 'bg-red-600'); // Assuming default is green
        } else {
            DOM.toast.classList.replace('bg-red-600', 'bg-green-600');
        }

        DOM.toast.classList.replace('opacity-0', 'opacity-100');
        DOM.toast.classList.replace('translate-y-24', 'translate-y-0');
        
        setTimeout(() => {
            DOM.toast.classList.replace('opacity-100', 'opacity-0');
            DOM.toast.classList.replace('translate-y-0', 'translate-y-24');
        }, 3000);
    }
}

// REAL LOGIC PROCESSING
class ProcessorLogic {
    static async start() {
        if (!window.activeFiles || window.activeFiles.length === 0) {
            return AppUI.showToast("Please upload a file first!", "error");
        }
        
        const originalBtnText = DOM.btnText.innerText;
        DOM.btnText.innerText = "Processing...";
        DOM.btnText.parentElement.disabled = true; // Disable button while processing
        
        try {
            if (window.currentTool === 'merge') await this.mergePDFs();
            else if (window.currentTool === 'split') await this.splitPDF();
            else if (window.currentTool === 'resizer') await this.resizeImage();
            else throw new Error("Tool processing logic not found.");
            
            AppUI.showToast("Completed & Downloaded!", "success");
        } catch (error) {
            console.error("Processing Error:", error);
            AppUI.showToast("An error occurred during processing.", "error");
        } finally {
            // Restore button state
            DOM.btnText.innerText = originalBtnText;
            DOM.btnText.parentElement.disabled = false;
        }
    }

    static async mergePDFs() {
        if (typeof PDFLib === 'undefined') throw new Error("PDFLib library is missing");
        const { PDFDocument } = PDFLib;
        const mergedPdf = await PDFDocument.create();
        
        for (let file of window.activeFiles) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        
        const pdfBytes = await mergedPdf.save();
        this.downloadFile(pdfBytes, 'Merged_Document.pdf', 'application/pdf');
    }

    static async splitPDF() {
        if (typeof PDFLib === 'undefined' || typeof JSZip === 'undefined') {
            throw new Error("Required libraries (PDFLib or JSZip) are missing");
        }
        
        const { PDFDocument } = PDFLib;
        const file = window.activeFiles[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const zip = new JSZip();

        for (let i = 0; i < pdf.getPageCount(); i++) {
            const newPdf = await PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(pdf, [i]);
            newPdf.addPage(copiedPage);
            const pdfBytes = await newPdf.save();
            zip.file(`Page_${i + 1}.pdf`, pdfBytes);
        }
        
        const content = await zip.generateAsync({ type: "blob" });
        this.downloadFile(content, 'Split_Pages.zip', 'application/zip');
    }

    static resizeImage() {
        return new Promise((resolve, reject) => {
            const file = window.activeFiles[0];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const wInput = document.getElementById('img-w')?.value;
                    const hInput = document.getElementById('img-h')?.value;
                    
                    canvas.width = wInput ? parseInt(wInput) : img.width;
                    canvas.height = hInput ? parseInt(hInput) : img.height;
                    
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        this.downloadFile(blob, `Resized_${file.name}`, file.type);
                        resolve();
                    }, file.type, 0.9);
                };
                img.onerror = () => reject(new Error("Image loading failed"));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error("File reading failed"));
            reader.readAsDataURL(file);
        });
    }

    static downloadFile(data, filename, type) {
        const blob = data instanceof Blob ? data : new Blob([data], { type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        // Clean up memory
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }, 100);
    }
}

// Ensure DOM is fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    AppUI.initDOM();
    AppUI.renderToolsGrid();
});
