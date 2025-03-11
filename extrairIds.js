/**
 * Script para extrair todos os IDs do arquivo catalogo.csv seguindo o paradigma funcional
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
 * Função pura que converte o conteúdo de um arquivo CSV em linhas
 * @param {string} conteudo - Conteúdo do arquivo CSV
 * @returns {string[]} Array de linhas do arquivo
 */
const converterParaLinhas = (conteudo) => conteudo.split('\n');

/**
 * Função pura que verifica se uma linha é cabeçalho
 * @param {string} linha - Linha a ser verificada
 * @returns {boolean} Verdadeiro se for cabeçalho, falso caso contrário
 */
const ehCabecalho = (linha) => linha.startsWith('ID,') || linha.trim() === '';

/**
 * Função pura que extrai o ID de uma linha CSV
 * @param {string} linha - Linha do arquivo CSV
 * @returns {string|null} ID extraído ou null se não for possível extrair
 */
const extrairId = (linha) => {
    const colunas = linha.split(',');
    return colunas.length > 0 ? colunas[0].trim() : null;
};

/**
 * Função recursiva pura que processa as linhas do arquivo e extrai os IDs
 * @param {string[]} linhas - Array de linhas do arquivo
 * @param {number} indice - Índice atual sendo processado
 * @param {string[]} idsAcumulados - Array de IDs acumulados até o momento
 * @returns {string[]} Array final com todos os IDs válidos
 */
const processarLinhasRecursivamente = (linhas, indice, idsAcumulados) => {
    // Caso base: fim do array
    if (indice >= linhas.length) {
        return idsAcumulados;
    }

    const linhaAtual = linhas[indice];

    // Pular linhas de cabeçalho ou vazias
    if (ehCabecalho(linhaAtual) || linhaAtual.trim() === '') {
        return processarLinhasRecursivamente(linhas, indice + 1, idsAcumulados);
    }

    const idExtraido = extrairId(linhaAtual);

    // Adicionar o ID ao acumulador somente se for válido e numérico
    const novosIds =
        idExtraido && !isNaN(Number(idExtraido)) ? [...idsAcumulados, idExtraido] : idsAcumulados;

    // Chamada recursiva para a próxima linha
    return processarLinhasRecursivamente(linhas, indice + 1, novosIds);
};

/**
 * Função composta que processa um arquivo CSV e extrai os IDs
 * @param {string} conteudo - Conteúdo do arquivo CSV
 * @returns {string[]} Array com todos os IDs válidos
 */
const extrairIdsDoCsv = (conteudo) => {
    const linhas = converterParaLinhas(conteudo);
    return processarLinhasRecursivamente(linhas, 0, []);
};

/**
 * Função principal que executa o processo de extração dos IDs
 * @returns {Promise<string[]>} Promise que resolve para um array com os IDs
 */
const extrairIdsDoCatalogo = async () => {
    try {
        // Caminho absoluto para o arquivo CSV
        const caminhoArquivo = path.resolve('catalogo.csv');

        // Ler o arquivo como string usando promise
        const conteudo = await lerArquivo(caminhoArquivo, 'utf8');

        // Extrair os IDs usando nossa função pura
        const ids = extrairIdsDoCsv(conteudo);

        // Exibir o resultado
        console.log('IDs extraídos do catálogo:');
        console.log(ids);

        // Informações estatísticas (de forma funcional)
        console.log(`Total de IDs encontrados: ${ids.length}`);

        return ids;
    } catch (erro) {
        console.error('Erro ao processar o arquivo:', erro.message);
        return [];
    }
};

// Executar a função principal
extrairIdsDoCatalogo().catch(console.error);

// Exportar a função principal para uso em outros módulos
export default extrairIdsDoCatalogo;
