import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

    // Save previous scroll
    const prevScrollY = window.scrollY;
    window.scrollTo(0, 0);

    const canvas = await html2canvas(element, {
      scale: 2, // 2x for sharp retina typography and lines
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
    });

    window.scrollTo(0, prevScrollY);

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    
    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Check if height exceeds single A4 page
    if (pdfHeight > 297) {
      let position = 0;
      let heightLeft = pdfHeight;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= 297;

      while (heightLeft > 0) {
        position -= 297;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= 297;
      }
    } else {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(filename);
  } catch (error) {
    console.error('PDF generation error:', error);
    // Fallback to print
    window.print();
  } finally {
    if (onProgress) onProgress(false);
  }
}

export function triggerPrintDialog(): void {
  window.print();
}
