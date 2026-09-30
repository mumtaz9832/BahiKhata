import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDFBlob(
  elementId: string,
  onProgress?: (loading: boolean) => void
): Promise<Blob | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return null;
  }

  try {
    if (onProgress) onProgress(true);

    const prevScrollY = window.scrollY;
    window.scrollTo(0, 0);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
    });

    window.scrollTo(0, prevScrollY);

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 210;
    const pageMaxHeight = 297;
    const rawPdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Smart single-page fit: If document is within 12% of a single page,
    // scale to fit cleanly on 1 page to avoid ugly 2nd page with just signatures!
    if (rawPdfHeight <= pageMaxHeight * 1.12) {
      const scaleFactor = pageMaxHeight / rawPdfHeight;
      const fitWidth = pdfWidth * Math.min(1, scaleFactor);
      const fitHeight = rawPdfHeight * Math.min(1, scaleFactor);
      const xOffset = (pdfWidth - fitWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, 0, fitWidth, fitHeight);
    } else {
      let position = 0;
      let heightLeft = rawPdfHeight;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, rawPdfHeight);
      heightLeft -= pageMaxHeight;

      while (heightLeft > 0) {
        position -= pageMaxHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, rawPdfHeight);
        heightLeft -= pageMaxHeight;
      }
    }

    return pdf.output('blob');
  } catch (err) {
    console.error('Failed to generate PDF blob:', err);
    return null;
  } finally {
    if (onProgress) onProgress(false);
  }
}

export async function exportElementToPDF(
  elementId: string,
  filename: string = 'document.pdf',
  onProgress?: (loading: boolean) => void
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  try {
    if (onProgress) onProgress(true);

    const prevScrollY = window.scrollY;
    window.scrollTo(0, 0);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
    });

    window.scrollTo(0, prevScrollY);

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 210;
    const pageMaxHeight = 297;
    const rawPdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Smart single-page fit: If document is within 12% of a single page,
    // scale to fit cleanly on 1 page to avoid ugly 2nd page with just signatures!
    if (rawPdfHeight <= pageMaxHeight * 1.12) {
      const scaleFactor = pageMaxHeight / rawPdfHeight;
      const fitWidth = pdfWidth * Math.min(1, scaleFactor);
      const fitHeight = rawPdfHeight * Math.min(1, scaleFactor);
      const xOffset = (pdfWidth - fitWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, 0, fitWidth, fitHeight);
    } else {
      let position = 0;
      let heightLeft = rawPdfHeight;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, rawPdfHeight);
      heightLeft -= pageMaxHeight;

      while (heightLeft > 0) {
        position -= pageMaxHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, rawPdfHeight);
        heightLeft -= pageMaxHeight;
      }
    }

    pdf.save(filename);
  } catch (error) {
    console.error('PDF generation error:', error);
    window.print();
  } finally {
    if (onProgress) onProgress(false);
  }
}

export function triggerPrintDialog(): void {
  window.print();
}
