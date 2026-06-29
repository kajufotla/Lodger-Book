// Fixed: Changed 'Const' to 'const'
const ToolsConfig = {
    resizer: { 
        name: "Image Resizer", desc: "Resize image dimensions securely.", icon: "fa-compress", 
        cssClass: "card-red", bgClass: "bg-red-500",
        render: (t) => AppUI.renderComplexInput(t, true, "image/jpeg, image/png, image/webp") + `
            <div class="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 class="text-sm font-bold text-slate-700 mb-2">Output Settings</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">New Width (px)</label>
                        <input type="number" id="img-w" placeholder="Auto" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">New Height (px)</label>
                        <input type="number" id="img-h" placeholder="Auto" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 outline-none">
                    </div>
                </div>
            </div>` 
    },
    merge: { 
        name: "Merge PDF", desc: "Combine multiple PDFs into a single document.", icon: "fa-object-group", 
        cssClass: "card-blue", bgClass: "bg-blue-600",
        render: (t) => AppUI.renderComplexInput(t, true, ".pdf") 
    },
    split: { 
        name: "Split PDF", desc: "Extract specific pages or split all pages.", icon: "fa-scissors", 
        cssClass: "card-green", bgClass: "bg-emerald-600",
        render: (t) => AppUI.renderComplexInput(t, false, ".pdf") + `
            <div class="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-5">
                <label class="block text-xs font-semibold text-slate-500 mb-1">Pages to Extract (Leave empty for all)</label>
                <input type="text" id="pg-range" placeholder="e.g. 1-5" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm outline-none">
            </div>` 
    }
    // Note: You can add the remaining tools here following the exact same structure.
};
