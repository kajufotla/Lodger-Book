const { PDFDocument, rgb, degrees } = PDFLib;

class AppUI {
    static showToast(msg, type = 'success') {
        const t = document.getElementById('toast');
        const isError = type === 'error';
        t.innerHTML = isError 
            ? `<i class="fa-solid fa-circle-exclamation text-sm"></i> <span>${msg}</span>` 
            : `<i class="fa-solid fa-circle-check text-sm"></i> <span>${msg}</span>`;
        t.className = `fixed bottom-6 right-6 px-5 py-3 rounded-xl text-white text-xs font-semibold shadow-2xl flex items-center space-x-2 z-50 transition-all duration-300 transform translate-y-0 opacity-100 ${isError ? 'bg-red-500 shadow-red-200/50' : 'bg-emerald-600 shadow-emerald-200/50'}`;
        setTimeout(() => { t.classList.remove('translate-y-0', 'opacity-100'); t.classList.add('translate-y-20', 'opacity-0'); }, 4000);
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
        if(!input.files || input.files.length === 0) return;
        const file = input.files[0];
        if(!file.type.startsWith('image/')) { this.showToast("Please select a valid image.", 'error'); return; }
        const img = new Image();
        img.onload = () => { document.getElementById('img-w').value = img.width; document.getElementById('img-h').value = img.height; }
        img.src = URL.createObjectURL(file);
    }
}

class PDFEngine {
    static async downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    static async execute(id, toolDef) {
        const input = document.getElementById('active-file-input');
        const btn = document.getElementById('execute-btn');
        if(!input || !input.files || input.files.length === 0) throw new Error("Please upload a required file to begin.");
        
        const originalBtnText = btn.innerHTML;
        btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Processing...`; btn.classList.add('opacity-70', 'cursor-not-allowed');

        try {
            let finalBlob = null; let filename = `Output_${id}.pdf`;
            if (id === 'resizer') { finalBlob = await this.processResizer(input.files[0]); filename = `Resized_Image.${document.getElementById('img-format').value.split('/')[1]}`; } 
            else if (id === 'imgToPdf') { finalBlob = await this.processImagesToPdf(input.files); } 
            else if (id === 'merge') { finalBlob = await this.processMerge(input.files); } 
            else {
                const fileBytes = await input.files[0].arrayBuffer();
                const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
                finalBlob = await this.processSinglePDF(id, pdfDoc);
                if(id === 'split') filename = `Split_Pages.zip`;
            }
            if (finalBlob) { await this.downloadBlob(finalBlob, filename); AppUI.showToast("Operation completed successfully!"); }
        } catch (error) { AppUI.showToast(error.message, 'error'); } 
        finally { btn.disabled = false; btn.innerHTML = originalBtnText; btn.classList.remove('opacity-70', 'cursor-not-allowed'); }
    }

    static async processResizer(file) {
        const w = parseInt(document.getElementById('img-w').value), h = parseInt(document.getElementById('img-h').value), format = document.getElementById('img-format').value;
        if (!w || !h || w <= 0 || h <= 0) throw new Error("Invalid dimensions specified.");
        const img = await new Promise((resolve, reject) => { const imgEl = new Image(); imgEl.onload = () => resolve(imgEl); imgEl.onerror = () => reject(new Error("Failed to decode image.")); imgEl.src = URL.createObjectURL(file); });
        const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { alpha: format !== 'image/jpeg' });
        if(format === 'image/jpeg') { ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, w, h); }
        ctx.drawImage(img, 0, 0, w, h);
        return await new Promise(resolve => canvas.toBlob(resolve, format, 0.92));
    }

    static async processImagesToPdf(files) {
        const doc = await PDFDocument.create(); const A4_WIDTH = 595.28, A4_HEIGHT = 841.89;
        for (let f of files) {
            const bytes = await f.arrayBuffer(); let img;
            if (f.type === 'image/png') img = await doc.embedPng(bytes); else if (f.type === 'image/jpeg' || f.type === 'image/jpg') img = await doc.embedJpg(bytes); else continue;
            const scale = Math.min(A4_WIDTH / img.width, A4_HEIGHT / img.height);
            const scaledWidth = img.width * scale, scaledHeight = img.height * scale;
            const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
            page.drawImage(img, { x: (A4_WIDTH / 2) - (scaledWidth / 2), y: (A4_HEIGHT / 2) - (scaledHeight / 2), width: scaledWidth, height: scaledHeight });
        }
        const pdfBytes = await doc.save(); return new Blob([pdfBytes], { type: 'application/pdf' });
    }

    static async processMerge(files) {
        const doc = await PDFDocument.create();
        for (let f of files) {
            const bytes = await f.arrayBuffer(); const src = await PDFDocument.load(bytes);
            const pages = await doc.copyPages(src, src.getPageIndices()); pages.forEach(p => doc.addPage(p));
        }
        const pdfBytes = await doc.save(); return new Blob([pdfBytes], { type: 'application/pdf' });
    }

    static async processSinglePDF(id, sourceDoc) {
        const totalPages = sourceDoc.getPageCount();
        if (id === 'split') {
            const zip = new JSZip();
            for (let i = 0; i < totalPages; i++) {
                const subDoc = await PDFDocument.create(); const [p] = await subDoc.copyPages(sourceDoc, [i]); subDoc.addPage(p);
                const subBytes = await subDoc.save(); zip.file(`Page_${i + 1}.pdf`, subBytes);
            }
            return await zip.generateAsync({type: "blob"});
        } 
        if (id === 'rotate') { sourceDoc.getPages().forEach(p => p.setRotation(degrees((p.getRotation().angle + 90) % 360))); } 
        else if (id === 'del') { const idx = parseInt(document.getElementById('pg-input').value) - 1; if (isNaN(idx) || idx < 0 || idx >= totalPages) throw new Error("Invalid page index."); if (totalPages <= 1) throw new Error("Cannot delete the last remaining page."); sourceDoc.removePage(idx); } 
        else if (id === 'extract') { const idx = parseInt(document.getElementById('pg-input').value) - 1; if (isNaN(idx) || idx < 0 || idx >= totalPages) throw new Error("Invalid page index."); const newDoc = await PDFDocument.create(); const [extracted] = await newDoc.copyPages(sourceDoc, [idx]); newDoc.addPage(extracted); sourceDoc = newDoc; } 
        else if (id === 'reorder') { const newDoc = await PDFDocument.create(); for (let i = totalPages - 1; i >= 0; i--) { const [p] = await newDoc.copyPages(sourceDoc, [i]); newDoc.addPage(p); } sourceDoc = newDoc; } 
        else if (id === 'watermark') { const text = document.getElementById('txt-input').value || "CONFIDENTIAL"; sourceDoc.getPages().forEach(p => { const { width, height } = p.getSize(); p.drawText(text, { x: width / 4, y: height / 2, size: 48, color: rgb(0.8, 0.8, 0.8), opacity: 0.3, rotate: degrees(45) }); }); } 
        else if (id === 'numbers') { sourceDoc.getPages().forEach((p, i) => { const { width } = p.getSize(); p.drawText(`${i + 1} / ${totalPages}`, { x: width - 70, y: 30, size: 12, color: rgb(0, 0, 0) }); }); }
        const pdfBytes = await sourceDoc.save(); return new Blob([pdfBytes], { type: 'application/pdf' });
    }
}

// اب چونکہ سکرپٹ الگ فائل میں ہے، اس لیے ہم ایونٹ لسنر شامل کر رہے ہیں تاکہ ایچ ٹی ایم ایل لوڈ ہونے کے بعد گرڈ بنے۔
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('tools-grid');
    if (grid && typeof ToolsConfig !== 'undefined') {
        Object.keys(ToolsConfig).forEach(key => {
            const tool = ToolsConfig[key];
            const card = document.createElement('a');
            card.href = `#tool-${key}`;
            card.className = `glass-panel ${tool.border} p-5 rounded-2xl flex items-center space-x-4 hover:shadow-md transition-all duration-300 group cursor-pointer border border-slate-100`;
            card.onclick = (e) => { e.preventDefault(); activateWorkspace(key); history.pushState(null, null, `#tool-${key}`); };
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
});

window.activateWorkspace = function(id) {
    const box = document.getElementById('tool-workspace-box');
    const canvas = document.getElementById('canvas-content');
    const tool = ToolsConfig[id];
    
    box.style.opacity = '0';
    box.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
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
        box.style.opacity = '1'; box.style.transform = 'scale(1)';
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
}
