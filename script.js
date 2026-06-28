// ---------------------------------------------------------
// LAYER 2 & 4: STATE & UI (ETA UPGRADE)
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
    // ... (Keep existing UI methods) ...

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
