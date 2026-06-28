const { PDFDocument, rgb, degrees } = PDFLib;

// 1. UI Helper Functions
const AppUI = {
    showToast(msg, type = 'success') {
        const t = document.getElementById('toast');
        const isError = type === 'error';
        t.innerHTML = isError 
            ? `<i class="fa-solid fa-circle-exclamation text-sm"></i> <span>${msg}</span>` 
            : `<i class="fa-solid fa-circle-check text-sm"></i> <span>${msg}</span>`;
        t.className = `fixed bottom-6 right-6 px-5 py-3 rounded-xl text-white text-xs font-semibold shadow-2xl flex items-center space-x-2 z-50 transition-all duration-300 transform translate-y-0 opacity-100 ${isError ? 'bg-red-500 shadow-red-200/50' : 'bg-emerald-600 shadow-emerald-200/50'}`;
        setTimeout(() => { t.classList.remove('translate-y-0', 'opacity-100'); t.classList.add('translate-y-20', 'opacity-0'); }, 4000);
    },

    renderFileInput(tool, multiple = false, accept = ".pdf") {
        return `
            <div class="space-y-3">
                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Source File(s)</label>
                <input type="file" id="active-file-input" ${multiple ? 'multiple' : ''} accept="${accept}" 
                    class="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-${tool.color.split('-')[0]}-50 file:text-${tool.color} hover:file:bg-${tool.color.split('-')[0]}-100 cursor-pointer border border-dashed border-slate-200 rounded-2xl p-4 transition-colors">
            </div>
        `;
    },

    loadImgDims(input) {
        if(!input.files || input.files.length === 0) return;
        const file = input.files[0];
        const img = new Image();
        img.onload = () => { document.getElementById('img-w').value = img.width; document.getElementById('img-h').value = img.height; }
        img.src = URL.createObjectURL(file);
    }
};

// 2. PDF Engine Logic
const PDFEngine = {
    async downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        a.click(); URL.revokeObjectURL(url);
    },

    async execute(id) {
        const input = document.getElementById('active-file-input');
        if(!input || !input.files || input.files.length === 0) { AppUI.showToast("Please upload a file.", 'error'); return; }
        
        try {
            let finalBlob = null;
            if (id === 'resizer') { finalBlob = await this.processResizer(input.files[0]); }
            else if (id === 'imgToPdf') { finalBlob = await this.processImagesToPdf(input.files); }
            else if (id === 'merge') { finalBlob = await this.processMerge(input.files); }
            else {
                const fileBytes = await input.files[0].arrayBuffer();
                const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
                finalBlob = await this.processSinglePDF(id, pdfDoc);
            }
            if (finalBlob) { await this.downloadBlob(finalBlob, "output.pdf"); AppUI.showToast("Done!"); }
        } catch (e) { AppUI.showToast(e.message, 'error'); }
    },
    // ... (یہاں آپ کے پرانے کوڈ کے تمام process فنکشنز آئیں گے: processResizer, processMerge, processSinglePDF)
};

// 3. Dynamic UI Renderer
function activateWorkspace(id) {
    const box = document.getElementById('tool-workspace-box');
    const tool = ToolsConfig[id];
    // پرانا activateWorkspace لاجک یہاں آئے گا جو HTML کو بدلتا ہے
    // یہ ToolsConfig (جو config.js میں ہے) کا استعمال کرے گا
}

// 4. Initializing the Grid
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('tools-grid');
    Object.keys(ToolsConfig).forEach(key => {
        const tool = ToolsConfig[key];
        const card = document.createElement('a');
        card.onclick = () => activateWorkspace(key);
        card.innerHTML = `
            <div class="glass-panel ${tool.border} p-5 rounded-2xl flex items-center space-x-4 cursor-pointer">
                <i class="fa-solid ${tool.icon} text-${tool.color}"></i>
                <div><h3>${tool.name}</h3><p>${tool.desc}</p></div>
            </div>`;
        grid.appendChild(card);
    });
});
