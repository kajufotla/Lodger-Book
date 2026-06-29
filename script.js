const PDFEngine = {
  async mergePDF(files, updateProgress) {
    try {
      updateProgress(0, "Starting merge process...");
      const { PDFDocument } = window.PDFLib;
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        updateProgress(Math.round((i / files.length) * 80), `Loading and processing file ${i + 1} of ${files.length}...`);
        const arrayBuffer = await files[i].arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      updateProgress(90, "Finalizing merged document...");
      const pdfBytes = await mergedPdf.save();
      updateProgress(100, "Merge complete!");
      return pdfBytes;
    } catch (error) {
      updateProgress(0, "Error merging PDFs");
      throw new Error("Merge failed: " + error.message);
    }
  },

  async splitPDF(file, options, updateProgress) {
    try {
      updateProgress(0, "Starting split process...");
      const { PDFDocument } = window.PDFLib;
      
      updateProgress(30, "Loading document...");
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      
      updateProgress(60, "Extracting page range...");
      const splitPdf = await PDFDocument.create();
      
      const { start, end } = options; 
      // Convert to 0-based index
      const startIndex = Math.max(0, start - 1);
      const endIndex = Math.min(originalPdf.getPageCount() - 1, end - 1);
      
      const indices = [];
      for (let i = startIndex; i <= endIndex; i++) indices.push(i);

      const copiedPages = await splitPdf.copyPages(originalPdf, indices);
      copiedPages.forEach((page) => splitPdf.addPage(page));

      updateProgress(90, "Finalizing split document...");
      const pdfBytes = await splitPdf.save();
      updateProgress(100, "Split complete!");
      return pdfBytes;
    } catch (error) {
      updateProgress(0, "Error splitting PDF");
      throw new Error("Split failed: " + error.message);
    }
  },

  async imagesToPDF(files, updateProgress) {
    try {
      updateProgress(0, "Starting image conversion...");
      const { PDFDocument } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        updateProgress(Math.round((i / files.length) * 80), `Processing image ${i + 1} of ${files.length}...`);
        const arrayBuffer = await files[i].arrayBuffer();
        let image;
        
        if (files[i].type === 'image/jpeg' || files[i].type === 'image/jpg') {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } else if (files[i].type === 'image/png') {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else {
          continue; // Skip unsupported
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      updateProgress(90, "Saving document...");
      const pdfBytes = await pdfDoc.save();
      updateProgress(100, "Images converted to PDF!");
      return pdfBytes;
    } catch (error) {
      updateProgress(0, "Error converting images");
      throw new Error("Image to PDF failed: " + error.message);
    }
  },

  async pdfToImages(file, updateProgress) {
    try {
      updateProgress(0, "Starting PDF to Image extraction...");
      updateProgress(100, "Operation requires pdf.js (Canvas Rendering)");
      // Note: pdf-lib does not support rendering PDFs to images. 
      // In a production app, this requires pdf.js to render pages to a canvas, then canvas.toBlob()
      throw new Error("PDF to Images requires a rendering engine like pdf.js");
    } catch (error) {
      throw error;
    }
  },

  async compressPDF(file, updateProgress) {
    try {
      updateProgress(0, "Starting compression...");
      const { PDFDocument } = window.PDFLib;
      
      updateProgress(40, "Loading document...");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      updateProgress(80, "Optimizing and saving document...");
      // pdf-lib does basic compression by removing unused objects 
      // and natively supports object streams.
      const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
      
      updateProgress(100, "Compression complete!");
      return pdfBytes;
    } catch (error) {
      updateProgress(0, "Error compressing PDF");
      throw new Error("Compression failed: " + error.message);
    }
  },

  async rotatePDF(file, angle, updateProgress) {
    try {
      updateProgress(0, "Starting rotation process...");
      const { PDFDocument, degrees } = window.PDFLib;
      
      updateProgress(30, "Loading document...");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      updateProgress(60, "Rotating pages...");
      const pages = pdfDoc.getPages();
      pages.forEach(page => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + angle));
      });

      updateProgress(90, "Saving document...");
      const pdfBytes = await pdfDoc.save();
      updateProgress(100, "Rotation complete!");
      return pdfBytes;
    } catch (error) {
      updateProgress(0, "Error rotating PDF");
      throw new Error("Rotation failed: " + error.message);
    }
  },

  async deletePages(file, pagesToDelete, updateProgress) {
    try {
      updateProgress(0, "Starting page deletion...");
      const { PDFDocument } = window.PDFLib;
      
      updateProgress(40, "Loading document...");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      updateProgress(70, "Removing specified pages...");
      // Sort descending to avoid index shifting issues during deletion
      const sortedPages = [...pagesToDelete].sort((a, b) => b - a);
      for (const pageNum of sortedPages) {
        // Assume pagesToDelete is 1-based
        if (pageNum > 0 && pageNum <= pdfDoc.getPageCount()) {
          pdfDoc.removePage(pageNum - 1);
        }
      }

      updateProgress(90, "Saving document...");
      const pdfBytes = await pdfDoc.save();
      updateProgress(100, "Pages deleted!");
      return pdfBytes;
    } catch (error) {
      updateProgress(0, "Error deleting pages");
      throw new Error("Deletion failed: " + error.message);
    }
  },

  async extractPages(file, pageArray, updateProgress) {
    try {
      updateProgress(0, "Starting page extraction...");
      const { PDFDocument } = window.PDFLib;
      
      updateProgress(30, "Loading document...");
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      
      updateProgress(60, "Copying selected pages...");
      // Convert 1-based indices to 0-based
      const zeroBasedIndices = pageArray.map(p => p - 1).filter(p => p >= 0 && p < originalPdf.getPageCount());
      
      const copiedPages = await newPdf.copyPages(originalPdf, zeroBasedIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      updateProgress(90, "Saving document...");
      const pdfBytes = await newPdf.save();
      updateProgress(100, "Extraction complete!");
      return pdfBytes;
    } catch (error) {
      updateProgress(0, "Error extracting pages");
      throw new Error("Extraction failed: " + error.message);
    }
  },

  async reorderPages(file, newOrderArray, updateProgress) {
    try {
      updateProgress(0, "Starting page reordering...");
      const { PDFDocument } = window.PDFLib;
      
      updateProgress(30, "Loading document...");
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      
      updateProgress(60, "Reordering pages...");
      const zeroBasedIndices = newOrderArray.map(p => p - 1);
      const copiedPages = await newPdf.copyPages(originalPdf, zeroBasedIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      updateProgress(90, "Saving document...");
      const pdfBytes = await newPdf.save();
      updateProgress(100, "Reorder complete!");
      return pdfBytes;
    } catch (error) {
      updateProgress(0, "Error reordering pages");
      throw new Error("Reorder failed: " + error.message);
    }
  },

  async cropPDF(file, cropBox, updateProgress) {
    try {
      updateProgress(0, "Starting cropping process...");
      const { PDFDocument } = window.PDFLib;
      
      updateProgress(30, "Loading document...");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      updateProgress(60, "Applying crop box to pages...");
      const pages = pdfDoc.getPages();
      const { x, y, width, height } = cropBox;
      
      pages.forEach(page => {
        page.setCropBox(x, y, width, height);
      });

      updateProgress(90, "Saving document...");
      const pdfBytes = await pdfDoc.save();
      updateProgress(100, "Cropping complete!");
      return pdfBytes;
    } catch (error) {
      updateProgress(0, "Error cropping PDF");
      throw new Error("Crop failed: " + error.message);
    }
  },

  async addWatermark(file, textOrImage, updateProgress) {
    try {
      updateProgress(0, "Starting watermark process...");
      const { PDFDocument, rgb, degrees } = window.PDFLib;
      
      updateProgress(30, "Loading document...");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      updateProgress(60, "Applying watermark...");
      const pages = pdfDoc.getPages();
      
      pages.forEach(page => {
        const { width, height } = page.getSize();
        page.drawText(textOrImage, {
          x: width / 2 - 100,
          y: height / 2,
          size: 50,
          color: rgb(0.7, 0.7, 0.7),
          rotate: degrees(45),
          opacity: 0.3
        });
      });

      updateProgress(90, "Saving document...");
      const pdfBytes = await pdfDoc.save();
      updateProgress(100, "Watermark added!");
      return pdfBytes;
    } catch (error) {
      updateProgress(0, "Error adding watermark");
      throw new Error("Watermarking failed: " + error.message);
    }
  },

  async addPageNumbers(file, updateProgress) {
    try {
      updateProgress(0, "Adding page numbers...");
      const { PDFDocument, rgb } = window.PDFLib;
      
      updateProgress(30, "Loading document...");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      updateProgress(60, "Writing numbers to pages...");
      const pages = pdfDoc.getPages();
      
      pages.forEach((page, index) => {
        const { width } = page.getSize();
        page.drawText(`${index + 1}`, {
          x: width / 2,
          y: 20,
          size: 12,
          color: rgb(0, 0, 0),
        });
      });

      updateProgress(90, "Saving document...");
      const pdfBytes = await pdfDoc.save();
      updateProgress(100, "Page numbers added!");
      return pdfBytes;
    } catch (error) {
      updateProgress(0, "Error adding page numbers");
      throw new Error("Page numbering failed: " + error.message);
    }
  },

  async addHeaderFooter(file, headerText, footerText, updateProgress) {
    try {
      updateProgress(0, "Adding headers and footers...");
      const { PDFDocument, rgb } = window.PDFLib;
      
      updateProgress(30, "Loading document...");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      updateProgress(60, "Applying text to pages...");
      const pages = pdfDoc.getPages();
      
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        if (headerText) {
          page.drawText(headerText, { x: 30, y: height - 30, size: 10, color: rgb(0, 0, 0) });
        }
        if (footerText) {
          page.drawText(footerText, { x: 30, y: 20, size: 10, color: rgb(0, 0, 0) });
        }
      });

      updateProgress(90, "Saving document...");
      const pdfBytes = await pdfDoc.save();
      updateProgress(100, "Headers/Footers added!");
      return pdfBytes;
    } catch (error) {
      updateProgress(0, "Error adding header/footer");
      throw new Error("Header/Footer failed: " + error.message);
    }
  },

  async flattenPDF(file, updateProgress) {
    try {
      updateProgress(0, "Starting PDF flattening...");
      const { PDFDocument } = window.PDFLib;
      
      updateProgress(40, "Loading document...");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      updateProgress(70, "Flattening form fields...");
      const form = pdfDoc.getForm();
      form.flatten();

      updateProgress(90, "Saving document...");
      const pdfBytes = await pdfDoc.save();
      updateProgress(100, "Flattening complete!");
      return pdfBytes;
    } catch (error) {
      updateProgress(0, "Error flattening PDF");
      throw new Error("Flattening failed: " + error.message);
    }
  },

  async jpgToPDF(files, updateProgress) {
    return await this.imagesToPDF(files, updateProgress);
  },

  async pngToPDF(files, updateProgress) {
    return await this.imagesToPDF(files, updateProgress);
  },

  async extractText(file, updateProgress) {
    try {
      updateProgress(0, "Starting text extraction...");
      updateProgress(100, "Operation requires pdf.js");
      // Note: pdf-lib does not support extracting text from PDF streams.
      // This requires pdf.js (e.g. pdf.js getTextContent() API)
      throw new Error("Text extraction requires a parsing library like pdf.js");
    } catch (error) {
      throw error;
    }
  },

  async viewer(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      throw new Error("Viewer initialization failed: " + error.message);
    }
  }
};

function downloadFile(uint8Array, filename, mimeType) {
  const blob = new Blob([uint8Array], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
