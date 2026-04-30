import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.resolve(__dirname, '../src/assets');
const MAX_SIZE_KB = 300; // Seuil d'optimisation

async function processDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            await processDirectory(fullPath);
        } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
            const stats = await fs.stat(fullPath);
            const sizeKB = stats.size / 1024;

            if (sizeKB > MAX_SIZE_KB) {
                // 1. G\u00e9n\u00e9rer le WebP optimis\u00e9 (Principal)
                const webpPath = fullPath.replace(/\.(png|jpe?g)$/i, '.webp');
                const miniPath = fullPath.replace(/\.(png|jpe?g)$/i, '.thumb.webp');
                
                await sharp(fullPath)
                    .webp({ quality: 80, effort: 6 })
                    .toFile(webpPath);
                
                // 2. G\u00e9n\u00e9rer la version microscopic (LQIP) - 20px
                await sharp(fullPath)
                    .resize(20)
                    .webp({ quality: 20 })
                    .toFile(miniPath);

                // 3. Compresser l'original SANS changer l'extension (pour ne pas casser les imports)
                const tmpPath = fullPath + '.tmp';
                if (/\.png$/i.test(entry.name)) {
                   await sharp(fullPath).png({ quality: 60, compressionLevel: 9, palette: true }).toFile(tmpPath);
                } else {
                   await sharp(fullPath).jpeg({ quality: 75 }).toFile(tmpPath);
                }
                await fs.rename(tmpPath, fullPath);

                console.log(`   \u2705 Original compressed: ${fullPath}`);
                console.log(`   \u2705 Generated: ${webpPath}`);
                console.log(`   \u2705 Generated LQIP: ${miniPath}`);
            }
        }
    }
}

console.log(`\ud83d\ude80 Starting Image Optimization in ${ASSETS_DIR}...`);
processDirectory(ASSETS_DIR)
    .then(() => console.log('\n\u2728 All heavy images processed!'))
    .catch(err => console.error('\n\u274c Error during optimization:', err));
