/**
 * Professional PDF Compressor Utility - Hybrid Architecture
 * Supports Client-Side Structural Optimization & Server-Side Deep Compression.
 */

'use strict';

class PDFCompressorApp {
    constructor() {
        // --- Configuration ---
        this.MAX_FILE_SIZE = 150 * 1024 * 1024; // 150 MB
        this.ALLOWED_TYPES = ['application/pdf'];
        
        // ARCHITECTURE SWITCH: Set to true when you have a backend/API ready
        this.USE_BACKEND_API = false; 
        // Example endpoint (e.g., a Netlify Function acting as a proxy to CloudConvert/API2PDF)
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

    handleDragOver(e) { e.preventDefault(); if (!this.isProcessing) this.dropZone.classList.add('drag-active'); }
    handleDragLeave(e) { e.preventDefault(); this.dropZone.classList.remove('drag-active'); }
    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('drag-active');
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
        }
    }

    // --- PRO MODE: Deep Image & DPI Compression via API ---
    async processViaBackend(level) {
        this.updateProgress(10, 'Uploading securely...');
        
        const formData = new FormData();
        formData.append('pdf', this.currentFile);
        formData.append('level', level);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', this.API_ENDPOINT, true);
            xhr.responseType = 'blob';

            // Upload Progress
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 50; // Upload is first 50%
                    this.updateProgress(percentComplete, 'Uploading securely...');
                }
            };

            // Download/Processing Progress
            xhr.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = 50 + ((e.loaded / e.total) * 50); // Download is next 50%
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

    // --- FALLBACK MODE: Pure JS Structural Optimization ---
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
            compressedDoc.setProducer('PDF Optimizer Engine');
        }

        const bytes = await compressedDoc.save({ useObjectStreams: true, addDefaultPage: false });
        this.compressedBlob = new Blob([bytes], { type: 'application/pdf' });
        
        // Strict memory cleanup
        originalDoc.catalog = null; compressedDoc.catalog = null;
        await yieldThread();

        this.updateProgress(100, 'Optimization Complete!');
        setTimeout(() => this.showResults(), 400);
    }

    // --- Core Utilities ---
    showResults() {
        const originalSize = this.currentFile.size;
        const newSize = this.compressedBlob.size;
        let reductionPercentage = ((originalSize - newSize) / originalSize) * 100;
        
        if (reductionPercentage <= 0) {
            reductionPercentage = 0;
            this.compressionRatioDisplay.textContent = 'Already Highly Optimized';
            this.compressionRatioDisplay.style.color = '#f59e0b'; 
        } else {
            this.compressionRatioDisplay.textContent = `Reduced by ${reductionPercentage.toFixed(2)}%`;
            this.compressionRatioDisplay.style.color = '#10b981'; 
        }

        this.compressedSizeDisplay.textContent = this.formatBytes(newSize);
        this.progressBarContainer.style.display = 'none';
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

document.addEventListener('DOMContentLoaded', () => {
    window.pdfCompressorApp = new PDFCompressorApp();
});
