// PDF.js worker کو سیٹ اپ کرنا لازمی ہے
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const optionsSection = document.getElementById('optionsSection');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const convertBtn = document.getElementById('convertBtn');
const imageFormat = document.getElementById('imageFormat');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');
const progressPercent = document.getElementById('progressPercent');
const downloadSection = document.getElementById('downloadSection');
const downloadBtn = document.getElementById('downloadBtn');

let selectedFile = null;
let zipBlobUrl = null;

// Drag and drop event listeners
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-indigo-500', 'bg-indigo-50/30');
});
dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/30');
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/30');
    if (e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
    }
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
    }
});

// فائل ہینڈلنگ فنکشن
function handleFileSelection(file) {
    if (file.type !== 'application/pdf') {
        alert('براہ کرم صرف پی ڈی ایف (PDF) فائل اپلوڈ کریں۔');
        return;
    }
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    
    // UI ری سیٹ اور شو کریں
    optionsSection.classList.remove('hidden');
    progressSection.classList.add('hidden');
    downloadSection.classList.add('hidden');
    if (zipBlobUrl) {
        URL.revokeObjectURL(zipBlobUrl);
        zipBlobUrl = null;
    }
}

// کنورٹ بٹن کا ایکشن
convertBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    // UI کو لاک اور پروگریس بار شو کریں
    convertBtn.disabled = true;
    convertBtn.style.opacity = '0.6';
    progressSection.classList.remove('hidden');
    downloadSection.classList.add('hidden');
    updateProgress(0, 'Reading PDF file...');

    try {
        const fileReader = new FileReader();
        fileReader.onload = async function () {
            const typedarray = new Uint8Array(this.result);
            
            // PDF لوڈ کریں
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            const totalPages = pdf.numPages;
            const zip = new JSZip();
            const format = imageFormat.value; // jpeg or png
            const mimeType = `image/${format}`;
            const extension = format === 'jpeg' ? 'jpg' : 'png';

            // ہر پیج کو ایک ایک کر کے امیج میں تبدیل کریں
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                updateProgress(
                    Math.round(((pageNum - 1) / totalPages) * 90), 
                    `Converting page ${pageNum} of ${totalPages}...`
                );

                const page = await pdf.getPage(pageNum);
                
                // ہائی کوالٹی رینڈرنگ کے لیے اسکیل 2.0 پر رکھا ہے
                const scale = 2.0; 
                const viewport = page.getViewport({ scale: scale });

                // بیک گراؤنڈ کینوس بنائیں
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                // کینوس پر پیج ڈرا کریں
                await page.render(renderContext).promise;

                // کینوس کو ڈیٹا یو آر ایل (Base64) میں بدلیں
                const dataUrl = canvas.toDataURL(mimeType, 0.92);
                const base64Data = dataUrl.split(',')[1];

                // زپ فولڈر میں فائل ایڈ کریں
                const imgFileName = `page-${pageNum}.${extension}`;
                zip.file(imgFileName, base64Data, { base64: true });
                
                // میموری کو صاف کرنے کے لیے کینوس کا سائز زیرو کر دیں
                canvas.width = 0;
                canvas.height = 0;
            }

            // زپ فائل تیار کریں
            updateProgress(95, 'Generating ZIP file...');
            const content = await zip.generateAsync({ type: 'blob' });
            zipBlobUrl = URL.createObjectURL(content);

            // کامیابی پر UI اپڈیٹ کریں
            updateProgress(100, 'Conversion completed successfully!');
            downloadSection.classList.remove('hidden');
            convertBtn.disabled = false;
            convertBtn.style.opacity = '1';
        };

        fileReader.readAsArrayBuffer(selectedFile);

    } catch (error) {
        console.error(error);
        alert('فائل پروسیس کرنے میں کوئی مسئلہ آیا ہے۔ دوبارہ کوشش کریں۔');
        convertBtn.disabled = false;
        convertBtn.style.opacity = '1';
        progressSection.classList.add('hidden');
    }
});

// ڈاؤن لوڈ بٹن کا ایکشن
downloadBtn.addEventListener('click', () => {
    if (!zipBlobUrl) return;
    const a = document.createElement('a');
    a.href = zipBlobUrl;
    const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
    a.download = `${baseName}_images.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

// پروگریس بار اپڈیٹ کرنے کا ہیلپر فنکشن
function updateProgress(percentage, text) {
    progressBar.style.width = `${percentage}%`;
    progressPercent.textContent = `${percentage}%`;
    statusText.textContent = text;
}
