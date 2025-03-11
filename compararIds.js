/**
 * Script para identificar IDs que existem no catalogo.csv mas não estão presentes nos PDFs
 * usando o paradigma funcional
 *
 * Este código segue rigorosamente os princípios do paradigma funcional:
 * - Funções puras sem efeitos colaterais
 * - Imutabilidade de dados
 * - Utilização de funções de alta ordem
 * - Composição de funções
 * - Transparência referencial
 * - Preferência por recursão em vez de loops imperativos
 */

import extrairIdsDoCatalogo from './extrairIds.js';
import { extrairIdsPdfs } from './extrairIdsPdfs.js';

/**
 * Função pura que encontra IDs que estão em um array mas não em outro
 * @param {string[]} idsBase - Array de IDs base para comparação
 * @param {string[]} idsComparacao - Array de IDs para verificar presença
 * @returns {string[]} Array com IDs que estão em idsBase mas não em idsComparacao
 */
const encontrarIdsFaltantes = (idsBase, idsComparacao) =>
    idsBase.filter((id) => !idsComparacao.includes(id));

/**
 * Função que organiza IDs faltantes para exibição
 * @param {string[]} idsFaltantes - Array de IDs faltantes
 * @returns {Object} Objeto com informações sobre os IDs faltantes
 */
const organizarResultados = (idsFaltantes) => ({
    total: idsFaltantes.length,
    idsFaltantes: idsFaltantes.sort((a, b) => Number(a) - Number(b))
});

/**
 * Função que gera um relatório legível sobre os IDs faltantes
 * @param {Object} resultados - Objeto com informações organizadas sobre IDs faltantes
 * @returns {string} Texto formatado do relatório
 */
const gerarRelatorio = (resultados) => {
    const { total, idsFaltantes } = resultados;

    return `
=======================================================
  RELATÓRIO DE IDS FALTANTES EM PDFS
=======================================================
  
Total de IDs no catálogo sem PDF correspondente: ${total}

Lista de IDs faltantes: 
${idsFaltantes.join(', ')}

=======================================================
`;
};

/**
 * Função principal que compara os IDs do catálogo e dos PDFs
 * @returns {Promise<Object>} Promise que resolve para um objeto com os resultados da comparação
 */
const compararIdsCatalogoPdfs = async () => {
    try {
        // Extrair IDs do catálogo
        console.log('Extraindo IDs do catálogo...');
        const idsCatalogo = await extrairIdsDoCatalogo();

        // Extrair IDs dos PDFs
        console.log('\nExtraindo IDs dos PDFs...');
        const idsPdfs = await extrairIdsPdfs();

        console.log('\nComparando IDs...');

        // Encontrar IDs que existem no catálogo mas não possuem PDFs correspondentes
        const idsFaltantes = encontrarIdsFaltantes(idsCatalogo, idsPdfs);

        // Organizar os resultados
        const resultados = organizarResultados(idsFaltantes);

        // Gerar e exibir o relatório
        const relatorio = gerarRelatorio(resultados);
        console.log(relatorio);

        return {
            idsCatalogo,
            idsPdfs,
            idsFaltantes: resultados.idsFaltantes,
            totalFaltantes: resultados.total
        };
    } catch (erro) {
        console.error('Erro ao comparar IDs:', erro.message);
        return {
            idsCatalogo: [],
            idsPdfs: [],
            idsFaltantes: [],
            totalFaltantes: 0,
            erro: erro.message
        };
    }
};

// Executar a função principal
const resultadosComparacao = await compararIdsCatalogoPdfs().catch(console.error);

// Salvar resultados em um arquivo JSON para uso posterior (usando funções puras)
const salvarResultadosEmArquivo = async (resultados) => {
    try {
        // Função pura para criar o conteúdo do arquivo
        const criarConteudoJson = (dados) => JSON.stringify(dados, null, 2);

        // Gravar o arquivo através de uma operação impura (efeito colateral)
        await fs.promises.writeFile(
            'relatorio_ids_faltantes.json',
            criarConteudoJson(resultados),
            'utf8'
        );

        console.log('\nResultados também salvos em relatorio_ids_faltantes.json');
    } catch (erro) {
        console.error('Erro ao salvar resultados:', erro.message);
    }
};

// Salvar os resultados (esta é uma operação impura, isolada no final do script)
await salvarResultadosEmArquivo(resultadosComparacao);

// Exportar a função principal e os resultados para uso em outros módulos
export { compararIdsCatalogoPdfs, resultadosComparacao as default };
