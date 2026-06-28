const { PDFDocument, rgb, degrees } = PDFLib;

/* =========================
   UI HELPERS CLASS
========================= */
class AppUI {

    static showToast(msg, type = 'success') {
        const t = document.getElementById('toast');
        const isError = type === 'error';

        t.innerHTML = isError
            ? `<i class="fa-solid fa-circle-exclamation"></i> <span>${msg}</span>`
            : `<i class="fa-solid fa-circle-check"></i> <span>${msg}</span>`;

        t.className =
            `fixed bottom-6 right-6 px-5 py-3 rounded-xl text-white text-xs font-semibold shadow-2xl flex items-center space-x-2 z-50 transition-all duration-300 transform translate-y-0 opacity-100 ` +
            (isError ? 'bg-red-500' : 'bg-emerald-600');

        setTimeout(() => {
            t.classList.remove('translate-y-0', 'opacity-100');
            t.classList.add('translate-y-20', 'opacity-0');
        }, 4000);
    }

    static renderFileInput(tool, multiple = false, accept = ".pdf") {
        return `
            <div class="space-y-3">
                <input type="file" id="active-file-input"
                    ${multiple ? 'multiple' : ''}
                    accept="${accept}"
                    class="w-full text-xs border p-3 rounded-xl">
            </div>
        `;
    }

    static loadImgDims(input) {
        if (!input.files || !input.files.length) return;

        const file = input.files[0];
        const img = new Image();

        img.onload = () => {
            document.getElementById('img-w').value = img.width;
            document.getElementById('img-h').value = img.height;
        };

        img.src = URL.createObjectURL(file);
    }
}

/* =========================
   PDF PROCESSING ENGINE
========================= */
class PDFEngine {

    static async downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    static async execute(id) {
        const input = document.getElementById('active-file-input');
        const btn = document.getElementById('execute-btn');

        if (!input || !input.files.length) {
            throw new Error("Please upload a file first.");
        }

        const old = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = "Processing...";

        try {
            let blob;
            let filename = `output-${id}.pdf`;

            if (id === 'merge') {
                blob = await this.processMerge(input.files);
            }

            else if (id === 'imgToPdf') {
                blob = await this.processImagesToPdf(input.files);
            }

            else if (id === 'split') {
                blob = await this.processSinglePDF(input.files[0], 'split');
                filename = "split.zip";
            }

            else {
                const bytes = await input.files[0].arrayBuffer();
                const pdf = await PDFDocument.load(bytes);
                blob = await this.processSinglePDF(pdf, id);
            }

            await this.downloadBlob(blob, filename);
            AppUI.showToast("Done successfully!");

        } catch (e) {
            AppUI.showToast(e.message, 'error');
        }

        btn.disabled = false;
        btn.innerHTML = old;
    }

    static async processMerge(files) {
        const doc = await PDFDocument.create();

        for (let f of files) {
            const bytes = await f.arrayBuffer();
            const src = await PDFDocument.load(bytes);

            const pages = await doc.copyPages(src, src.getPageIndices());
            pages.forEach(p => doc.addPage(p));
        }

        return new Blob([await doc.save()], { type: "application/pdf" });
    }

    static async processImagesToPdf(files) {
        const doc = await PDFDocument.create();

        for (let f of files) {
            const bytes = await f.arrayBuffer();

            let img;
            if (f.type === 'image/png') img = await doc.embedPng(bytes);
            else img = await doc.embedJpg(bytes);

            const page = doc.addPage();
            page.drawImage(img, {
                x: 50,
                y: 200,
                width: 400,
                height: 500
            });
        }

        return new Blob([await doc.save()], { type: "application/pdf" });
    }

    static async processSinglePDF(pdf, action) {

        const total = pdf.getPageCount();

        if (action === 'rotate') {
            pdf.getPages().forEach(p => {
                p.setRotation(degrees(90));
            });
        }

        if (action === 'split') {
            const zip = new JSZip();

            for (let i = 0; i < total; i++) {
                const newDoc = await PDFDocument.create();
                const [page] = await newDoc.copyPages(pdf, [i]);
                newDoc.addPage(page);

                zip.file(`page-${i + 1}.pdf`, await newDoc.save());
            }

            return await zip.generateAsync({ type: "blob" });
        }

        return new Blob([await pdf.save()], { type: "application/pdf" });
    }
}

/* =========================
   GLOBAL FUNCTION (UI HOOK)
========================= */
window.activateWorkspace = function (id) {
    document.getElementById('canvas-content').innerHTML =
        `<div>Tool Loaded: ${id}</div>
         <button onclick="PDFEngine.execute('${id}')" id="execute-btn">Run</button>`;
};
