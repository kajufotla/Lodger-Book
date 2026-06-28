window.ActiveFiles = [];

// DOM Element Cache to minimize repetitive document queries and improve performance
const DOM = {
    get toast() { return document.getElementById('toast'); },
    get progContainer() { return document.getElementById('prog-container'); },
    get execBtn() { return document.getElementById('execute-btn'); },
    get progBar() { return document.getElementById('engine-progress-bar'); },
    get progText() { return document.getElementById('engine-progress-text'); },
    get fileListUi() { return document.getElementById('file-list-ui'); },
    get workspaceBox() { return document.getElementById('tool-workspace-box'); },
    get canvas() { return document.getElementById('canvas-content'); },
    get dropzone() { return document.getElementById('global-dropzone'); }
};

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

class Utility {
    static formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024, dm = decimals < 0 ? 0 : decimals, sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
}

class AppUI {
    static showToast(msg, type = 'success') {
        const t = DOM.toast;
        if(!t) return;
        let icon = 'fa-circle-check'; let bg = 'bg-emerald-600';
        if(type === 'error') { icon = 'fa-circle-exclamation'; bg = 'bg-red-500'; }
        if(type === 'warning') { icon = 'fa-triangle-exclamation'; bg = 'bg-amber-500'; }
        
        t.innerHTML = `<i class="fa-solid ${icon} text-lg"></i> <span>${msg}</span>`;
        t.className = `fixed bottom-6 right-6 px-6 py-4 rounded-xl text-white text-sm font-bold shadow-2xl flex items-center space-x-3 z-50 transition-all duration-300 transform translate-y-0 opacity-100 ${bg}`;
        
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => { 
            t.classList.remove('translate-y-0', 'opacity-100'); 
            t.classList.add('translate-y-20', 'opacity-0'); 
        }, 4000);
    }

    static resetProgress() {
        const pContainer = DOM.progContainer;
        if(pContainer) pContainer.style.display = 'none';
        const btn = DOM.execBtn;
        if(btn) { btn.disabled = false; btn.innerHTML = btn.dataset.originalText || 'Execute Module'; }
    }

    static updateProgress(percent) {
        requestAnimationFrame(() => {
            const bar = DOM.progBar;
            const txt = DOM.progText;
            if (bar) bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
            if (txt) txt.textContent = `${Math.round(percent)}% Processing...`;
        });
    }

    static renderComplexInput(tool, multiple = false, accept = ".pdf") {
        return `
            <div class="space-y-4 relative">
                <input type="file" id="active-file-input" ${multiple ? 'multiple' : ''} accept="${accept}" class="hidden" data-multiple="${multiple}">
                <label for="active-file-input" id="file-drop-area" class="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-${tool.color.split('-')[0]}-300 rounded-2xl bg-${tool.color.split('-')[0]}-50/30 hover:bg-${tool.color.split('-')[0]}-50 cursor-pointer transition relative overflow-hidden group">
                    <i class="fa-solid fa-cloud-arrow-up text-4xl text-${tool.color} mb-3 group-hover:scale-110 transition-transform"></i>
                    <p class="text-sm font-semibold text-slate-600">Click to upload or Drag & Drop</p>
                    <p class="text-xs text-slate-400 mt-1 font-medium tracking-wide">Accepts: ${accept.replace(/, /g, ', ')}</p>
                </label>
                <ul id="file-list-ui" class="space-y-2 max-h-48 overflow-y-auto pr-2"></ul>
            </div>`;
    }

    static validateFile(file, acceptStr) {
        if (!acceptStr || acceptStr === '*') return true;
        const acceptedTypes = acceptStr.split(',').map(s => s.trim().toLowerCase());
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        
        for (let type of acceptedTypes) {
            if (type.endsWith('/*')) {
                const baseType = type.split('/')[0];
                if (file.type.startsWith(baseType + '/')) return true;
            } else if (type === fileExt || type === file.type) {
                return true;
            }
        }
        return false;
    }

    static handleFiles(fileList, multiple, accept = ".pdf") {
        if (!fileList || fileList.length === 0) return;
        
        if (!multiple) {
            window.ActiveFiles = [];
            fileList = [fileList[0]]; 
        }
        
        let invalidCount = 0;
        
        for (let f of fileList) {
            if (!this.validateFile(f, accept)) {
                invalidCount++;
                continue;
            }
            if (!window.ActiveFiles.some(existing => existing.name === f.name && existing.size === f.size)) {
                window.ActiveFiles.push(f);
            }
        }
        
        if (invalidCount > 0) {
            this.showToast(`${invalidCount} file(s) ignored (invalid format).`, 'warning');
        }
        
        this.renderFileList();
    }

    static removeFile(index) {
        window.ActiveFiles.splice(index, 1);
        this.renderFileList();
    }

    static renderFileList() {
        const ui = DOM.fileListUi;
        if (!ui) return;
        
        const fragment = document.createDocumentFragment();
        
        window.ActiveFiles.forEach((f, i) => {
            const li = document.createElement('li');
            li.className = "flex justify-between items-center bg-white border border-slate-200 p-3 rounded-xl text-sm transition-all hover:border-slate-300 shadow-sm";
            
            const info = document.createElement('span');
            info.className = "truncate font-medium text-slate-700 flex-grow pr-4 flex items-center";
            
            let iconClass = f.type.startsWith('image/') ? 'fa-image text-blue-500' : 'fa-file-pdf text-red-500';
            
            info.innerHTML = `
                <i class="fa-solid ${iconClass} mr-3 text-lg"></i>
                <span class="truncate max-w-[180px] sm:max-w-[300px]">${f.name}</span>
                <span class="ml-auto pl-2 text-xs text-slate-400 font-normal whitespace-nowrap">${Utility.formatBytes(f.size)}</span>
            `;
            
            const btn = document.createElement('button');
            btn.className = "text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 ml-2";
            btn.setAttribute('aria-label', `Remove ${f.name}`);
            btn.innerHTML = `<i class="fa-solid fa-trash-can text-base"></i>`;
            btn.onclick = () => AppUI.removeFile(i);
            
            li.appendChild(info);
            li.appendChild(btn);
            fragment.appendChild(li);
        });
        
        ui.innerHTML = '';
        ui.appendChild(fragment);
    }

    static setupDragAndDrop(multiple, accept) {
        const dropArea = document.getElementById('file-drop-area');
        const globalDropzone = DOM.dropzone;
        const workspace = DOM.workspaceBox;
        
        if(!dropArea || !globalDropzone || !workspace) return;

        const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
            workspace.addEventListener(evt, preventDefaults, false);
            document.body.addEventListener(evt, preventDefaults, false);
        });

        let dragCounter = 0;

        document.body.addEventListener('dragenter', (e) => {
            dragCounter++;
            if (!workspace.classList.contains('hidden')) {
                globalDropzone.classList.remove('hidden');
                globalDropzone.classList.add('flex');
            }
        });

        document.body.addEventListener('dragleave', (e) => {
            dragCounter--;
            if (dragCounter === 0) {
                globalDropzone.classList.add('hidden');
                globalDropzone.classList.remove('flex');
            }
        });

        document.body.addEventListener('drop', (e) => {
            dragCounter = 0;
            globalDropzone.classList.add('hidden');
            globalDropzone.classList.remove('flex');
            
            if (!workspace.classList.contains('hidden') && e.dataTransfer.files) {
                AppUI.handleFiles(e.dataTransfer.files, multiple, accept);
            }
        });
    }

    static activateWorkspace(id, tool) {
        const box = DOM.workspaceBox;
        const canvas = DOM.canvas;
        window.ActiveFiles = []; 
        
        box.classList.remove('hidden');
        
        requestAnimationFrame(() => {
            canvas.className = "text-left space-y-6 opacity-0 translate-y-4 transition-all duration-300";
            
            canvas.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-${tool.color} text-white rounded-xl flex items-center justify-center text-xl shadow-md"><i class="fa-solid ${tool.icon}"></i></div>
                        <div><h2 class="text-xl font-extrabold text-slate-900">${tool.name}</h2><p class="text-sm text-slate-500">${tool.desc}</p></div>
                    </div>
                    <button onclick="document.getElementById('tool-workspace-box').classList.add('hidden'); window.ActiveFiles = [];" class="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition" aria-label="Close workspace"><i class="fa-solid fa-xmark text-lg"></i></button>
                </div>
                <hr class="border-slate-200">
                ${tool.render(tool)}
                
                <div id="prog-container" class="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner" style="display: none;">
                    <div class="flex justify-between text-sm font-bold mb-3 text-slate-700">
                        <span id="engine-progress-text">0% Processing...</span>
                        <button id="cancel-btn" class="text-red-500 hover:text-red-700 hover:underline transition font-semibold">Cancel Operation</button>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div id="engine-progress-bar" class="rounded-full h-full bg-${tool.color} transition-all duration-300 ease-out" style="width:0%"></div>
                    </div>
                </div>

                <button id="execute-btn" data-original-text="Execute ${tool.name}" class="w-full bg-${tool.color} hover:opacity-90 text-white text-base font-bold py-4 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-95">Execute ${tool.name}</button>
            `;
            
            requestAnimationFrame(() => {
                canvas.classList.remove('opacity-0', 'translate-y-4');
            });
            
            document.getElementById('cancel-btn')?.addEventListener('click', () => OperationState.cancel());
            document.getElementById('execute-btn')?.addEventListener('click', () => PDFEngine.execute(id));
            
            const fileInput = document.getElementById('active-file-input');
            const isMultiple = fileInput?.dataset.multiple === "true";
            const acceptType = fileInput?.getAttribute('accept') || '*';
            
            fileInput?.addEventListener('change', (e) => {
                AppUI.handleFiles(e.target.files, isMultiple, acceptType);
                e.target.value = ""; 
            });
            
            AppUI.setupDragAndDrop(isMultiple, acceptType);

            ['90', '180', '270'].forEach(angle => {
                document.getElementById(`btn-rot-${angle}`)?.addEventListener('click', () => {
                    const el = document.getElementById('rot-angle');
                    if (el) el.value = angle;
                });
            });

            box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}

class PDFEngine {
    static async downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url; 
        a.download = filename;
        document.body.appendChild(a); 
        a.click(); 
        
        setTimeout(() => {
            document.body.removeChild(a); 
            URL.revokeObjectURL(url);
        }, 150);
    }

    static parseRange(str, maxPages) {
        if (!str || !str.trim()) return Array.from({length: maxPages}, (_, i) => i);
        const pages = new Set();
        const parts = str.split(',').map(s => s.trim());
        
        for (const part of parts) {
            const bounds = part.split('-').map(n => parseInt(n.trim(), 10));
            if (bounds.length === 1 && !isNaN(bounds[0])) {
                pages.add(bounds[0] - 1);
            } else if (bounds.length === 2 && !isNaN(bounds[0]) && !isNaN(bounds[1])) {
                const start = Math.min(bounds[0], bounds[1]);
                const end = Math.max(bounds[0], bounds[1]);
                for (let i = start; i <= end; i++) {
                    pages.add(i - 1);
                }
            }
        }
        return Array.from(pages).filter(p => p >= 0 && p < maxPages).sort((a, b) => a - b);
    }

    static async processResizer(file) {
        const wInput = document.getElementById('img-w')?.value;
        const hInput = document.getElementById('img-h')?.value;
        const imgW = wInput ? parseInt(wInput, 10) : null;
        const imgH = hInput ? parseInt(hInput, 10) : null;
        const format = document.getElementById('img-format')?.value || 'image/jpeg';
        
        const qualityInput = document.getElementById('img-quality')?.value;
        const qualityNum = qualityInput ? parseInt(qualityInput, 10) / 100 : 0.92;
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(objectUrl); 
                const canvas = document.createElement('canvas');
                
                let finalW = img.width;
                let finalH = img.height;

                if (imgW && imgH) {
                    finalW = imgW;
                    finalH = imgH;
                } else if (imgW && !imgH) {
                    finalW = imgW;
                    finalH = Math.round(img.height * (imgW / img.width));
                } else if (!imgW && imgH) {
                    finalH = imgH;
                    finalW = Math.round(img.width * (imgH / img.height));
                }

                canvas.width = finalW;
                canvas.height = finalH;
                
                const ctx = canvas.getContext('2d', { alpha: format !== 'image/jpeg' });
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                ctx.drawImage(img, 0, 0, finalW, finalH);
                canvas.toBlob(blob => {
                    if (blob) resolve(blob);
                    else reject(new Error("Failed to process image."));
                }, format, qualityNum);
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Invalid or corrupted image file."));
            };
            img.src = objectUrl;
        });
    }

    static async loadPdfSafe(buffer) {
        try {
            return await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
        } catch (e) {
            if (e.message && e.message.toLowerCase().includes("encrypted")) {
                throw new Error("Cannot process password-protected or heavily encrypted PDFs.");
            }
            throw e;
        }
    }

    static async execute(id) {
        const signal = OperationState.start();
        const files = window.ActiveFiles;
        
        if (!files || files.length === 0) { 
            AppUI.showToast("Please upload file(s) first.", "error"); 
            return; 
        }
        
        const btn = DOM.execBtn;
        if(btn) {
            btn.disabled = true; 
            btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Processing...`; 
        }
        const progContainer = DOM.progContainer;
        if(progContainer) progContainer.style.display = 'block';

        try {
            let finalBlob = null; 
            let filename = `Output_${id}.pdf`;
            AppUI.updateProgress(5);

            if (id === 'resizer') {
                finalBlob = await this.processResizer(files[0]);
                const ext = document.getElementById('img-format').value.split('/')[1];
                const originalName = files[0].name.split('.').slice(0, -1).join('.');
                filename = `Resized_${originalName || 'Image'}.${ext}`;
            } 
            else if (id === 'merge') {
                const doc = await PDFLib.PDFDocument.create();
                for (let i = 0; i < files.length; i++) {
                    if(signal.aborted) throw new Error("Cancelled");
                    
                    const buffer = await files[i].arrayBuffer();
                    const src = await this.loadPdfSafe(buffer);
                    const pages = await doc.copyPages(src, src.getPageIndices()); 
                    
                    for (const p of pages) {
                        doc.addPage(p);
                    }
                    AppUI.updateProgress(5 + ((i+1)/files.length)*50);
                }
                AppUI.updateProgress(70);
                finalBlob = new Blob([await doc.save()], { type: 'application/pdf' });
                filename = `Merged_Document.pdf`;
            }
            else if (id === 'imgToPdf') {
                const doc = await PDFLib.PDFDocument.create();
                const sizeType = document.getElementById('pg-size')?.value || 'A4';
                const mode = document.getElementById('img-mode')?.value || 'fit';
                const isLandscape = document.getElementById('layout')?.value === 'landscape';
                
                let W = sizeType === 'A4' ? 595.28 : 612; 
                let H = sizeType === 'A4' ? 841.89 : 792;
                if(isLandscape) { [W, H] = [H, W]; }

                for (let i = 0; i < files.length; i++) {
                    if(signal.aborted) throw new Error("Cancelled");
                    const bytes = await files[i].arrayBuffer();
                    const fType = files[i].type;
                    
                    let img;
                    if (fType === 'image/png') img = await doc.embedPng(bytes);
                    else if (fType === 'image/jpeg' || fType === 'image/jpg') img = await doc.embedJpg(bytes);
                    else throw new Error(`Unsupported image type: ${fType}`);
                    
                    let pgW = W, pgH = H;
                    if (sizeType === 'Fit') { 
                        pgW = img.width; 
                        pgH = img.height; 
                    }
                    const page = doc.addPage([pgW, pgH]);
                    
                    if (sizeType === 'Fit') {
                        page.drawImage(img, { x: 0, y: 0, width: pgW, height: pgH });
                    } else if (mode === 'fill') {
                        page.drawImage(img, { x: 0, y: 0, width: W, height: H });
                    } else {
                        const scale = Math.min(W / img.width, H / img.height);
                        const fW = img.width * scale; 
                        const fH = img.height * scale;
                        page.drawImage(img, { x: (W - fW)/2, y: (H - fH)/2, width: fW, height: fH });
                    }
                    AppUI.updateProgress(5 + ((i+1)/files.length)*60);
                }
                AppUI.updateProgress(80);
                finalBlob = new Blob([await doc.save()], { type: 'application/pdf' });
                filename = `Images_to_PDF.pdf`;
            }
            else {
                const buffer = await files[0].arrayBuffer();
                const sourceDoc = await this.loadPdfSafe(buffer);
                const totalPages = sourceDoc.getPageCount();
                const baseName = files[0].name.split('.').slice(0, -1).join('.') || 'Document';
                AppUI.updateProgress(20);

                if (id === 'split') {
                    const mode = document.getElementById('split-mode')?.value;
                    const zip = new JSZip();
                    
                    if(mode === 'range') {
                        const targetStr = document.getElementById('pg-range-split')?.value;
                        const targetPages = this.parseRange(targetStr, totalPages);
                        if(targetPages.length === 0) throw new Error("No valid pages selected.");
                        
                        const newDoc = await PDFLib.PDFDocument.create();
                        const copied = await newDoc.copyPages(sourceDoc, targetPages);
                        copied.forEach(p => newDoc.addPage(p));
                        zip.file(`Extracted_Pages.pdf`, await newDoc.save());
                        AppUI.updateProgress(70);
                    } else {
                        for (let i = 0; i < totalPages; i++) {
                            if(signal.aborted) throw new Error("Cancelled");
                            const subDoc = await PDFLib.PDFDocument.create(); 
                            const [p] = await subDoc.copyPages(sourceDoc, [i]); 
                            subDoc.addPage(p);
                            zip.file(`Page_${i + 1}.pdf`, await subDoc.save());
                            AppUI.updateProgress(20 + ((i+1)/totalPages)*60);
                        }
                    }
                    finalBlob = await zip.generateAsync({type: "blob", compression: "STORE"});
                    filename = `Split_${baseName}.zip`;
                } 
                else if (id === 'extract') {
                    const inputVal = document.getElementById('pg-input-extract')?.value;
                    const pgNum = parseInt(inputVal, 10) - 1;
                    if(isNaN(pgNum) || pgNum < 0 || pgNum >= totalPages) {
                        throw new Error(`Invalid page number. Please select between 1 and ${totalPages}.`);
                    }
                    
                    const newDoc = await PDFLib.PDFDocument.create();
                    const [p] = await newDoc.copyPages(sourceDoc, [pgNum]); 
                    newDoc.addPage(p);
                    finalBlob = new Blob([await newDoc.save()], { type: 'application/pdf' });
                    filename = `Page_${pgNum + 1}_${files[0].name}`;
                }
                else {
                    if (id === 'del') {
                        const targets = this.parseRange(document.getElementById('pg-input-del')?.value, totalPages).reverse();
                        if(targets.length === 0) throw new Error("No valid pages to delete.");
                        if(targets.length === totalPages) throw new Error("Cannot delete all pages.");
                        targets.forEach(idx => sourceDoc.removePage(idx));
                        filename = `Edited_${files[0].name}`;
                    }
                    else if (id === 'reorder') {
                        const newDoc = await PDFLib.PDFDocument.create();
                        const allIndices = Array.from({length: totalPages}, (_, i) => totalPages - 1 - i);
                        
                        const batchSize = 50;
                        for(let i = 0; i < allIndices.length; i += batchSize) {
                            if(signal.aborted) throw new Error("Cancelled");
                            const batch = allIndices.slice(i, i + batchSize);
                            const copied = await newDoc.copyPages(sourceDoc, batch);
                            copied.forEach(p => newDoc.addPage(p));
                            AppUI.updateProgress(20 + (i/allIndices.length)*60);
                        }
                        
                        finalBlob = new Blob([await newDoc.save()], { type: 'application/pdf' });
                        filename = `Reversed_${files[0].name}`;
                    }
                    else {
                        let rangeId = null;
                        if (id === 'rotate') rangeId = 'pg-range-rotate';
                        if (id === 'numbers') rangeId = 'pg-range-numbers';
                        
                        const targetPages = this.parseRange(document.getElementById(rangeId)?.value, totalPages);
                        
                        if (id === 'rotate') {
                            const angleStr = document.getElementById('rot-angle')?.value;
                            const angle = parseInt(angleStr, 10) || 90;
                            targetPages.forEach(idx => {
                                const p = sourceDoc.getPage(idx);
                                const currentRot = p.getRotation().angle;
                                p.setRotation(PDFLib.degrees((currentRot + angle) % 360));
                            });
                            filename = `Rotated_${files[0].name}`;
                        }
                        else if (id === 'watermark') {
                            const text = document.getElementById('txt-input')?.value || "CONFIDENTIAL";
                            const pos = document.getElementById('wm-pos')?.value || 'center';
                            const size = parseInt(document.getElementById('wm-size')?.value, 10) || 48;
                            const opacityVal = parseInt(document.getElementById('wm-opacity')?.value, 10);
                            const op = isNaN(opacityVal) ? 0.3 : opacityVal / 100;
                            const ang = parseInt(document.getElementById('wm-rot')?.value, 10) || 45;
                            
                            const hexColor = document.getElementById('wm-color')?.value || '#cccccc';
                            const r = parseInt(hexColor.slice(1, 3), 16) / 255;
                            const g = parseInt(hexColor.slice(3, 5), 16) / 255;
                            const b = parseInt(hexColor.slice(5, 7), 16) / 255;
                            const color = PDFLib.rgb(r, g, b);
                            
                            const font = await sourceDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
                            const textWidth = font.widthOfTextAtSize(text, size);
                            const textHeight = font.heightAtSize(size);

                            targetPages.forEach(idx => {
                                const p = sourceDoc.getPage(idx);
                                const { width, height } = p.getSize();
                                
                                let x, y;
                                if(pos === 'center') {
                                    x = (width / 2) - (textWidth / 2);
                                    y = (height / 2) - (textHeight / 2);
                                } else if(pos === 'top-left') { 
                                    x = 50; 
                                    y = height - 50 - textHeight; 
                                } else if(pos === 'bottom-right') { 
                                    x = width - 50 - textWidth; 
                                    y = 50; 
                                }
                                
                                p.drawText(text, { 
                                    x, y, size, font, color, opacity: op, rotate: PDFLib.degrees(ang) 
                                });
                            });
                            filename = `Watermarked_${files[0].name}`;
                        }
                        else if (id === 'numbers') {
                            const sNum = parseInt(document.getElementById('start-num')?.value, 10) || 1;
                            const pos = document.getElementById('pos')?.value || 'bottom-right';
                            const formatStr = document.getElementById('num-format')?.value || 'n';
                            const font = await sourceDoc.embedFont(PDFLib.StandardFonts.Helvetica);

                            targetPages.forEach((idx, i) => {
                                const p = sourceDoc.getPage(idx);
                                const { width, height } = p.getSize();
                                
                                const currentNum = sNum + i;
                                let text = `${currentNum}`;
                                if (formatStr === 'Page n') text = `Page ${currentNum}`;
                                else if (formatStr === 'n of t') text = `${currentNum} of ${totalPages}`;
                                else if (formatStr === 'Page n of t') text = `Page ${currentNum} of ${totalPages}`;
                                
                                const textWidth = font.widthOfTextAtSize(text, 12);
                                
                                let x = width - 50 - textWidth, y = 30; 
                                if(pos === 'bottom-center') { x = (width / 2) - (textWidth / 2); }
                                if(pos === 'bottom-left') { x = 50; y = 30; }
                                if(pos === 'top-right') { y = height - 30; }
                                if(pos === 'top-center') { x = (width / 2) - (textWidth / 2); y = height - 30; }
                                if(pos === 'top-left') { x = 50; y = height - 30; }
                                
                                p.drawText(text, { x, y, size: 12, font, color: PDFLib.rgb(0, 0, 0) });
                            });
                            filename = `Numbered_${files[0].name}`;
                        }
                    }
                    
                    if(!finalBlob) {
                        AppUI.updateProgress(85);
                        finalBlob = new Blob([await sourceDoc.save()], { type: 'application/pdf' });
                    }
                }
            }
            
            AppUI.updateProgress(100);
            
            setTimeout(async () => {
                await this.downloadBlob(finalBlob, filename);
                AppUI.showToast("Processing Successful!", "success");
                AppUI.resetProgress();
            }, 300);
            
        } catch (error) { 
            if(error.message !== "Cancelled") {
                console.error("Engine Error:", error);
                AppUI.showToast(error.message || "An error occurred during processing.", 'error'); 
            }
            AppUI.resetProgress();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('tools-grid');
    if(grid && typeof ToolsConfig !== 'undefined') {
        const fragment = document.createDocumentFragment();
        
        Object.keys(ToolsConfig).forEach(key => {
            const tool = ToolsConfig[key];
            const card = document.createElement('a'); 
            card.href = `#tool-${key}`; 
            
            const baseColor = tool.color.split('-')[0];
            card.className = `glass-panel ${tool.border} p-6 rounded-2xl flex flex-col items-start space-y-4 cursor-pointer focus-visible:ring-4 focus-visible:ring-${baseColor}-300 outline-none group`;
            card.setAttribute('aria-label', `Open ${tool.name} tool`);
            
            card.addEventListener('click', (e) => { 
                e.preventDefault(); 
                AppUI.activateWorkspace(key, tool); 
            });
            
            card.innerHTML = `
                <div class="w-12 h-12 bg-${baseColor}-100 text-${tool.color} rounded-xl flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-110">
                    <i class="fa-solid ${tool.icon}"></i>
                </div>
                <div class="text-left w-full">
                    <h3 class="font-bold text-slate-800 text-lg mb-1 group-hover:text-${tool.color} transition-colors">${tool.name}</h3>
                    <p class="text-slate-500 text-sm line-clamp-2 leading-relaxed">${tool.desc}</p>
                </div>
            `;
            fragment.appendChild(card);
        });
        
        grid.appendChild(fragment);
    }
});
