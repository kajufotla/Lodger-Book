window.ActiveFiles = [];

class OperationState {
    static currentController = null;
    static start() {
        if (this.currentController) this.currentController.abort();
        this.currentController = new AbortController();
        return this.currentController.signal;
    }
    static cancel() {
        if (this.currentController) {
            this.currentController.abort();
            this.currentController = null;
            AppUI.showToast("Operation cancelled safely.", 'warning');
            AppUI.resetProgress();
        }
    }
}

class AppUI {
    static showToast(msg, type = 'success') {
        const t = document.getElementById('toast');
        if(!t) return;
        let icon = 'fa-circle-check'; let bg = 'bg-emerald-600';
        if(type === 'error') { icon = 'fa-circle-exclamation'; bg = 'bg-red-500'; }
        if(type === 'warning') { icon = 'fa-triangle-exclamation'; bg = 'bg-amber-500'; }
        
        t.innerHTML = `<i class="fa-solid ${icon} text-lg"></i> <span>${msg}</span>`;
        t.className = `fixed bottom-6 right-6 px-6 py-4 rounded-xl text-white text-sm font-bold shadow-2xl flex items-center space-x-3 z-50 transition-all duration-300 transform translate-y-0 opacity-100 ${bg}`;
        setTimeout(() => { t.classList.remove('translate-y-0', 'opacity-100'); t.classList.add('translate-y-20', 'opacity-0'); }, 4000);
    }

    static resetProgress() {
        const pContainer = document.getElementById('prog-container');
        if(pContainer) pContainer.style.display = 'none';
        const btn = document.getElementById('execute-btn');
        if(btn) { btn.disabled = false; btn.innerHTML = 'Execute Module'; }
    }

    static updateProgress(percent) {
        const bar = document.getElementById('engine-progress-bar');
        const txt = document.getElementById('engine-progress-text');
        if (bar) bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        if (txt) txt.textContent = `${Math.round(percent)}% Processing...`;
    }

    static renderComplexInput(tool, multiple = false, accept = ".pdf") {
        return `
            <div class="space-y-4">
                <input type="file" id="active-file-input" ${multiple ? 'multiple' : ''} accept="${accept}" class="hidden" data-multiple="${multiple}">
                <label for="active-file-input" class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-${tool.color.split('-')[0]}-300 rounded-2xl bg-${tool.color.split('-')[0]}-50/30 hover:bg-${tool.color.split('-')[0]}-50 cursor-pointer transition">
                    <i class="fa-solid fa-cloud-arrow-up text-3xl text-${tool.color} mb-2"></i>
                    <p class="text-sm font-semibold text-slate-600">Click to upload or Drag & Drop</p>
                </label>
                <ul id="file-list-ui" class="space-y-2 max-h-48 overflow-y-auto pr-2"></ul>
            </div>`;
    }

    static handleFiles(fileList, multiple) {
        if (!multiple) window.ActiveFiles = [];
        for (let f of fileList) {
            if (!window.ActiveFiles.some(existing => existing.name === f.name && existing.size === f.size)) {
                window.ActiveFiles.push(f);
            }
        }
        this.renderFileList();
    }

    static removeFile(index) {
        window.ActiveFiles.splice(index, 1);
        this.renderFileList();
    }

    static renderFileList() {
        const ui = document.getElementById('file-list-ui');
        if (!ui) return;
        ui.innerHTML = '';
        window.ActiveFiles.forEach((f, i) => {
            const li = document.createElement('li');
            li.className = "flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm";
            li.innerHTML = `<span class="truncate font-medium text-slate-700 w-4/5"><i class="fa-solid fa-file-lines text-slate-400 mr-2"></i>${f.name}</span>`;
            
            const btn = document.createElement('button');
            btn.className = "text-slate-400 hover:text-red-500 transition";
            btn.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
            btn.onclick = () => AppUI.removeFile(i);
            
            li.appendChild(btn);
            ui.appendChild(li);
        });
    }

    static activateWorkspace(id, tool) {
        const box = document.getElementById('tool-workspace-box');
        const canvas = document.getElementById('canvas-content');
        window.ActiveFiles = [];
        
        box.classList.remove('hidden');
        setTimeout(() => {
            canvas.className = "text-left space-y-6";
            canvas.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-${tool.color} text-white rounded-xl flex items-center justify-center text-xl shadow-md"><i class="fa-solid ${tool.icon}"></i></div>
                        <div><h2 class="text-xl font-extrabold text-slate-900">${tool.name}</h2><p class="text-sm text-slate-500">${tool.desc}</p></div>
                    </div>
                    <button onclick="document.getElementById('tool-workspace-box').classList.add('hidden')" class="text-slate-400 hover:text-slate-700"><i class="fa-solid fa-xmark text-xl"></i></button>
                </div>
                <hr class="border-slate-200">
                ${tool.render(tool)}
                
                <div id="prog-container" class="p-4 bg-slate-50 rounded-xl border border-slate-200" style="display: none;">
                    <div class="flex justify-between text-xs font-bold mb-2 text-slate-600">
                        <span id="engine-progress-text">0%</span>
                        <button id="cancel-btn" class="text-red-500 hover:underline">Cancel Operation</button>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-2">
                        <div id="engine-progress-bar" class="rounded-full h-2 bg-${tool.color} transition-all duration-300" style="width:0%"></div>
                    </div>
                </div>

                <button id="execute-btn" class="w-full bg-${tool.color} hover:opacity-90 text-white text-sm font-bold py-4 rounded-xl shadow-lg transition transform hover:-translate-y-0.5">Execute ${tool.name}</button>
            `;
            
            document.getElementById('cancel-btn')?.addEventListener('click', () => OperationState.cancel());
            document.getElementById('execute-btn')?.addEventListener('click', () => PDFEngine.execute(id));
            document.getElementById('active-file-input')?.addEventListener('change', (e) => {
                AppUI.handleFiles(e.target.files, e.target.dataset.multiple === "true");
                e.target.value = "";
            });

            ['90', '180', '270'].forEach(angle => {
                document.getElementById(`btn-rot-${angle}`)?.addEventListener('click', () => {
                    document.getElementById('rot-angle').value = angle;
                });
            });

            box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }
}

class PDFEngine {
    static async downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    static parseRange(str, maxPages) {
        if (!str || !str.trim()) return Array.from({length: maxPages}, (_, i) => i);
        const pages = new Set();
        str.split(',').forEach(part => {
            const bounds = part.split('-').map(n => parseInt(n.trim()));
            if (bounds.length === 1 && !isNaN(bounds[0])) pages.add(bounds[0] - 1);
            else if (bounds.length === 2 && !isNaN(bounds[0]) && !isNaN(bounds[1])) {
                for (let i = bounds[0]; i <= bounds[1]; i++) pages.add(i - 1);
            }
        });
        return Array.from(pages).filter(p => p >= 0 && p < maxPages).sort((a, b) => a - b);
    }

    static async processResizer(file) {
        const imgW = parseInt(document.getElementById('img-w')?.value);
        const imgH = parseInt(document.getElementById('img-h')?.value);
        const format = document.getElementById('img-format')?.value || 'image/jpeg';
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = imgW || img.width;
                canvas.height = imgH || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => resolve(blob), format, 0.9);
            };
            img.onerror = () => reject(new Error("Image processing failed."));
            img.src = URL.createObjectURL(file);
        });
    }

    static async execute(id) {
        const signal = OperationState.start();
        const files = window.ActiveFiles;
        if (!files || files.length === 0) { AppUI.showToast("Please upload file(s) first.", "error"); return; }
        
        const btn = document.getElementById('execute-btn');
        btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Processing...`; 
        document.getElementById('prog-container').style.display = 'block';

        try {
            let finalBlob = null; let filename = `Output_${id}.pdf`;
            AppUI.updateProgress(10);

            if (id === 'resizer') {
                finalBlob = await this.processResizer(files[0]);
                filename = `Resized_Image.${document.getElementById('img-format').value.split('/')[1]}`;
            } 
            else if (id === 'merge') {
                const doc = await PDFLib.PDFDocument.create();
                for (let i = 0; i < files.length; i++) {
                    if(signal.aborted) throw new Error("Cancelled");
                    const src = await PDFLib.PDFDocument.load(await files[i].arrayBuffer());
                    const pages = await doc.copyPages(src, src.getPageIndices()); 
                    pages.forEach(p => doc.addPage(p));
                    AppUI.updateProgress(10 + ((i+1)/files.length)*40);
                }
                finalBlob = new Blob([await doc.save()], { type: 'application/pdf' });
            }
            else if (id === 'imgToPdf') {
                const doc = await PDFLib.PDFDocument.create();
                const sizeType = document.getElementById('pg-size').value;
                const mode = document.getElementById('img-mode').value;
                let W = sizeType === 'A4' ? 595.28 : 612; let H = sizeType === 'A4' ? 841.89 : 792;
                if(document.getElementById('layout').value === 'landscape') { const t=W; W=H; H=t; }

                for (let i = 0; i < files.length; i++) {
                    if(signal.aborted) throw new Error("Cancelled");
                    const bytes = await files[i].arrayBuffer();
                    const fType = files[i].type;
                    let img = fType === 'image/png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
                    const page = doc.addPage([W, H]);
                    
                    if (mode === 'fill') {
                        page.drawImage(img, { x: 0, y: 0, width: W, height: H });
                    } else {
                        const scale = Math.min(W / img.width, H / img.height);
                        const fW = img.width * scale; const fH = img.height * scale;
                        page.drawImage(img, { x: (W - fW)/2, y: (H - fH)/2, width: fW, height: fH });
                    }
                    AppUI.updateProgress(10 + ((i+1)/files.length)*40);
                }
                finalBlob = new Blob([await doc.save()], { type: 'application/pdf' });
            }
            else {
                // Single PDF Operations (Split, Rotate, Del, Extract, Reorder, Watermark, Numbers)
                const sourceDoc = await PDFLib.PDFDocument.load(await files[0].arrayBuffer());
                const totalPages = sourceDoc.getPageCount();
                AppUI.updateProgress(30);

                if (id === 'split') {
                    const mode = document.getElementById('split-mode').value;
                    const zip = new JSZip();
                    if(mode === 'range') {
                        const targetPages = this.parseRange(document.getElementById('pg-range').value, totalPages);
                        const newDoc = await PDFLib.PDFDocument.create();
                        const copied = await newDoc.copyPages(sourceDoc, targetPages);
                        copied.forEach(p => newDoc.addPage(p));
                        zip.file(`Extracted.pdf`, await newDoc.save());
                    } else {
                        for (let i = 0; i < totalPages; i++) {
                            const subDoc = await PDFLib.PDFDocument.create(); 
                            const [p] = await subDoc.copyPages(sourceDoc, [i]); subDoc.addPage(p);
                            zip.file(`Page_${i + 1}.pdf`, await subDoc.save());
                            AppUI.updateProgress(30 + ((i+1)/totalPages)*40);
                        }
                    }
                    finalBlob = await zip.generateAsync({type: "blob"});
                    filename = `Split_Result.zip`;
                } 
                else if (id === 'extract') {
                    const pgNum = parseInt(document.getElementById('pg-input').value) - 1;
                    if(pgNum >= 0 && pgNum < totalPages) {
                        const newDoc = await PDFLib.PDFDocument.create();
                        const [p] = await newDoc.copyPages(sourceDoc, [pgNum]); newDoc.addPage(p);
                        finalBlob = new Blob([await newDoc.save()], { type: 'application/pdf' });
                    } else throw new Error("Invalid page number");
                }
                else {
                    // In-place modifications (Rotate, Delete, Reorder, Watermark, Numbers)
                    if (id === 'del') {
                        const targets = this.parseRange(document.getElementById('pg-input').value, totalPages).reverse();
                        targets.forEach(idx => sourceDoc.removePage(idx));
                    }
                    else if (id === 'reorder') {
                        const newDoc = await PDFLib.PDFDocument.create();
                        const allIndices = Array.from({length: totalPages}, (_, i) => totalPages - 1 - i);
                        const copied = await newDoc.copyPages(sourceDoc, allIndices);
                        copied.forEach(p => newDoc.addPage(p));
                        finalBlob = new Blob([await newDoc.save()], { type: 'application/pdf' });
                    }
                    else {
                        const targetPages = this.parseRange(document.getElementById('pg-range')?.value, totalPages);
                        
                        if (id === 'rotate') {
                            const angle = parseInt(document.getElementById('rot-angle').value) || 90;
                            targetPages.forEach(idx => {
                                const p = sourceDoc.getPage(idx);
                                p.setRotation(PDFLib.degrees((p.getRotation().angle + angle) % 360));
                            });
                        }
                        else if (id === 'watermark') {
                            const text = document.getElementById('txt-input').value || "CONFIDENTIAL";
                            const pos = document.getElementById('wm-pos').value;
                            const size = parseInt(document.getElementById('wm-size').value) || 48;
                            const op = parseInt(document.getElementById('wm-opacity').value)/100 || 0.3;
                            const ang = parseInt(document.getElementById('wm-rot').value) || 45;
                            
                            targetPages.forEach(idx => {
                                const p = sourceDoc.getPage(idx);
                                const { width, height } = p.getSize();
                                let x = width/4, y = height/2; // Center
                                if(pos === 'top-left') { x = 50; y = height - 50; }
                                if(pos === 'bottom-right') { x = width - 150; y = 50; }
                                p.drawText(text, { x, y, size, opacity: op, rotate: PDFLib.degrees(ang) });
                            });
                        }
                        else if (id === 'numbers') {
                            const sNum = parseInt(document.getElementById('start-num').value) || 1;
                            const pos = document.getElementById('pos').value;
                            targetPages.forEach((idx, i) => {
                                const p = sourceDoc.getPage(idx);
                                const { width, height } = p.getSize();
                                let x = width - 70, y = 30; // bottom-right
                                if(pos === 'bottom-center') { x = width/2; }
                                if(pos === 'top-right') { y = height - 30; }
                                p.drawText(`${sNum + i}`, { x, y, size: 12 });
                            });
                        }
                    }
                    
                    if(!finalBlob) finalBlob = new Blob([await sourceDoc.save()], { type: 'application/pdf' });
                }
            }
            
            AppUI.updateProgress(100);
            await this.downloadBlob(finalBlob, filename);
            AppUI.showToast("Processing Successful!", "success");
            
        } catch (error) { 
            if(error.message !== "Cancelled") AppUI.showToast(error.message || "An error occurred.", 'error'); 
        } finally { 
            AppUI.resetProgress();
        }
    }
}

// Initializing UI
window.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('tools-grid');
    if(grid && typeof ToolsConfig !== 'undefined') {
        Object.keys(ToolsConfig).forEach(key => {
            const tool = ToolsConfig[key];
            const card = document.createElement('a'); 
            card.href = `#tool-${key}`; 
            card.className = `glass-panel ${tool.border} p-6 rounded-2xl flex flex-col items-start space-y-4 cursor-pointer`;
            
            card.addEventListener('click', (e) => { 
                e.preventDefault(); 
                AppUI.activateWorkspace(key, tool); 
            });
            
            card.innerHTML = `
                <div class="w-12 h-12 bg-${tool.color}/10 text-${tool.color} rounded-xl flex items-center justify-center text-xl"><i class="fa-solid ${tool.icon}"></i></div>
                <div class="text-left w-full"><h3 class="font-bold text-slate-800 text-lg mb-1">${tool.name}</h3><p class="text-slate-500 text-sm line-clamp-2">${tool.desc}</p></div>
            `;
            grid.appendChild(card);
        });
    }
});
