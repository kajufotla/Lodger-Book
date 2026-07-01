/**
 * Main Script - PDFExpert Suite
 * Enterprise-level code architecture with modular tool loading.
 */

'use strict';

// ==========================================
// 1. MAIN ROUTING & UI NAVIGATION LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const toolButtons = document.querySelectorAll('[data-tool]');
    const mainHeader = document.getElementById('main-header');
    const ourTools = document.getElementById('our-tools');
    const heroToolPanel = document.getElementById('hero-tool-panel');
    const canvasContent = document.getElementById('canvas-content');

    // Handle tool button clicks
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const toolName = btn.getAttribute('data-tool');
            openTool(toolName);
        });
    });

    // Global function to open a specific tool
    window.openTool = function(toolName) {
        // Hide homepage elements smoothly
        if(mainHeader) mainHeader.classList.add('hidden');
        if(ourTools) ourTools.classList.add('hidden');
        
        // Show the tool workspace panel
        if(heroToolPanel) {
            heroToolPanel.classList.remove('hidden');
            heroToolPanel.style.display = 'flex'; 
            // Small delay to allow CSS transitions to trigger
            setTimeout(() => { heroToolPanel.style.opacity = '1'; }, 50);
        }

        // Modular Loading: Route to specific tool logic
        if (toolName === 'pdf-compress') {
            loadPDFCompressorTool();
        } 
        // آپ یہاں باقی ٹولز کی کنڈیشنز لگا سکتے ہیں (مثلاً: else if (toolName === 'merge-pdf'))
        else {
            canvasContent.innerHTML = `
                <div class="text-center p-10 animate-fade-in-up">
                    <div class="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto text-2xl mb-4">
                        <i class="fa-solid fa-person-digging"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-slate-800">Module: ${toolName}</h2>
                    <p class="mt-2 text-slate-500">This module is currently active or loaded via a separate script.</p>
                </div>`;
        }
    };

    // Global function to close tool and return to home
    window.closeTool = function() {
        if(heroToolPanel) {
            heroToolPanel.style.opacity = '0'; // Fade out
            setTimeout(() => {
                heroToolPanel.classList.add('hidden');
                heroToolPanel.style.display = 'none';
                
                // Show homepage elements
                if(mainHeader) mainHeader.classList.remove('hidden');
                if(ourTools) ourTools.classList.remove('hidden');
                
                // Clear canvas to trigger strict memory garbage collection
                canvasContent.innerHTML = ''; 
                
                // Reset compressor instance if it exists
                if(window.pdfCompressorApp) {
                    window.pdfCompressorApp = null;
                }
            }, 300);
        }
    };
});

// ==========================================
// 2. PDF COMPRESSOR UI INJECTION MODULE
// ==========================================
function loadPDFCompressorTool() {
    const canvas = document.getElementById('canvas-content');
    
    // Inject the tool's HTML structure into the canvas
    canvas.innerHTML = `
        <div class="space-y-6 animate-fade-in-up">
            <div class="text-center">
                <h2 class="text-2xl font-bold text-slate-800">Compress PDF</h2>
                <p class="text-sm text-slate-500 mt-1">Reduce file size client-side while optimizing for maximal quality.</p>
            </div>

            <div id="error-message" class="hidden bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200 font-medium"></div>

            <div id="drop-zone" class="border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[220px]">
                <i class="fa-solid fa-cloud-arrow-up text-5xl text-blue-500 mb-4 drop-shadow-sm"></i>
                <h3 class="text-lg font-bold text-slate-700">Click or Drag PDF here</h3>
                <p class="text-sm text-slate-500 mt-2">Maximum file size: 150MB</p>
                <input type="file" id="file-input" class="hidden" accept="application/pdf">
            </div>

            <div id="file-info" class="hidden space-y-5 mt-6">
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <div class="flex items-center space-x-3 overflow-hidden pr-4">
                        <i class="fa-solid fa-file-pdf text-red-500 text-2xl"></i>
                        <span id="file-name" class="font-semibold text-slate-700 truncate"></span>
                    </div>
                    <span id="file-size" class="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm whitespace-nowrap"></span>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-4 items-end">
                    <div class="w-full sm:w-1/2">
                        <label class="block text-sm font-semibold text-slate-700 mb-2">Compression Engine Level</label>
                        <select id="compression-level" class="w-full bg-white border border-slate-300 text-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition font-medium shadow-sm">
                            <option value="low">Low (High Quality, Less Compression)</option>
                            <option value="medium" selected>Medium (Balanced Optimization)</option>
                            <option value="high">High (Lower Quality, Smallest File)</option>
                        </select>
                    </div>
                    <button id="compress-btn" class="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 h-[50px]">
                        <i class="fa-solid fa-compress"></i>
                        <span>Start Compression</span>
                    </button>
                </div>
            </div>

            <div id="progress-container" class="hidden space-y-3 mt-6 p-6 border border-slate-100 rounded-2xl bg-slate-50/50">
                <div class="flex justify-between text-sm font-bold text-blue-700">
                    <span id="progress-text">Initializing engine...</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div id="progress-bar" class="bg-blue-600 h-3 rounded-full transition-all duration-300 w-0"></div>
                </div>
            </div>

            <div id="result-container" class="hidden bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-5 mt-6 shadow-sm">
                <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
                    <i class="fa-solid fa-check-double"></i>
                </div>
                <h3 class="text-2xl font-extrabold text-slate-800">Task Completed Successfully!</h3>
                
                <div class="flex flex-wrap justify-center gap-4 text-sm mt-4">
                    <div class="bg-white px-5 py-3 rounded-xl border border-emerald-100 shadow-sm w-36">
                        <span class="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">New File Size</span>
                        <span id="compressed-size" class="font-extrabold text-slate-800 text-lg"></span>
                    </div>
                    <div class="bg-white px-5 py-3 rounded-xl border border-emerald-100 shadow-sm w-36">
                        <span class="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Saved</span>
                        <span id="compression-ratio" class="font-extrabold text-emerald-600 text-lg"></span>
                    </div>
                </div>
                
                <button id="download-btn" class="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md hover:shadow-xl w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-lg">
                    <i class="fa-solid fa-file-arrow-down"></i>
                    <span>Download Compressed PDF</span>
                </button>
            </div>
        </div>
    `;

    // Initialize the Class logic after injecting the HTML
    window.pdfCompressorApp = new PDFCompressorApp();
}

// ==========================================
// 3. CORE LOGIC: PDF COMPRESSOR APP CLASS
// ==========================================
class PDFCompressorApp {
    constructor() {
        // --- Configuration ---
        this.MAX_FILE_SIZE = 150 * 1024 * 1024; // 150 MB
        this.ALLOWED_TYPES = ['application/pdf'];
        
        // ARCHITECTURE SWITCH
        this.USE_BACKEND_API = false; 
        this.API_ENDPOINT = '/.netlify/functions/compress-pdf'; 

        // --- State Management ---
        this.currentFile = null;
        this.currentArrayBuffer = null;
        this.compressedBlob = null;
        this.isProcessing = false;

        this.initializeElements();

        if (this.dropZone && this.fileInput) {
            this.bindEvents();
        } else {
            console.error('PDFCompressorApp: Required DOM elements are missing.');
        }
    }

    initializeElements() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.fileNameDisplay = document.getElementById('file-name');
        this.fileSizeDisplay = document.getElementById('file-size');
        this.fileInfoContainer = document.getElementById('file-info');
        this.compressionLevelSelect = document.getElementById('compression-level');
        this.compressBtn = document.getElementById('compress-btn');
        this.progressBarContainer = document.getElementById('progress-container');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.resultContainer = document.getElementById('result-container');
        this.downloadBtn = document.getElementById('download-btn');
        this.compressedSizeDisplay = document.getElementById('compressed-size');
        this.compressionRatioDisplay = document.getElementById('compression-ratio');
        this.errorMessage = document.getElementById('error-message');
    }

    bindEvents() {
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        this.dropZone.addEventListener('click', () => {
            if (!this.isProcessing) this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) this.handleFile(e.target.files[0]);
            this.fileInput.value = ''; 
        });

        if (this.compressBtn) {
            this.compressBtn.addEventListener('click', this.processCompression.bind(this));
        }
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', this.handleDownload.bind(this));
        }
    }

    handleDragOver(e) { e.preventDefault(); if (!this.isProcessing) this.dropZone.classList.add('border-blue-500', 'bg-blue-100'); }
    handleDragLeave(e) { e.preventDefault(); this.dropZone.classList.remove('border-blue-500', 'bg-blue-100'); }
    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('border-blue-500', 'bg-blue-100');
        if (this.isProcessing) return;
        const files = e.dataTransfer.files;
        if (files.length > 0) this.handleFile(files[0]);
    }

    async handleFile(file) {
        this.resetUI();

        if (!this.ALLOWED_TYPES.includes(file.type)) {
            this.showError('Invalid format. Please upload a valid PDF document.');
            return;
        }
        if (file.size > this.MAX_FILE_SIZE) {
            this.showError(`File exceeds maximum size of ${this.formatBytes(this.MAX_FILE_SIZE)}.`);
            return;
        }
        if (file.size === 0) {
            this.showError('The selected file is empty or corrupted.');
            return;
        }

        this.currentFile = file;
        this.fileNameDisplay.textContent = file.name;
        this.fileSizeDisplay.textContent = this.formatBytes(file.size);
        this.fileInfoContainer.style.display = 'block';
        this.dropZone.style.display = 'none'; // Hide dropzone after file selection for cleaner UI
        this.compressBtn.disabled = false;

        if (!this.USE_BACKEND_API) {
            try {
                this.currentArrayBuffer = await this.readFileAsync(file);
            } catch (error) {
                this.showError('Error reading file. Please try again.');
                this.compressBtn.disabled = true;
            }
        }
    }

    async processCompression() {
        if (!this.currentFile || this.isProcessing) return;

        this.setProcessingState(true);
        const level = this.compressionLevelSelect ? this.compressionLevelSelect.value : 'medium';

        try {
            if (this.USE_BACKEND_API) {
                await this.processViaBackend(level);
            } else {
                await this.processViaClient(level);
            }
        } catch (error) {
            console.error('Compression Error:', error);
            this.showError(error.message || 'Optimization failed. The file may be broken or protected.');
            this.setProcessingState(false);
            this.dropZone.style.display = 'flex'; // Show dropzone again on error
        }
    }

    async processViaBackend(level) {
        this.updateProgress(10, 'Uploading securely...');
        const formData = new FormData();
        formData.append('pdf', this.currentFile);
        formData.append('level', level);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', this.API_ENDPOINT, true);
            xhr.responseType = 'blob';

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 50; 
                    this.updateProgress(percentComplete, 'Uploading securely...');
                }
            };

            xhr.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = 50 + ((e.loaded / e.total) * 50);
                    this.updateProgress(percentComplete, 'Optimizing images and layout...');
                } else {
                    this.updateProgress(75, 'Engine compressing file...');
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    this.compressedBlob = xhr.response;
                    this.updateProgress(100, 'Optimization Complete!');
                    setTimeout(() => { this.showResults(); resolve(); }, 400);
                } else {
                    reject(new Error('Server failed to process the PDF.'));
                }
            };

            xhr.onerror = () => reject(new Error('Network error occurred during API connection.'));
            xhr.send(formData);
        });
    }

    async processViaClient(level) {
        if (typeof PDFLib === 'undefined') throw new Error('pdf-lib engine is not loaded.');

        const { PDFDocument } = PDFLib;
        const yieldThread = () => new Promise(r => setTimeout(r, 20));

        this.updateProgress(20, 'Parsing document structures...');
        await yieldThread();

        const originalDoc = await PDFDocument.load(this.currentArrayBuffer, { ignoreEncryption: true, updateMetadata: false });
        await yieldThread();

        this.updateProgress(50, 'Removing dead objects & garbage collection...');
        const compressedDoc = await PDFDocument.create();
        const copiedPages = await compressedDoc.copyPages(originalDoc, originalDoc.getPageIndices());
        for (const page of copiedPages) compressedDoc.addPage(page);
        await yieldThread();

        this.updateProgress(75, 'Applying object stream compression...');
        if (level === 'high' || level === 'medium') {
            compressedDoc.setTitle('');
            compressedDoc.setAuthor('');
            compressedDoc.setSubject('');
            compressedDoc.setKeywords([]);
            compressedDoc.setCreator('');
            compressedDoc.setProducer('PDFExpert Engine');
        }

        const bytes = await compressedDoc.save({ useObjectStreams: true, addDefaultPage: false });
        this.compressedBlob = new Blob([bytes], { type: 'application/pdf' });
        
        // Strict memory cleanup
        originalDoc.catalog = null; compressedDoc.catalog = null;
        await yieldThread();

        this.updateProgress(100, 'Optimization Complete!');
        setTimeout(() => this.showResults(), 400);
    }

    showResults() {
        const originalSize = this.currentFile.size;
        const newSize = this.compressedBlob.size;
        let reductionPercentage = ((originalSize - newSize) / originalSize) * 100;
        
        if (reductionPercentage <= 0) {
            reductionPercentage = 0;
            this.compressionRatioDisplay.textContent = 'Already Highly Optimized';
            this.compressionRatioDisplay.style.color = '#f59e0b'; 
        } else {
            this.compressionRatioDisplay.textContent = `${reductionPercentage.toFixed(1)}%`;
            this.compressionRatioDisplay.style.color = '#10b981'; 
        }

        this.compressedSizeDisplay.textContent = this.formatBytes(newSize);
        this.progressBarContainer.style.display = 'none';
        this.fileInfoContainer.style.display = 'none';
        this.resultContainer.style.display = 'block';
        this.setProcessingState(false);
    }

    handleDownload() {
        if (!this.compressedBlob || !this.currentFile) return;

        const url = window.URL.createObjectURL(this.compressedBlob);
        const a = document.createElement('a');
        const originalName = this.currentFile.name;
        const nameWithoutExt = originalName.lastIndexOf('.pdf') !== -1 ? originalName.substring(0, originalName.lastIndexOf('.pdf')) : originalName;
        
        a.href = url;
        a.download = `${nameWithoutExt}_optimized.pdf`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
    }

    readFileAsync(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => { reader.abort(); reject(new Error('Browser failed to read the file.')); };
            reader.readAsArrayBuffer(file);
        });
    }

    setProcessingState(isProcessing) {
        this.isProcessing = isProcessing;
        this.compressBtn.disabled = isProcessing;
        if (this.compressionLevelSelect) this.compressionLevelSelect.disabled = isProcessing;
        if (isProcessing) {
            this.errorMessage.style.display = 'none';
            this.resultContainer.style.display = 'none';
            this.progressBarContainer.style.display = 'block';
        }
    }

    resetUI() {
        this.currentFile = null;
        this.currentArrayBuffer = null;
        this.compressedBlob = null;
        this.fileInfoContainer.style.display = 'none';
        this.resultContainer.style.display = 'none';
        this.progressBarContainer.style.display = 'none';
        this.errorMessage.style.display = 'none';
        this.dropZone.style.display = 'flex';
        this.compressBtn.disabled = true;
        this.updateProgress(0, 'Waiting...');
    }

    updateProgress(pct, text) {
        if (this.progressBar && this.progressText) {
            const percentage = Math.min(Math.max(pct, 0), 100);
            this.progressBar.style.width = `${percentage}%`;
            this.progressText.textContent = text;
        }
    }

    showError(msg) {
        if (this.errorMessage) {
            this.errorMessage.textContent = msg;
            this.errorMessage.style.display = 'block';
            setTimeout(() => this.errorMessage.style.display = 'none', 7000);
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
