import { jsPDF } from 'jspdf';
import { formatCurrency, formatCuit, formatDateTime } from './formatters';

export function downloadReceiptPdf({
  title = 'Comprobante de Transferencia',
  operationId,
  amount,
  createdAt,
  senderName,
  senderCuit,
  recipientName,
  recipientCuit,
  recipientBank,
  concept,
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(35, 16, 82);
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(255, 213, 74);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('padi.', 16, 20);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 16, 28);

  doc.setFontSize(9);
  doc.setTextColor(190, 180, 220);
  doc.text(formatDateTime(createdAt || new Date().toISOString()), pageWidth - 16, 20, { align: 'right' });

  doc.setFillColor(248, 246, 252);
  doc.roundedRect(16, 44, pageWidth - 32, 26, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(28, 22, 51);
  const formattedAmount = formatCurrency(Math.abs(amount));
  doc.text(formattedAmount, pageWidth / 2, 58, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129);
  doc.text('Transferencia exitosa', pageWidth / 2, 65, { align: 'center' });

  let y = 80;
  const drawRow = (label, value) => {
    if (!value) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(110, 104, 136);
    doc.text(label, 18, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(28, 22, 51);
    doc.text(String(value), pageWidth - 18, y, { align: 'right' });

    doc.setDrawColor(238, 233, 245);
    doc.line(18, y + 3, pageWidth - 18, y + 3);
    y += 9.5;
  };

  if (senderName) {
    drawRow('Originante (Envió)', senderName);
  }
  if (senderCuit) {
    drawRow('CUIT Originante', formatCuit(senderCuit));
  }
  if (recipientName) {
    drawRow('Destinatario (Recibió)', recipientName);
  }
  if (recipientCuit) {
    drawRow('CUIT Destinatario', formatCuit(recipientCuit));
  }
  if (recipientBank) {
    drawRow('Entidad de destino', recipientBank);
  }
  if (concept) {
    drawRow('Motivo / Concepto', concept);
  }
  if (operationId) {
    drawRow('N.º de operación', operationId);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 135, 163);
  doc.text('Comprobante emitido de forma digital por padi.', pageWidth / 2, y + 16, { align: 'center' });
  doc.text('padi. - Pagos Al Día · Finanzas digitales protegidas', pageWidth / 2, y + 21, { align: 'center' });

  const fileName = `comprobante-padi-${String(operationId || Date.now()).slice(-8)}.pdf`;
  doc.save(fileName);
}
