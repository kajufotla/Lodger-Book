/**
 * Main Script - PDFExpert Suite
 * Enterprise-level code architecture with modular tool loading.
 * Module: Compress PDF (compress-pdf)
 */

'use strict';

// Register the tool into the Global Core Framework immediately for dynamic rendering
(function() {
    const toolId = 'compress-pdf';
    window.ToolsRegistry[toolId] = window.ToolsRegistry[toolId] || {};

    // This is the core bridge function that your root script calls when the user clicks 'Execute'
    window.ToolsRegistry[toolId].process = async function (files, engine, ui, PDFDocument) {
        if (!files || files.length === 0) {
            throw new Error("Please upload required file(s).");
        }

        // Instantiating your full class enterprise layout contextually
        if (!window.pdfCompressorApp) {
            window.pdfCompressorApp = new PDFCompressorApp();
        }

        // Inject the selected file directly into your app instance's lifecycle
        await window.pdfCompressorApp.handleFile(files[0]);

        // Trigger your exact internal core compression algorithm
        const selectElement = document.getElementById('compression-level');
        const level = selectElement ? selectElement.value : 'medium';
        
        // Execute the exact client-side logic you wrote
        return await window.pdfCompressorApp.processViaClient(level, ui, PDFDocument);
    };

    // Global workspace cleanup hook requested by root architecture
    window.ToolsRegistry[toolId].cleanup = function () {
        if (window.pdfCompressorApp) {
            window.pdfCompressorApp.resetUI();
            window.pdfCompressorApp = null;
        }
    };
})();

// ==========================================
// CORE LOGIC: PDF COMPRESSOR APP CLASS (Your Exact Full Code)
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
    }

    initializeElements() {
        // Elements map to your index.html dropdown and result container
        this.compressionLevelSelect = document.getElementById('compression-level');
        this.compressedSizeDisplay = document.getElementById('compressed-size');
        this.compressionRatioDisplay = document.getElementById('compression-ratio');
        
        // Dynamic elements safely resolved from the view block
        this.resultsPanel = document.getElementById('compressor-results');
    }

    async handleFile(file) {
        if (!this.ALLOWED_TYPES.includes(file.type)) {
            throw new Error('Invalid format. Please upload a valid PDF document.');
        }
        if (file.size > this.MAX_FILE_SIZE) {
            throw new Error(`File exceeds maximum size of ${this.formatBytes(this.MAX_FILE_SIZE)}.`);
        }
        if (file.size === 0) {
            throw new Error('The selected file is empty or corrupted.');
        }

        this.currentFile = file;

        if (!this.USE_BACKEND_API) {
            try {
                this.currentArrayBuffer = await this.readFileAsync(file);
            } catch (error) {
                throw new Error('Error reading file. Please try again.');
            }
        }
    }

    async processViaClient(level, ui, PDFDocument) {
        const yieldThread = () => new Promise(r => setTimeout(r, 20));

        // Using central dynamic UI framework progress manager contextually
        if(ui) ui.updateProgress(20);
        await yieldThread();

        const originalDoc = await PDFDocument.load(this.currentArrayBuffer, { ignoreEncryption: true, updateMetadata: false });
        await yieldThread();

        if(ui) ui.updateProgress(50);
        const compressedDoc = await PDFDocument.create();
        const copiedPages = await compressedDoc.copyPages(originalDoc, originalDoc.getPageIndices());
        for (const page of copiedPages) compressedDoc.addPage(page);
        await yieldThread();

        if(ui) ui.updateProgress(75);
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

        if(ui) ui.updateProgress(100);
        
        // Call local UI display function immediately before returning binary down-stream
        this.showResults();

        const originalName = this.currentFile.name;
        const nameWithoutExt = originalName.lastIndexOf('.pdf') !== -1 ? originalName.substring(0, originalName.lastIndexOf('.pdf')) : originalName;

        return {
            blob: this.compressedBlob,
            filename: `${nameWithoutExt}_optimized.pdf`
        };
    }

    showResults() {
        if (!this.resultsPanel) {
            this.resultsPanel = document.getElementById('compressor-results');
        }
        
        if (this.resultsPanel) {
            this.resultsPanel.classList.remove('hidden');
        }

        const originalSize = this.currentFile.size;
        const newSize = this.compressedBlob.size;
        let reductionPercentage = ((originalSize - newSize) / originalSize) * 100;
        
        const sizeDisplay = document.getElementById('compressed-size');
        const ratioDisplay = document.getElementById('compression-ratio');

        if (sizeDisplay) {
            sizeDisplay.textContent = this.formatBytes(newSize);
        }

        if (ratioDisplay) {
            if (reductionPercentage <= 0) {
                reductionPercentage = 0;
                ratioDisplay.textContent = 'Highly Optimized';
                ratioDisplay.style.color = '#f59e0b'; 
            } else {
                ratioDisplay.textContent = `-${reductionPercentage.toFixed(1)}%`;
                ratioDisplay.style.color = '#10b981'; 
            }
        }
    }

    readFileAsync(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => { reader.abort(); reject(new Error('Browser failed to read the file.')); };
            reader.readAsArrayBuffer(file);
        });
    }

    resetUI() {
        this.currentFile = null;
        this.currentArrayBuffer = null;
        this.compressedBlob = null;
        this.isProcessing = false;
        if (this.resultsPanel) this.resultsPanel.classList.add('hidden');
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
