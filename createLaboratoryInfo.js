import fs from 'fs/promises';

async function createLaboratoryInfo() {
    try {
        // Read the files
        const groupedMaterialsData = await fs.readFile('grouped_materials.json', 'utf8');
        const catalogData = await fs.readFile('catalogo.json', 'utf8');

        const groupedMaterials = JSON.parse(groupedMaterialsData);
        const catalog = JSON.parse(catalogData);

        // Get all unique laboratory IDs
        const laboratoryIds = new Set();
        groupedMaterials.materials.forEach((material) => {
            if (material.laboratory_ids) {
                material.laboratory_ids.forEach((id) => laboratoryIds.add(id));
            }
        });

        // Create laboratory info objects
        const laboratoryInfo = Array.from(laboratoryIds).map((id) => {
            // Find matching catalog entry
            const catalogEntry = catalog.find((entry) => entry.id === String(id));

            return {
                laboratory_id: id,
                nome: catalogEntry?.nome || '',
                areaConhecimento: catalogEntry?.areaConhecimento || '',
                grupoArea: catalogEntry?.grupoArea || ''
            };
        });

        // Write the results to laboratoryInfo.json
        await fs.writeFile('laboratoryInfo.json', JSON.stringify(laboratoryInfo, null, 2), 'utf8');

        console.log('Successfully created laboratoryInfo.json');
    } catch (error) {
        console.error('Error processing files:', error);
    }
}

// Run the function
createLaboratoryInfo();
