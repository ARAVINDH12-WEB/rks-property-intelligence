import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

const rawData = [
  { plotNo1: 1, sqft1: 2177.13, cent1: 5.00, plotNo2: 30, sqft2: 1501.79, cent2: 3.45 },
  { plotNo1: 2, sqft1: 2537.61, cent1: 5.82, plotNo2: 31, sqft2: 1501.90, cent2: 3.45 },
  { plotNo1: 3, sqft1: 2229.33, cent1: 5.12, plotNo2: 32, sqft2: 1489.85, cent2: 3.42 },
  { plotNo1: 4, sqft1: 1645.49, cent1: 3.78, plotNo2: 33, sqft2: 1689.41, cent2: 3.88 },
  { plotNo1: 5, sqft1: 2052.37, cent1: 4.71, plotNo2: 34, sqft2: 1425.05, cent2: 3.27 },
  { plotNo1: 6, sqft1: 1925.89, cent1: 4.42, plotNo2: 35, sqft2: 1425.05, cent2: 3.27 },
  { plotNo1: 7, sqft1: 2233.10, cent1: 5.12, plotNo2: 36, sqft2: 1425.05, cent2: 3.27 },
  { plotNo1: 8, sqft1: 1476.82, cent1: 3.39, plotNo2: 37, sqft2: 1412.99, cent2: 3.24 },
  { plotNo1: 9, sqft1: 1476.82, cent1: 3.39, plotNo2: 38, sqft2: 1428.06, cent2: 3.28 },
  { plotNo1: 10, sqft1: 1464.77, cent1: 3.36, plotNo2: 39, sqft2: 1412.99, cent2: 3.24 },
  { plotNo1: 11, sqft1: 1464.77, cent1: 3.36, plotNo2: 40, sqft2: 1425.05, cent2: 3.27 },
  { plotNo1: 12, sqft1: 1476.82, cent1: 3.39, plotNo2: 41, sqft2: 1425.05, cent2: 3.27 },
  { plotNo1: 13, sqft1: 1475.74, cent1: 3.39, plotNo2: 42, sqft2: 623.67, cent2: 1.43 },
  { plotNo1: 14, sqft1: 1475.74, cent1: 3.39, plotNo2: 43, sqft2: 623.67, cent2: 1.43 },
  { plotNo1: 15, sqft1: 1475.74, cent1: 3.39, plotNo2: 44, sqft2: 623.67, cent2: 1.43 },
  { plotNo1: 16, sqft1: 1230.33, cent1: 2.82, plotNo2: 45, sqft2: 623.67, cent2: 1.43 },
  { plotNo1: 17, sqft1: 1326.02, cent1: 3.04, plotNo2: 46, sqft2: 669.63, cent2: 1.54 },
  { plotNo1: 18, sqft1: 1475.74, cent1: 3.39, plotNo2: 47, sqft2: 544.34, cent2: 1.25 },
  { plotNo1: 19, sqft1: 1475.74, cent1: 3.39, plotNo2: 48, sqft2: 584.82, cent2: 1.34 },
  { plotNo1: 20, sqft1: 1475.74, cent1: 3.39, plotNo2: 49, sqft2: 584.92, cent2: 1.34 },
  { plotNo1: 21, sqft1: 1464.77, cent1: 3.36, plotNo2: 50, sqft2: 584.92, cent2: 1.34 },
  { plotNo1: 22, sqft1: 1492.97, cent1: 3.43, plotNo2: 51, sqft2: 584.92, cent2: 1.34 },
  { plotNo1: 23, sqft1: 1501.79, cent1: 3.45, plotNo2: 52, sqft2: 584.92, cent2: 1.34 },
  { plotNo1: 24, sqft1: 1501.79, cent1: 3.45, plotNo2: 53, sqft2: 584.92, cent2: 1.34 },
  { plotNo1: 25, sqft1: 1501.79, cent1: 3.45, plotNo2: 54, sqft2: 584.92, cent2: 1.34 },
  { plotNo1: 26, sqft1: 1512.13, cent1: 3.47, plotNo2: 55, sqft2: 584.92, cent2: 1.34 },
  { plotNo1: 27, sqft1: 1612.55, cent1: 3.70, plotNo2: 56, sqft2: 584.92, cent2: 1.34 },
  { plotNo1: 28, sqft1: 1501.79, cent1: 3.45, plotNo2: 57, sqft2: 413.12, cent2: 0.95 },
  { plotNo1: 29, sqft1: 1501.79, cent1: 3.45, plotNo2: 58, sqft2: 425.29, cent2: 0.98 },
];

function getRate(plotNo: number): number {
  if (plotNo === 2 || plotNo === 3) {
    return 900;
  }
  return 850;
}

// 1. Side-by-Side Excel matching the Image Format + Rates & Total Price
const sideBySideRows = rawData.map((r) => {
  const rate1 = getRate(r.plotNo1);
  const totalPrice1 = Math.round(r.sqft1 * rate1);

  const rate2 = getRate(r.plotNo2);
  const totalPrice2 = Math.round(r.sqft2 * rate2);

  return {
    'Plot No': r.plotNo1,
    'Sq.ft': r.sqft1,
    'Cent': r.cent1,
    'Rate / Sq.Ft (₹)': rate1,
    'Total Price (₹)': totalPrice1,
    ' ': '', // Visual separator column
    'Plot No ': r.plotNo2,
    'Sq.ft ': r.sqft2,
    'Cent ': r.cent2,
    'Rate / Sq.Ft (₹) ': rate2,
    'Total Price (₹) ': totalPrice2,
  };
});

const wbSideBySide = xlsx.utils.book_new();
const wsSideBySide = xlsx.utils.json_to_sheet(sideBySideRows);
xlsx.utils.book_append_sheet(wbSideBySide, wsSideBySide, 'Plot Schedule with Rates');

const outputDir = path.join(process.cwd(), 'downloads');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sideBySidePath = path.join(outputDir, 'RKS_Plot_Schedule_With_Rates_ImageFormat.xlsx');
xlsx.writeFile(wbSideBySide, sideBySidePath);

// 2. Sequential 1-to-58 Master Inventory
const sequentialRows: any[] = [];

for (let i = 1; i <= 58; i++) {
  let sqft = 0;
  let cent = 0;

  const found1 = rawData.find((r) => r.plotNo1 === i);
  if (found1) {
    sqft = found1.sqft1;
    cent = found1.cent1;
  } else {
    const found2 = rawData.find((r) => r.plotNo2 === i);
    if (found2) {
      sqft = found2.sqft2;
      cent = found2.cent2;
    }
  }

  const rate = getRate(i);
  const totalPrice = Math.round(sqft * rate);

  sequentialRows.push({
    'Plot No': `Plot ${i}`,
    'Property ID': `RKS-PLOT-${String(i).padStart(3, '0')}`,
    'Area (Sq.Ft)': sqft,
    'Area (Cent)': cent,
    'Rate / Sq.Ft (INR)': rate,
    'Total Price (INR)': totalPrice,
    'Area (Sq.M)': Number((sqft * 0.092903).toFixed(2)),
    'Grounds': Number((sqft / 2400).toFixed(2)),
    'Availability': 'AVAILABLE',
  });
}

const wbMaster = xlsx.utils.book_new();
const wsMaster = xlsx.utils.json_to_sheet(sequentialRows);
xlsx.utils.book_append_sheet(wbMaster, wsMaster, 'RKS Plot Inventory (1-58)');

const masterPath = path.join(outputDir, 'RKS_Plot_Schedule_Sequential_1to58.xlsx');
xlsx.writeFile(wbMaster, masterPath);

const csvMasterPath = path.join(outputDir, 'RKS_Plot_Schedule_Sequential_1to58.csv');
const csvContent = xlsx.utils.sheet_to_csv(wsMaster);
fs.writeFileSync(csvMasterPath, csvContent);

// Copy to client public directory
const clientPublicDir = path.join(process.cwd(), '..', 'client', 'public');
if (!fs.existsSync(clientPublicDir)) {
  fs.mkdirSync(clientPublicDir, { recursive: true });
}
fs.copyFileSync(sideBySidePath, path.join(clientPublicDir, 'RKS_Plot_Schedule_With_Rates_ImageFormat.xlsx'));
fs.copyFileSync(masterPath, path.join(clientPublicDir, 'RKS_Plot_Schedule_Sequential_1to58.xlsx'));
fs.copyFileSync(csvMasterPath, path.join(clientPublicDir, 'RKS_Plot_Schedule_Sequential_1to58.csv'));

console.log('✅ Generated Updated Excel Files with Pricing:');
console.log('1.', sideBySidePath);
console.log('2.', masterPath);
console.log('3.', csvMasterPath);
