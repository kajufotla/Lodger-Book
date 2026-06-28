const ToolsConfig = {
    resizer: { 
        name: "Image Resizer", 
        desc: "Resize image dimensions offline securely. Adjust quality and format.", 
        icon: "fa-compress", 
        color: "red-500", 
        border: "border-b-[3px] border-b-red-500", 
        render: (t) => AppUI.renderComplexInput(t, true, "image/jpeg, image/png, image/webp") + `
            <div class="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 class="text-sm font-bold text-slate-700 mb-2">Output Settings</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label for="img-w" class="block text-xs font-semibold text-slate-500 mb-1">New Width (px)</label>
                        <input type="number" id="img-w" placeholder="Auto" min="1" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white" aria-label="New Image Width">
                    </div>
                    <div>
                        <label for="img-h" class="block text-xs font-semibold text-slate-500 mb-1">New Height (px)</label>
                        <input type="number" id="img-h" placeholder="Auto" min="1" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white" aria-label="New Image Height">
                    </div>
                    <div>
                        <label for="img-format" class="block text-xs font-semibold text-slate-500 mb-1">Output Format</label>
                        <select id="img-format" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white cursor-pointer" aria-label="Image Output Format">
                            <option value="image/jpeg">Export as JPG (Smaller size)</option>
                            <option value="image/png">Export as PNG (Lossless)</option>
                            <option value="image/webp">Export as WebP (Modern web)</option>
                        </select>
                    </div>
                    <div>
                        <label for="img-quality" class="block text-xs font-semibold text-slate-500 mb-1">Quality (JPG/WebP)</label>
                        <input type="range" id="img-quality" min="10" max="100" value="92" class="w-full h-2 mt-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500" aria-label="Image Quality Slider">
                        <div class="text-right text-xs text-slate-500 mt-1" id="quality-val" aria-live="polite">92%</div>
                    </div>
                </div>
            </div>` 
    },
    
    merge: { 
        name: "Merge PDF", 
        desc: "Combine multiple PDFs into a single document in your desired order.", 
        icon: "fa-object-group", 
        color: "blue-600", 
        border: "border-b-[3px] border-b-blue-600", 
        render: (t) => AppUI.renderComplexInput(t, true, ".pdf") 
    },
    
    split: { 
        name: "Split PDF", 
        desc: "Extract specific pages or split all pages into a ZIP.", 
        icon: "fa-scissors", 
        color: "emerald-600", 
        border: "border-b-[3px] border-b-emerald-600", 
        render: (t) => AppUI.renderComplexInput(t, false, ".pdf") + `
            <div class="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 class="text-sm font-bold text-slate-700 mb-2">Extraction Mode</h4>
                <label for="split-mode" class="sr-only">Choose extraction mode</label>
                <select id="split-mode" aria-label="Split Mode" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white cursor-pointer" onchange="document.getElementById('range-container').style.display = this.value === 'range' ? 'block' : 'none'">
                    <option value="all">Split Every Page into Separate PDFs (ZIP)</option>
                    <option value="range">Extract Selected Page Range</option>
                </select>
                <div id="range-container" style="display: none;" class="animate-fade-in mt-4">
                    <label for="pg-range-split" class="block text-xs font-semibold text-slate-500 mb-1">Pages to Extract</label>
                    <input type="text" id="pg-range-split" placeholder="e.g. 1-5, 8, 11-13" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white" aria-label="Page Range">
                </div>
            </div>` 
    },
    
    rotate: { 
        name: "Rotate Pages", 
        desc: "Rotate specific pages or the entire document.", 
        icon: "fa-rotate-right", 
        color: "purple-600", 
        border: "border-b-[3px] border-b-purple-600", 
        render: (t) => AppUI.renderComplexInput(t, false, ".pdf") + `
            <div class="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div>
                    <label for="pg-range-rotate" class="block text-xs font-semibold text-slate-500 mb-1">Target Pages</label>
                    <input type="text" id="pg-range-rotate" placeholder="Leave empty for all pages (e.g. 1-3, 5)" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all bg-white" aria-label="Target Pages for Rotation">
                </div>
                <div>
                    <label for="rot-angle" class="block text-xs font-semibold text-slate-500 mb-2">Rotation Angle</label>
                    <div class="flex flex-wrap sm:flex-nowrap gap-3 mb-3" role="group" aria-label="Quick Rotation Angles">
                        <button type="button" id="btn-rot-90" class="flex-1 py-2 px-1 bg-white border border-slate-300 font-bold text-slate-600 rounded-lg text-sm hover:bg-slate-100 hover:text-purple-600 transition-colors shadow-sm focus:ring-2 focus:ring-purple-500 outline-none">90&deg; &circlearrowright;</button>
                        <button type="button" id="btn-rot-180" class="flex-1 py-2 px-1 bg-white border border-slate-300 font-bold text-slate-600 rounded-lg text-sm hover:bg-slate-100 hover:text-purple-600 transition-colors shadow-sm focus:ring-2 focus:ring-purple-500 outline-none">180&deg; &circlearrowdown;</button>
                        <button type="button" id="btn-rot-270" class="flex-1 py-2 px-1 bg-white border border-slate-300 font-bold text-slate-600 rounded-lg text-sm hover:bg-slate-100 hover:text-purple-600 transition-colors shadow-sm focus:ring-2 focus:ring-purple-500 outline-none">270&deg; &circlearrowleft;</button>
                    </div>
                    <input type="number" id="rot-angle" value="90" placeholder="Custom Angle" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all bg-white" aria-label="Custom Rotation Angle">
                </div>
            </div>` 
    },
    
    del: { 
        name: "Delete Page", 
        desc: "Remove specific pages from a PDF.", 
        icon: "fa-file-circle-minus", 
        color: "amber-500", 
        border: "border-b-[3px] border-b-amber-500", 
        render: (t) => AppUI.renderComplexInput(t, false, ".pdf") + `
            <div class="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-5">
                <label for="pg-input-del" class="block text-xs font-semibold text-slate-500 mb-1">Pages to Delete</label>
                <input type="text" id="pg-input-del" placeholder="e.g. 2, 4-6" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all bg-white" aria-label="Pages to Delete">
            </div>` 
    },
    
    extract: { 
        name: "Extract Page", 
        desc: "Isolate a single page into a new PDF.", 
        icon: "fa-file-export", 
        color: "orange-500", 
        border: "border-b-[3px] border-b-orange-500", 
        render: (t) => AppUI.renderComplexInput(t, false, ".pdf") + `
            <div class="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-5">
                <label for="pg-input-extract" class="block text-xs font-semibold text-slate-500 mb-1">Page Number</label>
                <input type="number" id="pg-input-extract" min="1" placeholder="Page number to extract" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-white" aria-label="Page Number to Extract">
            </div>` 
    },
    
    reorder: { 
        name: "Reverse PDF", 
        desc: "Flip the entire document's page order backwards.", 
        icon: "fa-arrow-down-up-across-line", 
        color: "pink-600", 
        border: "border-b-[3px] border-b-pink-600", 
        render: (t) => AppUI.renderComplexInput(t, false, ".pdf") 
    },
    
    watermark: { 
        name: "Watermark", 
        desc: "Stamp custom text across your document for security.", 
        icon: "fa-stamp", 
        color: "cyan-600", 
        border: "border-b-[3px] border-b-cyan-600", 
        render: (t) => AppUI.renderComplexInput(t, false, ".pdf") + `
            <div class="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div>
                    <label for="txt-input" class="block text-xs font-semibold text-slate-500 mb-1">Watermark Text</label>
                    <input type="text" id="txt-input" placeholder="e.g. CONFIDENTIAL" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all bg-white" aria-label="Watermark Text">
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label for="wm-pos" class="block text-xs font-semibold text-slate-500 mb-1">Position</label>
                        <select id="wm-pos" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 outline-none bg-white cursor-pointer" aria-label="Watermark Position">
                            <option value="center">Center</option>
                            <option value="top-left">Top Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-right">Bottom Right</option>
                        </select>
                    </div>
                    <div>
                        <label for="wm-rot" class="block text-xs font-semibold text-slate-500 mb-1">Rotation Angle (&deg;)</label>
                        <input type="number" id="wm-rot" placeholder="45" value="45" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 outline-none bg-white" aria-label="Watermark Rotation Angle">
                    </div>
                    <div>
                        <label for="wm-size" class="block text-xs font-semibold text-slate-500 mb-1">Font Size (px)</label>
                        <input type="number" id="wm-size" placeholder="48" value="48" min="8" max="200" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 outline-none bg-white" aria-label="Watermark Font Size">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Color & Opacity (%)</label>
                        <div class="flex items-center space-x-2 border border-slate-300 rounded-lg px-2 bg-white h-[42px] focus-within:ring-2 focus-within:ring-cyan-500 transition-all">
                            <input type="color" id="wm-color" value="#cccccc" class="h-6 w-12 rounded cursor-pointer border-0 bg-transparent p-0" aria-label="Watermark Color">
                            <div class="w-px h-6 bg-slate-200"></div>
                            <input type="number" id="wm-opacity" placeholder="30" value="30" min="1" max="100" class="w-full py-1 text-sm outline-none bg-transparent text-center font-medium" aria-label="Watermark Opacity">
                        </div>
                    </div>
                </div>
            </div>` 
    },
    
    numbers: { 
        name: "Page Numbers", 
        desc: "Inject customizable sequence digits into your pages.", 
        icon: "fa-list-ol", 
        color: "teal-500", 
        border: "border-b-[3px] border-b-teal-500", 
        render: (t) => AppUI.renderComplexInput(t, false, ".pdf") + `
            <div class="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="col-span-1 sm:col-span-2">
                        <label for="num-format" class="block text-xs font-semibold text-slate-500 mb-1">Number Format</label>
                        <select id="num-format" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white cursor-pointer" aria-label="Page Number Format">
                            <option value="n">1, 2, 3...</option>
                            <option value="Page n">Page 1, Page 2...</option>
                            <option value="n of t">1 of 10, 2 of 10...</option>
                            <option value="Page n of t">Page 1 of 10...</option>
                        </select>
                    </div>
                    <div>
                        <label for="start-num" class="block text-xs font-semibold text-slate-500 mb-1">Starting Number</label>
                        <input type="number" id="start-num" placeholder="1" value="1" min="1" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all bg-white" aria-label="Starting Page Number">
                    </div>
                    <div>
                        <label for="pos" class="block text-xs font-semibold text-slate-500 mb-1">Position</label>
                        <select id="pos" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white cursor-pointer" aria-label="Page Number Position">
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-center">Bottom Center</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="top-center">Top Center</option>
                            <option value="top-left">Top Left</option>
                        </select>
                    </div>
                    <div class="col-span-1 sm:col-span-2">
                        <label for="pg-range-numbers" class="block text-xs font-semibold text-slate-500 mb-1">Apply to Pages (Optional)</label>
                        <input type="text" id="pg-range-numbers" placeholder="Leave empty for all (e.g. 2-5)" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white" aria-label="Pages to Number">
                    </div>
                </div>
            </div>` 
    },
    
    imgToPdf: { 
        name: "Image to PDF", 
        desc: "Convert photos or scanned images to PDF securely.", 
        icon: "fa-images", 
        color: "indigo-600", 
        border: "border-b-[3px] border-b-indigo-600", 
        render: (t) => AppUI.renderComplexInput(t, true, "image/jpeg, image/png, image/webp") + `
            <div class="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 class="text-sm font-bold text-slate-700 mb-2">Document Settings</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label for="pg-size" class="block text-xs font-semibold text-slate-500 mb-1">Page Size</label>
                        <select id="pg-size" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer" aria-label="PDF Page Size">
                            <option value="A4">A4 Standard</option>
                            <option value="Letter">US Letter</option>
                            <option value="Fit">Fit to Image Size</option>
                        </select>
                    </div>
                    <div>
                        <label for="layout" class="block text-xs font-semibold text-slate-500 mb-1">Orientation</label>
                        <select id="layout" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer" aria-label="Page Orientation">
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                        </select>
                    </div>
                    <div class="col-span-1 sm:col-span-2">
                        <label for="img-mode" class="block text-xs font-semibold text-slate-500 mb-1">Image Fitting (If A4/Letter)</label>
                        <select id="img-mode" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer" aria-label="Image Fitting Mode">
                            <option value="fit">Fit (Keep Aspect Ratio, Add Margins)</option>
                            <option value="fill">Fill (Stretch to Page Borders)</option>
                        </select>
                    </div>
                </div>
            </div>` 
    }
};
