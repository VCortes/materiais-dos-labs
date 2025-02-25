import fs from 'fs/promises';
import path from 'path';

/**
 * Tipo que representa um material agrupado
 * @typedef {Object} MaterialAgrupado
 * @property {string} name - Nome do material
 * @property {number} quantity - Quantidade de laboratórios que usam o material
 * @property {number[]} laboratory_ids - IDs dos laboratórios que usam o material
 */

/**
 * Lê o arquivo materials.json
 * @returns {Promise<Object>} Conteúdo do arquivo
 */
const lerMateriais = async () => {
    try {
        const conteudo = await fs.readFile('materiais.json', 'utf-8');
        return JSON.parse(conteudo);
    } catch (erro) {
        console.error('Erro ao ler materials.json:', erro.message);
        throw erro;
    }
};

/**
 * Agrupa materiais por nome
 * @param {Object} dados - Dados do materials.json
 * @returns {MaterialAgrupado[]} Lista de materiais agrupados
 */
const agruparMateriais = (dados) => {
    const materiaisMap = new Map();

    // Processa cada roteiro
    dados.roteiros.forEach((roteiro) => {
        const laboratorioId = roteiro.laboratorio_id;

        // Processa cada material do roteiro
        roteiro.materials.forEach((material) => {
            if (!materiaisMap.has(material)) {
                materiaisMap.set(material, {
                    name: material,
                    quantity: 0,
                    laboratory_ids: []
                });
            }

            const materialInfo = materiaisMap.get(material);
            if (!materialInfo.laboratory_ids.includes(laboratorioId)) {
                materialInfo.laboratory_ids.push(laboratorioId);
                materialInfo.quantity++;
            }
        });
    });

    // Converte o Map para array e ordena por nome
    return Array.from(materiaisMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Salva os materiais agrupados em grouped_materials.json
 * @param {MaterialAgrupado[]} materiaisAgrupados - Lista de materiais agrupados
 * @returns {Promise<void>}
 */
const salvarMaterialsAgrupados = async (materiaisAgrupados) => {
    const resultado = {
        materials: materiaisAgrupados
    };

    try {
        await fs.writeFile('grouped_materials.json', JSON.stringify(resultado, null, 2));
        console.log('Arquivo grouped_materials.json criado com sucesso!');
    } catch (erro) {
        console.error('Erro ao salvar grouped_materials.json:', erro.message);
        throw erro;
    }
};

/**
 * Função principal que coordena o processo de agrupamento
 * @returns {Promise<void>}
 */
const processarAgrupamento = async () => {
    try {
        console.log('Iniciando processamento...');
        const dados = await lerMateriais();
        const materiaisAgrupados = agruparMateriais(dados);
        await salvarMaterialsAgrupados(materiaisAgrupados);

        // Exibe estatísticas
        console.log(`\nEstatísticas:`);
        console.log(`Total de materiais únicos: ${materiaisAgrupados.length}`);
        console.log(`Total de roteiros processados: ${dados.roteiros.length}`);
    } catch (erro) {
        console.error('Erro no processamento:', erro.message);
        process.exit(1);
    }
};

// Executa o processamento
processarAgrupamento();
