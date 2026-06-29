window.ActiveFiles = [];
window.CurrentTool = null;

const DOM = {
    homeView: document.getElementById('home-view'),
    toolsGrid: document.getElementById('tools-grid'),
    activeView: document.getElementById('active-tool-view'),
    dynamicUI: document.getElementById('tool-dynamic-ui'),
    dropzone: document.getElementById('dropzone'),
    toast: document.getElementById('toast'),
    btnText: document.getElementById('process-btn-text')
};

class AppUI {
    static renderToolsGrid() {
        DOM.toolsGrid.innerHTML = '';
        for (const key in ToolsConfig) {
            const tool = ToolsConfig[key];
            const cardHtml = `
                <div class="tool-card ${tool.cssClass}" onclick="AppUI.openTool('${key}')">
                    <div class="tool-icon-wrapper">
                        <i class="fa-solid ${tool.icon}"></i>
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
        window.CurrentTool = key;
        const tool = ToolsConfig[key];
        DOM.homeView.classList.add('hidden');
        window.scrollTo(0, 0);
        DOM.activeView.classList.remove('hidden');

        document.getElementById('tool-header-icon').className = `fa-solid ${tool.icon}`;
        document.getElementById('tool-header-icon-container').className = `w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white shadow-lg text-2xl sm:text-3xl shrink-0 ${tool.bgClass}`;
        document.getElementById('tool-header-title').innerText = tool.name;
        document.getElementById('tool-header-desc').innerText = tool.desc;
        DOM.btnText.innerText = `${tool.name} Now`;

        DOM.dynamicUI.innerHTML = tool.render(key);
        window.ActiveFiles = [];
        AppUI.renderFileList();
    }

    static closeTool() {
        DOM.activeView.classList.add('hidden');
        DOM.homeView.classList.remove('hidden');
        window.ActiveFiles = [];
        window.CurrentTool = null;
    }

    static renderComplexInput(toolId, multiple, accept) {
        return `
            <div class="border-2 border-dashed border-slate-300 rounded-[2rem] p-8 sm:p-14 text-center bg-white hover:bg-blue-50/50 hover:border-blue-500 transition-all cursor-pointer group" onclick="document.getElementById('hidden-file-input').click()">
                <input type="file" id="hidden-file-input" class="hidden" ${multiple ? 'multiple' : ''} accept="${accept}" onchange="AppUI.handleFileSelect(event)">
                <i class="fa-solid fa-cloud-arrow-up text-4xl sm:text-5xl text-blue-600 mb-4 block"></i>
                <h3 class="text-xl font-black text-slate-800">Click or drag & drop files here</h3>
                <div id="file-list-container" class="mt-6 flex flex-col gap-3 text-left" onclick="event.stopPropagation()"></div>
            </div>`;
    }

    static handleFileSelect(event) {
        if (event.target.files.length > 0) {
            const newFiles = Array.from(event.target.files);
            const isMultiple = document.getElementById('hidden-file-input').multiple;
            if (!isMultiple) window.ActiveFiles = [newFiles[0]];
            else window.ActiveFiles.push(...newFiles);
            AppUI.renderFileList();
        }
    }

    static renderFileList() {
        const container = document.getElementById('file-list-container');
        if (!container) return;
        container.innerHTML = '';
        window.ActiveFiles.forEach((file, index) => {
            container.innerHTML += `
                <div class="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span class="font-semibold text-sm truncate">${file.name}</span>
                    <button onclick="window.ActiveFiles.splice(${index}, 1); AppUI.renderFileList();" class="text-red-500"><i class="fa-solid fa-trash"></i></button>
                </div>`;
        });
    }

    static showToast(message, type = "success") {
        DOM.toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
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
        if (window.ActiveFiles.length === 0) return AppUI.showToast("Please upload a file first!", "error");
        
        DOM.btnText.innerText = "Processing...";
        try {
            if (window.CurrentTool === 'merge') await this.mergePDFs();
            if (window.CurrentTool === 'split') await this.splitPDF();
            if (window.CurrentTool === 'resizer') await this.resizeImage();
            AppUI.showToast("Completed & Downloaded!", "success");
        } catch (error) {
            console.error(error);
            AppUI.showToast("An error occurred.", "error");
        }
        DOM.btnText.innerText = ToolsConfig[window.CurrentTool].name + " Now";
    }

    static async mergePDFs() {
        const { PDFDocument } = PDFLib;
        const mergedPdf = await PDFDocument.create();
        for (let file of window.ActiveFiles) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        const pdfBytes = await mergedPdf.save();
        this.downloadFile(pdfBytes, 'Merged_Document.pdf', 'application/pdf');
    }

    static async splitPDF() {
        const { PDFDocument } = PDFLib;
        const file = window.ActiveFiles[0];
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
        return new Promise((resolve) => {
            const file = window.ActiveFiles[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const wInput = document.getElementById('img-w').value;
                    const hInput = document.getElementById('img-h').value;
                    
                    canvas.width = wInput ? parseInt(wInput) : img.width;
                    canvas.height = hInput ? parseInt(hInput) : img.height;
                    
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        this.downloadFile(blob, `Resized_${file.name}`, file.type);
                        resolve();
                    }, file.type, 0.9);
                };
                img.src = e.target.result;
            };
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
        document.body.removeChild(link);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    AppUI.renderToolsGrid();
});
