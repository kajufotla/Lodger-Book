document.addEventListener('DOMContentLoaded', () => {
    // آپ کے HTML کی درست ID 'tools-grid'
    const toolsContainer = document.getElementById('tools-grid');

    if (!toolsContainer) {
        console.error("Error: HTML میں 'tools-grid' نہیں ملا۔");
        return;
    }

    let toolsHTML = '';

    // آپ کے لائٹ تھیم (light theme) کے مطابق کارڈز کا ڈیزائن
    for (const [key, tool] of Object.entries(ToolsConfig)) {
        toolsHTML += `
            <div class="bg-white p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-sm border border-slate-100 flex flex-col items-center text-center ${tool.border}" onclick="openModule('${key}')">
                <div class="text-4xl mb-4 text-${tool.color}">
                    <i class="fa-solid ${tool.icon}"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-2">${tool.name}</h3>
                <p class="text-slate-500 text-sm">${tool.desc}</p>
            </div>
        `;
    }

    // HTML میں ٹولز کو رینڈر کرنا
    toolsContainer.innerHTML = toolsHTML;
});

function openModule(moduleKey) {
    const selectedTool = ToolsConfig[moduleKey];
    
    // جب کسی ٹول پر کلک ہو گا تو وہ آپ کے مین کینوس (tool-workspace-box) میں لوڈ ہو جائے گا
    const canvasContent = document.getElementById('canvas-content');
    
    if(canvasContent) {
        canvasContent.innerHTML = `
            <div class="text-5xl mb-4 text-${selectedTool.color} animate-bounce">
                <i class="fa-solid ${selectedTool.icon}"></i>
            </div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">${selectedTool.name}</h2>
            <p class="text-slate-600 mb-8">${selectedTool.desc}</p>
            
            <button class="bg-${selectedTool.color} text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md">
                Select PDF File
            </button>
        `;
    }
}
