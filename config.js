const ToolsConfig = {
    resizer: { name: "Image Resizer", desc: "Resize dimensions offline.", icon: "fa-compress", color: "red-500", border: "border-b-[3px] border-b-red-500 hover:border-red-500/40", render: (t) => `
        <div class="space-y-3">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select Image</label>
            <input type="file" id="active-file-input" accept="image/jpeg, image/png, image/webp" onchange="AppUI.loadImgDims(this)" class="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer border border-dashed border-red-200 rounded-2xl p-4 bg-red-50/10">
            <div class="flex gap-2">
                <input type="number" id="img-w" placeholder="Width" class="w-1/2 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 outline-none transition">
                <input type="number" id="img-h" placeholder="Height" class="w-1/2 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 outline-none transition">
            </div>
            <select id="img-format" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 outline-none bg-white">
                <option value="image/jpeg">Export as JPG</option>
                <option value="image/png">Export as PNG</option>
                <option value="image/webp">Export as WebP</option>
            </select>
        </div>` },
    merge: { name: "Merge PDF", desc: "Combine multiple PDFs.", icon: "fa-copy", color: "blue-600", border: "border-b-[3px] border-b-blue-600 hover:border-blue-600/40", render: (t) => AppUI.renderComplexInput(t, true) },
    split: { name: "Split to ZIP", desc: "Extract pages into a ZIP.", icon: "fa-scissors", color: "emerald-600", border: "border-b-[3px] border-b-emerald-600 hover:border-emerald-600/40", render: (t) => AppUI.renderComplexInput(t) },
    rotate: { name: "Rotate Pages", desc: "Rotate all pages by 90°.", icon: "fa-rotate-right", color: "purple-600", border: "border-b-[3px] border-b-purple-600 hover:border-purple-600/40", render: (t) => AppUI.renderComplexInput(t) },
    del: { name: "Delete Page", desc: "Remove a specific page.", icon: "fa-trash", color: "amber-500", border: "border-b-[3px] border-b-amber-500 hover:border-amber-500/40", render: (t) => AppUI.renderComplexInput(t) + `<input type="number" id="pg-input" placeholder="Page number (e.g. 1)" class="w-full mt-3 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 outline-none">` },
    extract: { name: "Extract Page", desc: "Isolate a single page.", icon: "fa-file-export", color: "orange-500", border: "border-b-[3px] border-b-orange-500 hover:border-orange-500/40", render: (t) => AppUI.renderComplexInput(t) + `<input type="number" id="pg-input" placeholder="Page number to extract" class="w-full mt-3 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 outline-none">` },
    reorder: { name: "Reverse PDF", desc: "Flip layout order backwards.", icon: "fa-arrow-down-up-across-line", color: "pink-600", border: "border-b-[3px] border-b-pink-600 hover:border-pink-600/40", render: (t) => AppUI.renderComplexInput(t) },
    watermark: { name: "Watermark", desc: "Stamp custom text.", icon: "fa-stamp", color: "cyan-500", border: "border-b-[3px] border-b-cyan-500 hover:border-cyan-500/40", render: (t) => AppUI.renderComplexInput(t) + `<input type="text" id="txt-input" placeholder="Text (e.g., CONFIDENTIAL)" class="w-full mt-3 px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 outline-none">` },
    numbers: { name: "Page Numbers", desc: "Inject sequence digits.", icon: "fa-list-ol", color: "teal-500", border: "border-b-[3px] border-b-teal-500 hover:border-teal-500/40", render: (t) => AppUI.renderComplexInput(t) },
    imgToPdf: { name: "Image to PDF", desc: "Convert photos to A4 PDF.", icon: "fa-images", color: "blue-700", border: "border-b-[3px] border-b-blue-700 hover:border-blue-700/40", render: (t) => AppUI.renderComplexInput(t, true, "image/*") }
};
