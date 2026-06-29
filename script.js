// NEW: Added static variables to AppUI class to track global listener state
static _dragDropInitialized = false;
static currentDragSettings = { multiple: false, accept: '*' };

// FIXED: Extracted default prevention to a static method to prevent memory leaks from duplicate anonymous closures
static _preventDragDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

static setupDragAndDrop(multiple, accept) {
  const dropArea = document.getElementById('file-drop-area');
  const globalDropzone = DOM.dropzone;
  const workspace = DOM.workspaceBox;

  if (!dropArea || !globalDropzone || !workspace) return;

  // FIXED: Used explicit AppUI reference for safe global access
  AppUI.currentDragSettings = { multiple, accept };

  // FIX: Ensure global listeners are attached only once
  if (!AppUI._dragDropInitialized) {

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
      document.body.addEventListener(evt, AppUI._preventDragDefaults, false);
    });

    let dragCounter = 0;

    document.body.addEventListener('dragenter', (e) => {
      // FIX: ignore non-file drags safely
      if (e.dataTransfer && !e.dataTransfer.types?.includes('Files')) return;

      dragCounter++;

      const ws = DOM.workspaceBox;
      if (ws && !ws.classList.contains('hidden')) {
        DOM.dropzone?.classList.remove('hidden');
        DOM.dropzone?.classList.add('flex');
      }
    });

    document.body.addEventListener('dragleave', (e) => {
      if (e.dataTransfer && !e.dataTransfer.types?.includes('Files')) return;

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

      const ws = DOM.workspaceBox;

      if (ws && !ws.classList.contains('hidden') && e.dataTransfer?.files?.length > 0) {
        AppUI.handleFiles(
          e.dataTransfer.files,
          AppUI.currentDragSettings.multiple,
          AppUI.currentDragSettings.accept
        );
      }
    });

    AppUI._dragDropInitialized = true;
  }

  // Workspace listeners (safe + idempotent)
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    workspace.removeEventListener(evt, AppUI._preventDragDefaults, false);
    workspace.addEventListener(evt, AppUI._preventDragDefaults, false);
  });
}
