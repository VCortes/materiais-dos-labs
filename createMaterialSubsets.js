import fs from 'fs/promises';
import encontrarSinonimos from './encontrarSinonimos.js';

async function createMaterialSubsets(limit) {
    try {
        // Read the grouped_materials.json file
        const data = await fs.readFile('grouped_materials.json', 'utf8');
        const { materials } = JSON.parse(data);

        // Get all unique name-id pairs
        const uniqueMaterials = [
            ...new Map(
                materials
                    .filter((m) => m.name) // Remove items without names
                    .map((m) => [m.name, { id: m.id, name: m.name }])
            ).values()
        ];

        // Limit the number of unique materials to process
        const limitedMaterials = uniqueMaterials.slice(0, limit);

        // Create subsets for each unique material
        const materialSubsets = {};

        await Promise.all(
            limitedMaterials.map(async (material) => {
                // Remove temporarily the current material from uniqueMaterials
                const materialsWithoutCurrent = uniqueMaterials.filter((m) => m.id !== material.id);

                const subset = await encontrarSinonimos(materialsWithoutCurrent, material);
                materialSubsets[material.id] = subset;
            })
        );

        // Write the results to material_subsets.json
        await fs.writeFile(
            'material_subsets.json',
            JSON.stringify(materialSubsets, null, 2),
            'utf8'
        );

        console.log('Successfully created material_subsets.json');
    } catch (error) {
        console.error('Error processing files:', error);
    }
}

// Run the function with a specified limit
createMaterialSubsets(10); // Change the number to the desired limit
