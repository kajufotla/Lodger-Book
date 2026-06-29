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

    if(!dropArea || !globalDropzone || !workspace) return;

    // FIXED: Used explicit 'AppUI' class reference instead of 'this' to guarantee context safety if invoked externally
    AppUI.currentDragSettings = { multiple, accept }; 

    // FIX: Ensure global document body listeners are attached strictly ONCE
    if (!AppUI._dragDropInitialized) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
        // FIXED: Using static reference to prevent listener stacking
        document.body.addEventListener(evt, AppUI._preventDragDefaults, false); 
      });

      let dragCounter = 0;

      document.body.addEventListener('dragenter', (e) => {
        // FIXED: Ignore non-file drags (like highlighted text or links) to keep dragCounter accurate and prevent UI trapping
        if (e.dataTransfer && (!e.dataTransfer.types || !e.dataTransfer.types.includes('Files'))) return;

        dragCounter++;
        const ws = DOM.workspaceBox; // Re-query DOM to ensure fresh reference
        if (ws && !ws.classList.contains('hidden')) {
          DOM.dropzone?.classList.remove('hidden');
          DOM.dropzone?.classList.add('flex');
        }
      });

      document.body.addEventListener('dragleave', (e) => {
        // FIXED: Match enter condition to keep dragCounter perfectly balanced
        if (e.dataTransfer && (!e.dataTransfer.types || !e.dataTransfer.types.includes('Files'))) return;

        dragCounter--;
        // FIX: Catch negative counter bug caused by rapid mouse movements/bubbling
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
        
        // FIXED: Added optional chaining and length validation to prevent crashes if a drop event fires with an empty FileList
        if (ws && !ws.classList.contains('hidden') && e.dataTransfer?.files?.length > 0) {
          // FIX: Route through dynamic settings rather than closure variables
          AppUI.handleFiles(
            e.dataTransfer.files,
            AppUI.currentDragSettings.multiple,
            AppUI.currentDragSettings.accept
          );
        }
      });

      AppUI._dragDropInitialized = true;
    }

    // Workspace-specific area listeners
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
      // FIXED: Idempotent listener attachment. Removes previous listener before adding to prevent memory leaks on workspace refresh
      workspace.removeEventListener(evt, AppUI._preventDragDefaults, false);
      workspace.addEventListener(evt, AppUI._preventDragDefaults, false);
    });
  }
