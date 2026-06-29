// ==========================================
// 1. GLOBAL STATE & DOM CACHE
// ==========================================
window.ActiveFiles = [];

const DOM = {
  dropzone: document.getElementById('dropzone'),
  workspaceBox: document.getElementById('workspace-box'),
  fileList: document.getElementById('file-list'),
  progressBar: document.getElementById('progress-bar'),
  toast: document.getElementById('toast')
};

// ==========================================
// 2. TOOLS CONFIGURATION
// ==========================================
const ToolsConfig = {
  imageToPdf: {
    id: 'image-to-pdf',
    multiple: true,
    maxFiles: 10,
    accept: 'image/*'
  }
};

// ==========================================
// 3. UI & STATE MANAGEMENT
// ==========================================
class AppUI {
  static _dragDropInitialized = false;
  static currentDragSettings = { multiple: false, accept: '*' };

  static _preventDragDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  static setupDragAndDrop(multiple, accept) {
    const dropArea = document.getElementById('file-drop-area');
    const globalDropzone = DOM.dropzone;
    const workspace = DOM.workspaceBox;

    if (!dropArea || !globalDropzone || !workspace) return;

    AppUI.currentDragSettings = { multiple, accept };

    if (!AppUI._dragDropInitialized) {

      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        document.body.addEventListener(evt, AppUI._preventDragDefaults, false);
      });

      let dragCounter = 0;

      document.body.addEventListener('dragenter', (e) => {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        dragCounter++;
        DOM.dropzone?.classList.remove('hidden');
        DOM.dropzone?.classList.add('flex');
      });

      document.body.addEventListener('dragleave', (e) => {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        dragCounter--;
        if (dragCounter <= 0) {
          dragCounter = 0;
          DOM.dropzone?.classList.add('hidden');
          DOM.dropzone?.classList.remove('flex');
        }
      });

      document.body.addEventListener('drop', (e) => {
        dragCounter = 0;
        DOM.dropzone?.classList.add('hidden');
        DOM.dropzone?.classList.remove('flex');

        const files = e.dataTransfer?.files;

        if (files?.length > 0) {
          AppUI.handleFiles(
            files,
            AppUI.currentDragSettings.multiple,
            AppUI.currentDragSettings.accept
          );
        }
      });

      AppUI._dragDropInitialized = true;
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
      workspace.removeEventListener(evt, AppUI._preventDragDefaults, false);
      workspace.addEventListener(evt, AppUI._preventDragDefaults, false);
    });
  }

  // ✅ FILE HANDLING (FIXED)
  static handleFiles(files, multiple, accept) {
    let fileArray = Array.from(files);

    if (!multiple) {
      fileArray = [fileArray[0]];
      window.ActiveFiles = [];
    }

    fileArray.forEach(file => {
      if (this.validateFile(file, accept)) {
        window.ActiveFiles.push(file);
      }
    });

    this.renderFiles();
  }

  // ✅ FILE VALIDATION
  static validateFile(file, accept) {
    if (!accept || accept === '*') return true;
    return file.type.match(accept.replace('*', '.*'));
  }

  // ✅ FILE RENDER
  static renderFiles() {
    if (!DOM.fileList) return;

    DOM.fileList.innerHTML = "";

    window.ActiveFiles.forEach((file, index) => {
      const div = document.createElement("div");
      div.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;

      const btn = document.createElement("button");
      btn.textContent = "X";
      btn.onclick = () => {
        window.ActiveFiles.splice(index, 1);
        AppUI.renderFiles();
      };

      div.appendChild(btn);
      DOM.fileList.appendChild(div);
    });
  }

  // ✅ PROGRESS
  static updateProgress(percent) {
    if (DOM.progressBar) {
      DOM.progressBar.style.width = percent + "%";
    }
  }

  // ✅ TOAST
  static showToast(message, type = "info") {
    if (!DOM.toast) return;
    DOM.toast.innerText = message;
    DOM.toast.className = `toast ${type}`;
    setTimeout(() => DOM.toast.innerText = "", 3000);
  }
}

// ==========================================
// 4. CORE PROCESSING
// ==========================================
class PDFEngine {

  static async processImageToPdf(files) {
    AppUI.updateProgress(10);

    // fake processing simulation
    await new Promise(r => setTimeout(r, 1000));

    AppUI.updateProgress(100);
    AppUI.showToast("PDF Created Successfully", "success");

    console.log("Processed files:", files);
  }
}

// ==========================================
// 5. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  AppUI.setupDragAndDrop(true, 'image/*');
});
