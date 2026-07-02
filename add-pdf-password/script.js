// Global namespace initialization
window.ToolsRegistry = window.ToolsRegistry || {};

// Tool logic implementation
window.ToolsRegistry['add-pdf-password'] = {
    process: async (files, engine, ui, PDFLib) => {
        // 1. Password elements selection
        const passwordField = document.getElementById('pdf-password');
        const confirmPasswordField = document.getElementById('pdf-confirm-password');
        const passwordError = document.getElementById('password-error');
        
        const password = passwordField ? passwordField.value : '';
        const confirmPassword = confirmPasswordField ? confirmPasswordField.value : '';

        // 2. Initial error handling
        if (passwordError) {
            passwordError.classList.add('hidden');
        }

        // 3. Validation
        if (!password || password.trim() === '') {
            throw new Error("Password is required. Please enter a valid password.");
        }

        if (password !== confirmPassword) {
            if (passwordError) {
                passwordError.classList.remove('hidden');
            }
            throw new Error("Passwords do not match. Please ensure both passwords are identical.");
        }

        // 4. File processing
        if (!window.activeFiles || window.activeFiles.length === 0) {
            throw new Error("No file selected.");
        }

        const file = window.activeFiles[0];
        const arrayBuffer = await file.arrayBuffer();
        
        // 5. PDF Encryption using PDFLib
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        const pdfBytes = await pdfDoc.save({
            useObjectStreams: false,
            userPassword: password,
            ownerPassword: password
        });

        // 6. Return the blob for the root script to handle
        return {
            blob: new Blob([pdfBytes], { type: 'application/pdf' }),
            filename: file.name.replace('.pdf', '_protected.pdf')
        };
    }
};

// Event listener for file selection to sync with system
document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'pdf-file-input') {
        const file = e.target.files[0];
        if (file) {
            window.activeFiles = [file];
            const fileNameDisplay = document.getElementById('file-name-display');
            const fileNameText = document.getElementById('file-name-text');
            
            if (fileNameDisplay && fileNameText) {
                fileNameText.textContent = file.name;
                fileNameDisplay.classList.remove('hidden');
            }
        }
    }
});
