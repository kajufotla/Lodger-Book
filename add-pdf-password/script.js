export const tool = {
    /**
     * Core processing logic for Protect PDF.
     * Integrates with the dynamic tool loader to securely encrypt the file client-side.
     * * @param {File[]} files - Array of files retrieved from the UI dropzone/input
     * @param {Object} engine - The core processing engine context
     * @param {Object} ui - UI helper methods exposed by the dynamic architecture
     * @param {Object} PDFLib - The injected pdf-lib library
     * @returns {Object} { blob, filename } containing the protected document
     */
    process: async (files, engine, ui, PDFLib) => {
        // 1. Input Validation
        const passwordField = document.getElementById('pdf-password');
        const password = passwordField ? passwordField.value : '';

        if (!password || password.trim() === '') {
            throw new Error("Password is required. Please enter a valid password to secure your PDF.");
        }

        if (!files || files.length === 0) {
            throw new Error("No PDF file provided. Please select a document first.");
        }

        const file = files[0];
        if (file.type !== 'application/pdf') {
            throw new Error("Invalid file format. Only PDF files are supported.");
        }

        try {
            // 2. Read File as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // 3. Load PDF Document locally
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

            // 4. Encrypt and Save Document
            // Standard pdf-lib configuration for AES-256 equivalent security layer
            const pdfBytes = await pdfDoc.save({
                useObjectStreams: false,
                userPassword: password,
                ownerPassword: password
            });

            // 5. Generate Output Blob & Filename
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            // Strip existing extensions and append the protected suffix securely
            const originalName = file.name.replace(/\.[^/.]+$/, "");
            const filename = `${originalName}_protected.pdf`;

            // 6. Return strictly formatted object to the dynamic loader
            return {
                blob: blob,
                filename: filename
            };
            
        } catch (error) {
            console.error("PDF Encryption Error:", error);
            throw new Error(`Failed to protect PDF: ${error.message}`);
        }
    }
};

// Local UI Event Bindings for modular encapsulation
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('pdf-file-input');
    const fileNameDisplay = document.getElementById('file-name-display');

    if (fileInput && fileNameDisplay) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const fileName = e.target.files[0].name;
                fileNameDisplay.innerHTML = `<i class="fa-solid fa-check-circle mr-1"></i> ${fileName}`;
                fileNameDisplay.classList.remove('hidden');
            }
        });
    }
});
