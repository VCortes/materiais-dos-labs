/**
 * Script para extrair todos os IDs do arquivo catalogo.json seguindo o paradigma funcional
 *
 * Este código segue rigorosamente os princípios do paradigma funcional:
 * - Funções puras sem efeitos colaterais
 * - Imutabilidade de dados
 * - Utilização de funções de alta ordem
 * - Composição de funções
 * - Transparência referencial
 * - Preferência por recursão em vez de loops imperativos
 */

import fs from 'fs';
import { promisify } from 'util';
import path from 'path';

// Promisificar a função de leitura de arquivos para trabalhar com promises
const lerArquivo = promisify(fs.readFile);

/**
 * Função pura que filtra entradas válidas (não vazias e com ID numérico)
 * @param {Object} entrada - Entrada do catálogo
 * @returns {boolean} Verdadeira se a entrada for válida
 */
const entradaValida = (entrada) => {
    return entrada && entrada.id && !isNaN(Number(entrada.id));
};

/**
 * Função pura que extrai o ID de uma entrada JSON
 * @param {Object} entrada - Entrada do catálogo
 * @returns {string|null} ID extraído ou null se não for possível extrair
 */
const extrairId = (entrada) => {
    return entradaValida(entrada) ? entrada.id : null;
};

/**
 * Função recursiva pura que processa as entradas do catálogo e extrai os IDs
 * @param {Array} entradas - Array de entradas do catálogo
 * @param {number} indice - Índice atual sendo processado
 * @param {string[]} idsAcumulados - Array de IDs acumulados até o momento
 * @param {Object} diagnostico - Objeto para diagnóstico de problemas
 * @returns {Object} Objeto contendo os IDs válidos e informações de diagnóstico
 */
const processarEntradasRecursivamente = (entradas, indice, idsAcumulados, diagnostico) => {
    // Caso base: fim do array
    if (indice >= entradas.length) {
        return { ids: idsAcumulados, diagnostico };
    }

    const entradaAtual = entradas[indice];
    const idExtraido = extrairId(entradaAtual);

    // Verificar entrada inválida
    if (!idExtraido) {
        diagnostico.entradasInvalidas.push({
            indice,
            entrada: entradaAtual
        });
    }
    // Verificar ID duplicado
    else if (idsAcumulados.includes(idExtraido)) {
        diagnostico.idsDuplicados.push({
            id: idExtraido,
            indice,
            entrada: entradaAtual
        });
    }

    // Adicionar o ID ao acumulador somente se for válido e não duplicado
    const novosIds =
        idExtraido && !idsAcumulados.includes(idExtraido)
            ? [...idsAcumulados, idExtraido]
            : idsAcumulados;

    // Chamada recursiva para a próxima entrada
    return processarEntradasRecursivamente(entradas, indice + 1, novosIds, diagnostico);
};

/**
 * Função composta que processa um arquivo JSON e extrai os IDs
 * @param {Array} entradas - Array de entradas do catálogo JSON
 * @returns {Object} Objeto contendo os IDs válidos e informações de diagnóstico
 */
const extrairIdsDoJson = (entradas) => {
    const diagnostico = {
        totalEntradas: entradas.length,
        entradasInvalidas: [],
        idsDuplicados: []
    };

    return processarEntradasRecursivamente(entradas, 0, [], diagnostico);
};

/**
 * Função principal que executa o processo de extração dos IDs
 * @returns {Promise<Object>} Promise que resolve para um objeto com os IDs e diagnósticos
 */
const extrairIdsDoCatalogo = async () => {
    try {
        // Caminho absoluto para o arquivo JSON
        const caminhoArquivo = path.resolve('catalogo.json');

        // Ler o arquivo como string usando promise
        const conteudo = await lerArquivo(caminhoArquivo, 'utf8');

        // Converter string JSON para objeto JavaScript
        const catalogoJson = JSON.parse(conteudo);

        // Extrair os IDs usando nossa função pura
        const resultado = extrairIdsDoJson(catalogoJson);
        const { ids, diagnostico } = resultado;

        // Exibir o resultado
        console.log('IDs extraídos do catálogo:');
        console.log(ids);

        // Informações estatísticas (de forma funcional)
        console.log(`\n========= Estatísticas =========`);
        console.log(`Total de entradas no catálogo: ${diagnostico.totalEntradas}`);
        console.log(`Total de IDs únicos válidos: ${ids.length}`);

        // Relatório de problemas
        console.log(`\n========= Diagnóstico =========`);
        console.log(`Entradas sem ID válido: ${diagnostico.entradasInvalidas.length}`);
        if (diagnostico.entradasInvalidas.length > 0) {
            console.log('Exemplo de entradas inválidas:');
            diagnostico.entradasInvalidas.slice(0, 3).forEach((item) => {
                console.log(
                    `  Índice ${item.indice}:`,
                    JSON.stringify(item.entrada).substring(0, 100) +
                        (JSON.stringify(item.entrada).length > 100 ? '...' : '')
                );
            });
        }

        console.log(`IDs duplicados encontrados: ${diagnostico.idsDuplicados.length}`);
        if (diagnostico.idsDuplicados.length > 0) {
            console.log('Duplicatas encontradas:');
            diagnostico.idsDuplicados.forEach((item) => {
                console.log(`  ID "${item.id}" duplicado no índice ${item.indice}`);
            });
        }

        console.log(`\nDiscrepância total: ${diagnostico.totalEntradas - ids.length} entradas`);
        console.log(
            `(${diagnostico.entradasInvalidas.length} inválidas + ${diagnostico.idsDuplicados.length} duplicadas)`
        );

        return { ids, diagnostico };
    } catch (erro) {
        console.error('Erro ao processar o arquivo:', erro.message);
        return {
            ids: [],
            diagnostico: { totalEntradas: 0, entradasInvalidas: [], idsDuplicados: [] }
        };
    }
};

// Executar a função principal
extrairIdsDoCatalogo().catch(console.error);

// Exportar a função principal para uso em outros módulos
export default extrairIdsDoCatalogo;
