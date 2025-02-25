import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addMaterialIds() {
    try {
        // Read the grouped_materials.json file
        const data = await fs.readFile('grouped_materials.json', 'utf8');
        const materials = JSON.parse(data);

        // Add sequential IDs to each material
        materials.materials = materials.materials.map((material, index) => ({
            id: index + 1,
            ...material
        }));

        // Write the updated data back to the file
        await fs.writeFile('grouped_materials.json', JSON.stringify(materials, null, 2), 'utf8');

        console.log('Successfully added IDs to materials');
    } catch (error) {
        console.error('Error processing file:', error);
    }
}

// Run the function
addMaterialIds();
