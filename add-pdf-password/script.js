export const tool = {
    /**
     * Core processing logic for Protect PDF.
     * Integrates with the dynamic tool loader to securely encrypt the file client-side.
     * @param {File[]} files - Array of files retrieved from the UI dropzone/input
     * @param {Object} engine - The core processing engine context
     * @param {Object} ui - UI helper methods exposed by the dynamic architecture
     * @param {Object} PDFLib - The injected pdf-lib library
     * @returns {Object} { blob, filename } containing the protected document
     */
    process: async (files, engine, ui, PDFLib) => {
        // 1. Get Password Inputs
        const passwordField = document.getElementById('pdf-password');
        const confirmPasswordField = document.getElementById('pdf-confirm-password');
        const passwordError = document.getElementById('password-error');
        
        const password = passwordField ? passwordField.value : '';
        const confirmPassword = confirmPasswordField ? confirmPasswordField.value : '';

        // Hide error message initially
        if (passwordError) {
            passwordError.classList.add('hidden');
        }

        // 2. Validate Password Presence
        if (!password || password.trim() === '') {
            throw new Error("Password is required. Please enter a valid password.");
        }

        // 3. Validate Password Match (Re-password Logic)
        if (password !== confirmPassword) {
            // Show red error message if passwords don't match
            if (passwordError) {
                passwordError.classList.remove('hidden'); 
            }
            throw new Error("Passwords do not match. Please ensure both passwords are identical.");
        }

        // 4. Validate File
        if (!files || files.length === 0) {
            throw new Error("No PDF file provided. Please select a document first.");
        }

        const file = files[0];
        if (file.type !== 'application/pdf') {
            throw new Error("Invalid file format. Only PDF files are supported.");
        }

        try {
            // 5. Read and Encrypt File
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

            const pdfBytes = await pdfDoc.save({
                useObjectStreams: false,
                userPassword: password,
                ownerPassword: password
            });

            // 6. Generate Output
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const originalName = file.name.replace(/\.[^/.]+$/, "");
            const filename = `${originalName}_protected.pdf`;

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

// UI Event Binding to display file name
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('pdf-file-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const fileNameText = document.getElementById('file-name-text');

    if (fileInput && fileNameDisplay && fileNameText) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const fileName = e.target.files[0].name;
                fileNameText.innerHTML = `<i class="fa-solid fa-file-pdf text-red-500 mr-2"></i> ${fileName}`;
                fileNameDisplay.classList.remove('hidden');
            }
        });
    }
});
