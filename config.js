const ToolsConfig = {
    resizer: { name: "Image Resizer", desc: "Resize dimensions offline.", icon: "fa-compress", color: "red-500", border: "border-b-[3px] border-b-red-500", render: (t) => AppUI.renderComplexInput(t, false, "image/jpeg, image/png, image/webp") + `
        <div class="grid grid-cols-2 gap-3 mt-4">
            <input type="number" id="img-w" placeholder="New Width (px)" class="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-500 outline-none">
            <input type="number" id="img-h" placeholder="New Height (px)" class="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-500 outline-none">
            <select id="img-format" class="col-span-2 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white">
                <option value="image/jpeg">Export as JPG</option><option value="image/png">Export as PNG</option><option value="image/webp">Export as WebP</option>
            </select>
        </div>` },
    merge: { name: "Merge PDF", desc: "Combine multiple PDFs.", icon: "fa-copy", color: "blue-600", border: "border-b-[3px] border-b-blue-600", render: (t) => AppUI.renderComplexInput(t, true) },
    split: { name: "Split PDF", desc: "Extract pages into a ZIP.", icon: "fa-scissors", color: "emerald-600", border: "border-b-[3px] border-b-emerald-600", render: (t) => AppUI.renderComplexInput(t) + `
        <div class="mt-4 space-y-3">
            <select id="split-mode" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="all">Split Every Page</option><option value="range">Extract Selected Range</option>
            </select>
            <input type="text" id="pg-range" placeholder="Pages (e.g. 1-5, 8)" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none">
        </div>` },
    rotate: { name: "Rotate Pages", desc: "Rotate specified pages.", icon: "fa-rotate-right", color: "purple-600", border: "border-b-[3px] border-b-purple-600", render: (t) => AppUI.renderComplexInput(t) + `
        <div class="mt-4 space-y-3">
            <input type="text" id="pg-range" placeholder="Pages (Leave empty for all)" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none">
            <div class="flex gap-2">
                <button type="button" id="btn-rot-90" class="flex-1 py-2 bg-slate-100 font-bold rounded-lg text-sm hover:bg-slate-200">90&deg;</button>
                <button type="button" id="btn-rot-180" class="flex-1 py-2 bg-slate-100 font-bold rounded-lg text-sm hover:bg-slate-200">180&deg;</button>
                <button type="button" id="btn-rot-270" class="flex-1 py-2 bg-slate-100 font-bold rounded-lg text-sm hover:bg-slate-200">270&deg;</button>
            </div>
            <input type="number" id="rot-angle" value="90" placeholder="Custom Angle" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none">
        </div>` },
    del: { name: "Delete Page", desc: "Remove specific pages.", icon: "fa-trash", color: "amber-500", border: "border-b-[3px] border-b-amber-500", render: (t) => AppUI.renderComplexInput(t) + `<input type="text" id="pg-input" placeholder="Pages to delete (e.g. 2, 4-6)" class="w-full mt-4 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none">` },
    extract: { name: "Extract Page", desc: "Isolate a single page.", icon: "fa-file-export", color: "orange-500", border: "border-b-[3px] border-b-orange-500", render: (t) => AppUI.renderComplexInput(t) + `<input type="number" id="pg-input" placeholder="Page number to extract" class="w-full mt-4 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none">` },
    reorder: { name: "Reverse PDF", desc: "Flip layout order backwards.", icon: "fa-arrow-down-up-across-line", color: "pink-600", border: "border-b-[3px] border-b-pink-600", render: (t) => AppUI.renderComplexInput(t) },
    watermark: { name: "Watermark", desc: "Stamp custom text.", icon: "fa-stamp", color: "cyan-500", border: "border-b-[3px] border-b-cyan-500", render: (t) => AppUI.renderComplexInput(t) + `
        <div class="grid grid-cols-2 gap-3 mt-4">
            <input type="text" id="txt-input" placeholder="Watermark Text" class="col-span-2 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none">
            <select id="wm-pos" class="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="center">Center</option><option value="top-left">Top Left</option><option value="bottom-right">Bottom Right</option>
            </select>
            <input type="number" id="wm-rot" placeholder="Angle (45)" class="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none">
            <input type="number" id="wm-size" placeholder="Size (48)" class="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none">
            <div class="flex items-center space-x-2 border border-slate-200 rounded-xl px-2">
                <input type="color" id="wm-color" value="#cccccc" class="h-8 w-1/2 rounded cursor-pointer">
                <input type="number" id="wm-opacity" placeholder="Opacity %" value="30" class="w-1/2 py-2 text-sm outline-none bg-transparent">
            </div>
        </div>` },
    numbers: { name: "Page Numbers", desc: "Inject sequence digits.", icon: "fa-list-ol", color: "teal-500", border: "border-b-[3px] border-b-teal-500", render: (t) => AppUI.renderComplexInput(t) + `
        <div class="grid grid-cols-2 gap-3 mt-4">
            <input type="number" id="start-num" placeholder="Start At (1)" class="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none">
            <select id="pos" class="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white">
                <option value="bottom-right">Bottom Right</option><option value="bottom-center">Bottom Center</option><option value="top-right">Top Right</option>
            </select>
        </div>` },
    imgToPdf: { name: "Image to PDF", desc: "Convert photos to PDF.", icon: "fa-images", color: "blue-700", border: "border-b-[3px] border-b-blue-700", render: (t) => AppUI.renderComplexInput(t, true, "image/*") + `
        <div class="grid grid-cols-2 gap-3 mt-4">
            <select id="pg-size" class="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white"><option value="A4">A4</option><option value="Letter">Letter</option></select>
            <select id="layout" class="px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select>
            <select id="img-mode" class="col-span-2 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none bg-white"><option value="fit">Fit (Keep Aspect Ratio)</option><option value="fill">Fill (Stretch to Page)</option></select>
        </div>` }
};
