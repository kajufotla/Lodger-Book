window.ToolsRegistry = window.ToolsRegistry || {};
window.ToolsRegistry['add-pdf-password'] = window.ToolsRegistry['add-pdf-password'] || {};

window.ToolsRegistry['add-pdf-password'].process = async (files, engine, ui, PDFLib) => {
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
        if (passwordError) {
            passwordError.classList.remove('hidden'); 
        }
        throw new Error("Passwords do not match. Please ensure both passwords are identical.");
    }

    // 4. Validate File (Using window.activeFiles to sync with Root Script)
    const currentFiles = window.activeFiles && window.activeFiles.length > 0 ? window.activeFiles : files;
    
    if (!currentFiles || currentFiles.length === 0) {
        throw new Error("No PDF file provided. Please select a document first.");
    }

    const file = currentFiles[0];
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
};

// UI Event Binding (Updated for Dynamic Application Routing)
document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'pdf-file-input') {
        const fileNameDisplay = document.getElementById('file-name-display');
        const fileNameText = document.getElementById('file-name-text');

        if (e.target.files && e.target.files.length > 0) {
            // Sync with Global Engine
            window.activeFiles = Array.from(e.target.files);
            
            if(fileNameDisplay && fileNameText) {
                const fileName = e.target.files[0].name;
                fileNameText.innerHTML = `<i class="fa-solid fa-file-pdf text-red-500 mr-2"></i> ${fileName}`;
                fileNameDisplay.classList.remove('hidden');
            }
        }
    }
});
