import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../data/treasures.json');
const outputDir = path.join(__dirname, '../public/qrs');

async function generateQRs() {
  try {
    // 1. Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 2. Read JSON data
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const treasures = JSON.parse(rawData);

    console.log(`Starting QR generation for ${treasures.length} treasures...`);

    // 3. Generate QR for each treasure
    for (const treasure of treasures) {
      const fileName = `${treasure.name.split(' (')[0]}.png`; // Use simple name for file
      const filePath = path.join(outputDir, fileName);
      
      await QRCode.toFile(filePath, treasure.uuid, {
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        width: 1024,
        margin: 2
      });
      
      console.log(`Generated: ${fileName} -> ${filePath}`);
    }

    console.log('All QR codes generated successfully!');
  } catch (error) {
    console.error('Error generating QR codes:', error);
  }
}

generateQRs();
