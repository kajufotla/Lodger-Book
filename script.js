// ---------------------------------------------------------
// LAYER 2 & 4: STATE & UI (COMPLETE FILE)
// ---------------------------------------------------------

class OperationState {
    static currentController = null;
    static startTime = 0;

    static start() {
        if (this.currentController) this.currentController.abort();
        this.currentController = new AbortController();
        this.startTime = Date.now();
        return this.currentController.signal;
    }

    // Calculates remaining time based on current progress percentage
    static getETA(percent) {
        if (percent <= 0 || percent >= 100) return null;
        const elapsed = Date.now() - this.startTime;
        const totalEstimated = elapsed / (percent / 100);
        const remaining = totalEstimated - elapsed;
        return Math.max(0, Math.ceil(remaining / 1000)); // in seconds
    }

    static cancel() {
        if (this.currentController) {
            this.currentController.abort();
            this.currentController = null;
            AppUI.showToast("Operation cancelled safely.", 'warning');
            AppUI.resetProgress();
        }
    }
}

class AppUI {
    
    // यह फंक्शन index.html के लिए जरूरी है
    static renderComplexInput(tool, isImage = false, acceptType = "application/pdf") {
        return `
            <div class="mt-4">
                <label class="block text-xs font-semibold text-slate-600 mb-2">Upload Files for ${tool.name}</label>
                <input type="file" multiple accept="${acceptType}" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs outline-none bg-white">
            </div>
        `;
    }

    // यह फंक्शन टूल्स पर क्लिक करने के लिए जरूरी है
    static activateWorkspace(key, tool) {
        console.log(`Activated tool: ${tool.name}`);
        
        // अगर आपके पास workspace के नाम से कोई div है तो यह वहां टूल दिखाएगा
        const workspace = document.getElementById('workspace');
        if (workspace) {
            workspace.innerHTML = `<h2 class="text-xl font-bold mb-4">${tool.name}</h2>` + tool.render(tool);
            workspace.style.display = 'block';
        } else {
            console.log(`Tool ${tool.name} activated!`);
        }
    }

    static showToast(msg, type) {
        console.log(type.toUpperCase() + ": " + msg);
        // अगर आपके पास टोस्ट का डिज़ाइन है तो यहां लॉजिक डाल सकते हैं
    }

    static resetProgress() {
        this.updateProgress(0);
    }

    static updateProgress(percent) {
        const bar = document.getElementById('engine-progress-bar');
        const txt = document.getElementById('engine-progress-text');
        
        if (bar) bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        
        if (txt) {
            let text = `${Math.round(percent)}%`;
            const eta = OperationState.getETA(percent);
            if (eta !== null && percent < 100) {
                const mins = Math.floor(eta / 60);
                const secs = eta % 60;
                text += ` - ETA: ${mins > 0 ? mins + 'm ' : ''}${secs}s`;
            }
            txt.textContent = text;
        }
    }
}
