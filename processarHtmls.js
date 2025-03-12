/**
 * processarHtmls.js
 *
 * Script para extrair o conteúdo de texto de arquivos HTML em roteiros_html
 * e salvar em arquivos TXT no diretório roteiros_txt
 *
 * Segue princípios do paradigma funcional:
 * - Funções puras
 * - Imutabilidade
 * - Funções de alta ordem
 * - Composição de funções
 * - Transparência referencial
 */

import { promises as fs } from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

// Criando equivalentes a __dirname e __filename para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Lê o conteúdo de um arquivo
 * @param {string} caminhoArquivo - Caminho completo do arquivo
 * @returns {Promise<string>} - Conteúdo do arquivo
 */
const lerArquivo = async (caminhoArquivo) => {
    try {
        return await fs.readFile(caminhoArquivo, 'utf8');
    } catch (erro) {
        console.error(`Erro ao ler o arquivo ${caminhoArquivo}:`, erro);
        return '';
    }
};

/**
 * Escreve conteúdo em um arquivo
 * @param {string} caminhoArquivo - Caminho completo do arquivo
 * @param {string} conteudo - Conteúdo a ser escrito
 * @returns {Promise<boolean>} - Resultado da operação
 */
const escreverArquivo = async (caminhoArquivo, conteudo) => {
    try {
        // Garante que o diretório exista
        const diretorio = path.dirname(caminhoArquivo);
        await fs.mkdir(diretorio, { recursive: true });

        await fs.writeFile(caminhoArquivo, conteudo, 'utf8');
        return true;
    } catch (erro) {
        console.error(`Erro ao escrever no arquivo ${caminhoArquivo}:`, erro);
        return false;
    }
};

/**
 * Extrai o conteúdo de texto de um HTML
 * @param {string} conteudoHtml - Conteúdo HTML
 * @returns {string} - Texto extraído do HTML
 */
const extrairTextoDeHtml = (conteudoHtml) => {
    if (!conteudoHtml) return '';

    const $ = cheerio.load(conteudoHtml);

    // Remove scripts e estilos
    $('script, style').remove();

    // Extrai o texto do body mantendo a estrutura básica
    return $('body').text().replace(/\s+/g, ' ').trim();
};

/**
 * Obtém o ID do arquivo a partir do nome
 * @param {string} nomeArquivo - Nome do arquivo HTML
 * @returns {string} - ID extraído do nome do arquivo
 */
const extrairIdDoArquivo = (nomeArquivo) => {
    // Remove os zeros à esquerda e a extensão .html
    return nomeArquivo.replace(/^0+/, '').replace('.html', '');
};

/**
 * Processa um arquivo HTML e salva como TXT
 * @param {string} diretorioOrigem - Diretório dos arquivos HTML
 * @param {string} diretorioDestino - Diretório para os arquivos TXT
 * @param {string} nomeArquivo - Nome do arquivo HTML
 * @returns {Promise<void>}
 */
const processarArquivo = async (diretorioOrigem, diretorioDestino, nomeArquivo) => {
    const caminhoOrigem = path.join(diretorioOrigem, nomeArquivo);
    const id = extrairIdDoArquivo(nomeArquivo);
    const nomeArquivoDestino = `${id}_roteiro.txt`;
    const caminhoDestino = path.join(diretorioDestino, nomeArquivoDestino);

    const conteudoHtml = await lerArquivo(caminhoOrigem);
    const conteudoTexto = extrairTextoDeHtml(conteudoHtml);

    const resultado = await escreverArquivo(caminhoDestino, conteudoTexto);

    if (resultado) {
        console.log(`Arquivo processado com sucesso: ${nomeArquivo} -> ${nomeArquivoDestino}`);
    } else {
        console.error(`Falha ao processar o arquivo: ${nomeArquivo}`);
    }
};

/**
 * Lista todos os arquivos em um diretório
 * @param {string} diretorio - Caminho do diretório
 * @returns {Promise<string[]>} - Lista de nomes de arquivos
 */
const listarArquivos = async (diretorio) => {
    try {
        const arquivos = await fs.readdir(diretorio);
        return arquivos.filter((arquivo) => arquivo.endsWith('.html'));
    } catch (erro) {
        console.error(`Erro ao listar arquivos do diretório ${diretorio}:`, erro);
        return [];
    }
};

/**
 * Função principal que orquestra todo o processamento
 * @returns {Promise<void>}
 */
const processarTodosArquivos = async () => {
    const diretorioOrigem = path.join(__dirname, 'roteiros_html');
    const diretorioDestino = path.join(__dirname, 'roteiros_txt');

    // Garante que o diretório de destino exista
    await fs
        .mkdir(diretorioDestino, { recursive: true })
        .catch((erro) => console.error('Erro ao criar diretório de destino:', erro));

    const arquivos = await listarArquivos(diretorioOrigem);

    // Processa todos os arquivos de forma sequencial usando reduce
    await arquivos.reduce(async (promiseAnterior, arquivo) => {
        // Aguarda a promise anterior antes de prosseguir
        await promiseAnterior;
        // Processa o arquivo atual
        return processarArquivo(diretorioOrigem, diretorioDestino, arquivo);
    }, Promise.resolve());

    console.log(`Processamento concluído. Total de arquivos processados: ${arquivos.length}`);
};

// Executa o processamento
processarTodosArquivos().catch((erro) => console.error('Erro durante o processamento:', erro));
