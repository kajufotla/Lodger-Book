// script.js

document.addEventListener('DOMContentLoaded', () => {
    // وہ کنٹینر جہاں سارے ٹولز نظر آئیں گے
    const toolsContainer = document.getElementById('tools-container');

    if (!toolsContainer) {
        console.error("Error: HTML میں 'tools-container' کے نام سے کوئی ID موجود نہیں ہے۔");
        return;
    }

    let toolsHTML = '';

    // ToolsConfig میں سے تمام ٹولز کو باری باری نکال کر HTML بنانا
    for (const [key, tool] of Object.entries(ToolsConfig)) {
        toolsHTML += `
            <div class="bg-[#1a1b26] p-6 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${tool.border} flex flex-col items-center text-center" onclick="openModule('${key}')">
                <div class="text-4xl mb-4 text-${tool.color.split('-')[0]}-${tool.color.split('-')[1]}">
                    <i class="fa-solid ${tool.icon}"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-100 mb-2">${tool.name}</h3>
                <p class="text-gray-400 text-sm">${tool.desc}</p>
            </div>
        `;
    }

    // تیار شدہ HTML کو کنٹینر میں ڈالنا
    toolsContainer.innerHTML = toolsHTML;
    
    // کنٹینر پر Tailwind کی گرڈ (Grid) کلاسز لگانا تاکہ یہ رسپانسو (Responsive) رہے
    toolsContainer.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6 max-w-7xl mx-auto mt-8';
});

// جب کسی ٹول پر کلک کیا جائے تو یہ فنکشن چلے گا
function openModule(moduleKey) {
    const selectedTool = ToolsConfig[moduleKey];
    console.log(`Module Selected: ${selectedTool.name}`);
    
    // عارضی الرٹ تاکہ آپ کو پتہ چلے کہ کلک کام کر رہا ہے
    // بعد میں آپ یہاں اپنے ماڈیول کو اوپن کرنے کا اصل کوڈ لکھ سکتے ہیں
    alert(`آپ نے "${selectedTool.name}" کو سلیکٹ کیا ہے۔`);
    
    // مثال کے طور پر اگر آپ کے پاس ماڈیولز کے الگ سیکشن ہیں تو:
    // document.getElementById('main-menu').classList.add('hidden');
    // document.getElementById(`${moduleKey}-section`).classList.remove('hidden');
}
