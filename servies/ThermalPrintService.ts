const PDFDocument = require("pdfkit");
const fs = require("fs");

const LINE_WIDTH = 32;

const pad = (text: any, width: any, align = "left") => {
  text = String(text);
  if (text.length > width) return text.slice(0, width);
  return align === "right"
    ? text.padStart(width, " ")
    : text.padEnd(width, " ");
};

const formatQty = (item: any) => {
  return item.mode === "WEIGHT"
    ? `${item.qty}kg`
    : `${item.qty}pc`;
};

export const formatThermalBill = (items: any, billNumber: number = 0) => {
  let output = "";

  /* ---------- HEADER ---------- */
  output += pad(`Bill No ${billNumber}`, LINE_WIDTH, "right") + "\n";
  output += "Thaya Sweets & Cakes\n";
  output += "-------------------------------\n";

  output += "SN ITEM     QTY   RATE   AMT\n";
  output += "--------------------------------\n";

  let subtotal = 0;

  /* ---------- ITEMS ---------- */
  items.forEach((item: any, index: any) => {
    const amount = parseFloat(item.amount);
    subtotal += amount;

    output +=
      pad(index + 1, 3) +
      pad(item.name, 8) +
      pad(formatQty(item), 6, "right") +
      pad(item.rate.toFixed(2), 7, "right") +
      pad(amount.toFixed(2), 6, "right") +
      "\n";

    // Optional second line for mode clarity
    // output += `   (${item.mode})\n`;
  });

  /* ---------- TOTAL ---------- */
  output += "--------------------------------\n";
  output += pad("Subtotal", 26) + pad(subtotal.toFixed(2), 6, "right") + "\n";
  output += "--------------------------------\n";
  output += pad("THANK YOU", LINE_WIDTH, "right") + "\n\n\n";
try {
    // create PDF (requires installation of "pdfkit")
    // @ts-ignore
    // @ts-ignore

    const pdfPath = `./bill_${billNumber || Date.now()}.pdf`;
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.font("Courier").fontSize(10);
    doc.text(output, { lineBreak: true });

    doc.end();

    stream.on("finish", () => {
        console.log(`Saved PDF to ${pdfPath}`);
    });
    stream.on("error", (err: any) => {
        console.error("Failed to save PDF:", err);
    });
} catch (err) {
    // If pdfkit isn't available or writing fails, ignore and keep returning the plain text
}
  return output;
};
