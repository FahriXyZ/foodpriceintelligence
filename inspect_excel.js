import * as XLSX from "xlsx";
import * as fs from "fs";

function inspectFile(filePath) {
  console.log("=== Inspecting file:", filePath);
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    console.log("Sheet names:", workbook.SheetNames);
    for (const sheetName of workbook.SheetNames) {
      console.log(`\nSheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      console.log("Total rows:", data.length);
      if (data.length > 0) {
        console.log("First row keys:", Object.keys(data[0]));
        console.log("First row content:", data[0]);
      }
    }
  } catch (err) {
    console.error("Error reading file:", err);
  }
}

inspectFile("public/data/hasil_final_prediksi.xlsx");
inspectFile("public/data/prediksi_final_full.xlsx");
