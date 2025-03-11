/**
 * Script para extrair todos os IDs dos nomes de arquivos na pasta roteiros_pdf seguindo o paradigma funcional
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

// Promisificar as funções de leitura de diretório para trabalhar com promises
const lerDiretorio = promisify(fs.readdir);

/**
 * Função pura que extrai o ID de um nome de arquivo
 * @param {string} nomeArquivo - Nome do arquivo
 * @returns {string|null} ID extraído ou null se não for possível extrair
 */
const extrairIdDoNomeArquivo = (nomeArquivo) => {
    // Usando expressão regular para capturar os números antes de "_roteiro.pdf"
    const correspondencia = nomeArquivo.match(/^(\d+)_roteiro\.pdf$/);
    return correspondencia ? correspondencia[1] : null;
};

/**
 * Função pura que filtra apenas arquivos com extensão .pdf
 * @param {string} nomeArquivo - Nome do arquivo
 * @returns {boolean} Verdadeiro se for um arquivo PDF, falso caso contrário
 */
const ehArquivoPdf = (nomeArquivo) => nomeArquivo.toLowerCase().endsWith('.pdf');

/**
 * Função recursiva pura que processa os nomes dos arquivos e extrai os IDs
 * @param {string[]} nomesArquivos - Array de nomes de arquivos
 * @param {number} indice - Índice atual sendo processado
 * @param {string[]} idsAcumulados - Array de IDs acumulados até o momento
 * @returns {string[]} Array final com todos os IDs válidos
 */
const processarArquivosRecursivamente = (nomesArquivos, indice, idsAcumulados) => {
    // Caso base: fim do array
    if (indice >= nomesArquivos.length) {
        return idsAcumulados;
    }

    const nomeArquivoAtual = nomesArquivos[indice];

    // Pular arquivos que não são PDFs
    if (!ehArquivoPdf(nomeArquivoAtual)) {
        return processarArquivosRecursivamente(nomesArquivos, indice + 1, idsAcumulados);
    }

    const idExtraido = extrairIdDoNomeArquivo(nomeArquivoAtual);

    // Adicionar o ID ao acumulador somente se for válido
    const novosIds = idExtraido ? [...idsAcumulados, idExtraido] : idsAcumulados;

    // Chamada recursiva para o próximo arquivo
    return processarArquivosRecursivamente(nomesArquivos, indice + 1, novosIds);
};

/**
 * Função composta que processa um diretório de PDFs e extrai os IDs
 * @param {string[]} arquivos - Lista de arquivos no diretório
 * @returns {string[]} Array com todos os IDs válidos
 */
const extrairIdsDosArquivos = (arquivos) => processarArquivosRecursivamente(arquivos, 0, []);

/**
 * Função que ordena IDs numericamente
 * @param {string[]} ids - Array de IDs em formato string
 * @returns {string[]} Array de IDs ordenados numericamente
 */
const ordenarIdsNumericamente = (ids) => [...ids].sort((a, b) => Number(a) - Number(b));

/**
 * Função principal que executa o processo de extração dos IDs de PDFs
 * @returns {Promise<string[]>} Promise que resolve para um array com os IDs
 */
const extrairIdsPdfs = async () => {
    try {
        // Caminho para a pasta de PDFs
        const pastaPdfs = path.resolve('roteiros_pdf');

        // Ler o conteúdo da pasta
        const arquivos = await lerDiretorio(pastaPdfs);

        // Extrair os IDs usando composição de funções puras
        const ids = extrairIdsDosArquivos(arquivos);

        // Ordenar IDs numericamente para melhor visualização
        const idsOrdenados = ordenarIdsNumericamente(ids);

        // Exibir o resultado
        console.log('IDs extraídos dos PDFs:');
        console.log(idsOrdenados);

        // Informações estatísticas (de forma funcional)
        console.log(`Total de IDs encontrados: ${idsOrdenados.length}`);

        return idsOrdenados;
    } catch (erro) {
        console.error('Erro ao processar a pasta de PDFs:', erro.message);
        return [];
    }
};

// Executar a função principal
const idsPdfs = await extrairIdsPdfs().catch(console.error);

// Exportar a função principal e os IDs para uso em outros módulos
export { extrairIdsPdfs, idsPdfs as default };
