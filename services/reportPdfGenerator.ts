import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, AppSettings, BusinessProfile, Customer } from '../types.ts';

interface GenerateReportPdfParams {
  orders: Order[];
  settings: AppSettings;
  profile: BusinessProfile;
  startDate: string;
  endDate: string;
  reportType?: 'weekly' | 'monthly' | 'custom';
}

interface GenerateCustomerPdfParams {
  customers: Customer[];
  settings: AppSettings;
  profile: BusinessProfile;
}

export const generateSalesReportPdf = ({
  orders,
  settings,
  profile,
  startDate,
  endDate,
}: GenerateReportPdfParams) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const bName = (settings.businessName || profile?.ownerName || settings.invoiceHeader || 'Chai Hub').toUpperCase();
  const address = profile?.address || 'Nagpur, Maharashtra';
  const phone = profile?.ownerNumber || '';
  const fssai = profile?.fssai ? `FSSAI: ${profile.fssai}` : '';

  // Calculate Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalDiscounts = orders.reduce((sum, o) => sum + (o.discount || 0), 0);
  const upiSales = orders.filter(o => o.paymentMethod === 'UPI').reduce((sum, o) => sum + o.total, 0);
  const cashSales = orders.filter(o => o.paymentMethod === 'Cash').reduce((sum, o) => sum + o.total, 0);
  const otherSales = totalRevenue - (upiSales + cashSales);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. HEADER SECTION - Prominent Business Name
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Business Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(bName, 14, 14);

  // Business Subtitle / Details
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate 300
  const subText = [address, phone, fssai].filter(Boolean).join('  |  ');
  doc.text(subText, 14, 20);

  // Report Label on Top Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(96, 165, 250); // Blue 400
  doc.text('SALES & AUDIT REPORT', pageWidth - 14, 13, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  const formattedStart = new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedEnd = new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Period: ${formattedStart} - ${formattedEnd}`, pageWidth - 14, 19, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - 14, 25, { align: 'right' });

  // 2. METRICS OVERVIEW CARDS
  const startY = 38;
  const cardWidth = (pageWidth - 28 - 9) / 4; // 4 cards with 3mm gap
  const cardHeight = 18;

  const metricsData = [
    { label: 'GROSS REVENUE', val: `INR ${totalRevenue.toFixed(2)}`, color: [37, 99, 235] },
    { label: 'TOTAL ORDERS', val: `${totalOrders}`, color: [16, 185, 129] },
    { label: 'AVG ORDER VALUE', val: `INR ${avgOrderValue.toFixed(2)}`, color: [99, 102, 241] },
    { label: 'DISCOUNTS GIVEN', val: `INR ${totalDiscounts.toFixed(2)}`, color: [225, 29, 72] },
  ];

  metricsData.forEach((m, i) => {
    const x = 14 + i * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x + 3, startY + 5.5);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.val, x + 3, startY + 12.5);
  });

  // Payment Breakdown Strip
  const paymentY = startY + cardHeight + 4;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, paymentY, pageWidth - 28, 8, 1.5, 1.5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Payment Methods Breakdown:', 18, paymentY + 5.2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`UPI / Online: INR ${upiSales.toFixed(2)}   |   Cash: INR ${cashSales.toFixed(2)}   |   Other: INR ${otherSales.toFixed(2)}`, 68, paymentY + 5.2);

  // 3. TABLE OF ORDERS
  const tableData = orders.map((o, idx) => [
    `#${idx + 1}`,
    o.id,
    o.tableName,
    new Date(o.createdAt).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    o.paymentMethod || 'Cash',
    `${o.items.length} items`,
    `INR ${o.total.toFixed(2)}`,
    'PAID'
  ]);

  autoTable(doc, {
    startY: paymentY + 12,
    head: [['SR', 'BILL NO', 'TABLE', 'DATE & TIME', 'PAYMENT', 'ITEMS', 'TOTAL', 'STATUS']],
    body: tableData.length > 0 ? tableData : [['-', '-', 'No completed transactions in this period', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 38 },
      4: { cellWidth: 22 },
      5: { cellWidth: 20 },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 18, halign: 'center' },
    },
    margin: { left: 14, right: 14, bottom: 22 },
    didDrawPage: (data) => {
      // 4. BOTTOM COMPANY BRANDING (ON EVERY PAGE)
      const pageCount = doc.getNumberOfPages();
      const currPage = data.pageNumber;

      // Bottom separator rule
      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

      // BillWise Company Branding (Left)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text('BiLLWiSE', 14, pageHeight - 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('•  Enterprise Restaurant Point of Sale System', 32, pageHeight - 10.5);

      // Client attribution (Center)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(217, 119, 6); // Amber 600
      doc.text(`Client License: ${bName}`, pageWidth / 2, pageHeight - 10.5, { align: 'center' });

      // Page numbers (Right)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${currPage} of ${pageCount}`, pageWidth - 14, pageHeight - 10.5, { align: 'right' });
    }
  });

  const cleanBusiness = bName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${cleanBusiness}_SalesReport_${startDate}_to_${endDate}.pdf`;
  doc.save(filename);
};

export const generateCustomerReportPdf = ({
  customers,
  settings,
  profile,
}: GenerateCustomerPdfParams) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const bName = (settings.businessName || profile?.ownerName || settings.invoiceHeader || 'Chai Hub').toUpperCase();
  const address = profile?.address || 'Nagpur, Maharashtra';
  const phone = profile?.ownerNumber || '';

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // HEADER
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(bName, 14, 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text([address, phone].filter(Boolean).join('  |  '), 14, 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(96, 165, 250);
  doc.text('CUSTOMER MASTER REPORT', pageWidth - 14, 13, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`Total Customers: ${customers.length}`, pageWidth - 14, 19, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - 14, 25, { align: 'right' });

  // TABLE OF CUSTOMERS
  const tableData = customers.map((c, idx) => [
    `#${idx + 1}`,
    c.name || 'N/A',
    c.phone || 'N/A',
    `${c.totalVisits || 1}`,
    `INR ${(c.totalSpent || 0).toFixed(2)}`,
    c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
  ]);

  autoTable(doc, {
    startY: 36,
    head: [['SR', 'CUSTOMER NAME', 'PHONE NUMBER', 'VISITS', 'TOTAL SPENT', 'LAST VISIT DATE']],
    body: tableData.length > 0 ? tableData : [['-', 'No customer records found', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 45, fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 32, halign: 'right' },
    },
    margin: { left: 14, right: 14, bottom: 22 },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      const currPage = data.pageNumber;

      // Bottom separator rule
      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

      // BillWise Company Branding (Left)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text('BiLLWiSE', 14, pageHeight - 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('•  Enterprise Restaurant Point of Sale System', 32, pageHeight - 10.5);

      // Client attribution (Center)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(217, 119, 6);
      doc.text(`Client: ${bName}`, pageWidth / 2, pageHeight - 10.5, { align: 'center' });

      // Page numbers (Right)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${currPage} of ${pageCount}`, pageWidth - 14, pageHeight - 10.5, { align: 'right' });
    }
  });

  const cleanBusiness = bName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${cleanBusiness}_CustomerReport_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
