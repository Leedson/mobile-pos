import { generatePDF } from "react-native-html-to-pdf";
import RNFS from "react-native-fs";

const movePdfToDownloads = async (filePath: any) => {
  try {
    const downloadsPath =
      RNFS.DownloadDirectoryPath + `/Bill_${Date.now()}.pdf`;

    await RNFS.copyFile(filePath, downloadsPath);

    console.log("Saved to Downloads:", downloadsPath);
    return downloadsPath;
  } catch (err) {
    console.error("Move failed", err);
  } 
};

export const saveBillPdf = async (items: any) => {
  try {
    const html = generateBillHTML(items);

    const options = {
      html,
      fileName: `Bill_${Date.now()}`,
      directory: "Documents", // Android: /Documents
    };

    const file = await generatePDF(options);
    const newpath = await movePdfToDownloads(file.filePath);
    console.log("PDF saved at:", file.filePath , newpath);
    return file.filePath;
  } catch (error) {
    console.error("PDF generation error:", error);
  }
};

export const generateBillHTML = (items: any) => {
  let rows = "";
  let subtotal = 0;

  items.forEach((item: any, i: any) => {
    subtotal += parseFloat(item.amount);

    rows += `
      <tr>
        <td>${i + 1}</td>
        <td>${item.name}</td>
        <td>${item.mode === "WEIGHT" ? item.qty + " kg" : item.qty + " pc"}</td>
        <td>${item.rate}</td>
        <td>${item.amount}</td>
      </tr>
    `;
  });

  return `
    <html>
    <head>
      <style>
        body { font-family: monospace; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border-bottom: 1px dashed #000; padding: 4px; }
        .center { text-align: center; }
        .right { text-align: right; }
      </style>
    </head>
    <body>
      <h3 class="center">Thaya's</h3>
      <p class="center">Sweet & Cakes Shop</p>
      <p class="center">TH/NS/${Date.now()}</p>
      <table>
        <tr>
          <th>SN</th>
          <th>Item</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amt</th>
        </tr>
        ${rows}
      </table>

      <h4 class="right">TOTAL: ₹ ${subtotal.toFixed(2)}</h4>

      <p class="center">Thank You</p>
    </body>
    </html>
  `;
};
