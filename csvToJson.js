import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tipos de dados imutáveis
/** @typedef {string[]} LinhaCSV - Uma linha do arquivo CSV */
/** @typedef {Object} Experimento - Um experimento do catálogo */
/** @typedef {Experimento[]} Catalogo - Lista completa de experimentos */

/**
 * Função pura para remover aspas de uma string
 * @param {string} str - String com aspas
 * @returns {string} String sem aspas
 */
const removerAspas = (str) => str.replace(/^"|"$/g, '');

/**
 * Função pura para dividir uma linha CSV em array, respeitando campos entre aspas
 * @param {string} linha - Linha do CSV
 * @returns {LinhaCSV} Array com valores da linha
 */
const dividirLinha = (linha) => {
    const regex = /(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^\",]+)/g;
    const valores = [];
    let match;

    while ((match = regex.exec(linha)) !== null) {
        // match[1] contém o valor entre aspas (se houver)
        // match[2] contém o valor sem aspas (se houver)
        let valor = match[1] !== undefined ? match[1] : match[2];
        // Lida com aspas duplas escapadas ("") dentro do campo
        valor = valor ? valor.replace(/""/g, '"').trim() : '';
        valores.push(valor);
    }

    return valores;
};

/**
 * Função pura para converter string para booleano
 * @param {string} str - String 'Sim' ou 'Não'
 * @returns {boolean} Valor booleano
 */
const converterParaBooleano = (str) => str === 'Sim';

/**
 * Função pura para criar objeto de experimento a partir de array
 * @param {LinhaCSV} valores - Array com valores da linha
 * @returns {Experimento} Objeto do experimento
 */
const criarExperimento = ([
    id,
    nome,
    areaConhecimento,
    grupoArea,
    status,
    portugues,
    ingles,
    espanhol,
    web,
    android,
    ios,
    link
]) => ({
    id,
    nome,
    areaConhecimento,
    grupoArea,
    status,
    idiomas: {
        portugues: converterParaBooleano(portugues),
        ingles: converterParaBooleano(ingles),
        espanhol: converterParaBooleano(espanhol)
    },
    plataformas: {
        web: converterParaBooleano(web),
        android: converterParaBooleano(android),
        ios: converterParaBooleano(ios)
    },
    link
});

/**
 * Função pura para processar conteúdo do CSV
 * @param {string} conteudo - Conteúdo do arquivo CSV
 * @returns {Catalogo} Array de objetos de experimento
 */
const processarCSV = (conteudo) => {
    const linhas = conteudo.split('\n');
    const [, ...dadosLinhas] = linhas; // Remove cabeçalho
    return dadosLinhas
        .filter((linha) => linha.trim())
        .map(dividirLinha)
        .map(criarExperimento);
};

/**
 * Função principal para converter CSV em JSON
 * @param {string} arquivoEntrada - Caminho do arquivo CSV
 * @param {string} arquivoSaida - Caminho do arquivo JSON
 * @returns {Promise<void>}
 */
const converterCsvParaJson = async (arquivoEntrada, arquivoSaida) => {
    try {
        const conteudo = await fs.readFile(arquivoEntrada, 'utf-8');
        const catalogo = processarCSV(conteudo);
        await fs.writeFile(arquivoSaida, JSON.stringify(catalogo, null, 2));
        console.log('Arquivo JSON criado com sucesso!');
    } catch (erro) {
        console.error('Erro ao processar arquivo:', erro);
        throw erro;
    }
};

// Executa a conversão
const arquivoEntrada = path.join(__dirname, 'catalogo.csv');
const arquivoSaida = path.join(__dirname, 'catalogo.json');

converterCsvParaJson(arquivoEntrada, arquivoSaida);
