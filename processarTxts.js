import fs from 'fs/promises';
import path from 'path';
import extractMaterials from './extrairMateriais.js';

/**
 * Tipo que representa a estrutura do JSON de saída
 * @typedef {Object} ResultadoRoteiros
 * @property {Array<{ laboratorio_id: number, materials: string[] }>} roteiros - Array de roteiros processados
 */

/**
 * Tipo que representa informações de um arquivo
 * @typedef {Object} ArquivoInfo
 * @property {string} caminho - Caminho completo do arquivo
 * @property {number} laboratorioId - ID do laboratório extraído do nome do arquivo
 */

/**
 * Extrai o ID do laboratório do nome do arquivo de forma pura
 * @param {string} nomeArquivo - Nome do arquivo
 * @returns {number} ID do laboratório
 */
const extrairLaboratorioId = (nomeArquivo) =>
    parseInt(path.basename(nomeArquivo, '.txt').split('_')[0]);

/**
 * Cria objeto de informações do arquivo de forma imutável
 * @param {string} caminho - Caminho do arquivo
 * @returns {ArquivoInfo} Objeto imutável com informações do arquivo
 */
const criarArquivoInfo = (caminho) =>
    Object.freeze({
        caminho,
        laboratorioId: extrairLaboratorioId(caminho)
    });

/**
 * Lê o conteúdo de um arquivo de forma pura
 * @param {ArquivoInfo} arquivoInfo - Informações do arquivo
 * @returns {Promise<string>} Conteúdo do arquivo
 */
const lerArquivo = async (arquivoInfo) => await fs.readFile(arquivoInfo.caminho, 'utf-8');

/**
 * Processa um único roteiro de forma pura
 * @param {ArquivoInfo} arquivoInfo - Informações do arquivo
 * @returns {Promise<{ laboratorio_id: number, materials: string[] }>} Resultado do processamento
 */
const processarRoteiro = async (arquivoInfo) => {
    const conteudo = await lerArquivo(arquivoInfo);
    return await extractMaterials(arquivoInfo.laboratorioId, conteudo);
};

/**
 * Lista arquivos em um diretório recursivamente de forma pura
 * @param {string} diretorio - Caminho do diretório
 * @returns {Promise<string[]>} Lista de caminhos dos arquivos
 */
const listarArquivos = async (diretorio) => {
    const itens = await fs.readdir(diretorio);
    const caminhos = await Promise.all(
        itens.map(async (item) => {
            const caminhoCompleto = path.join(diretorio, item);
            const stat = await fs.stat(caminhoCompleto);

            if (stat.isDirectory()) {
                return await listarArquivos(caminhoCompleto);
            }
            return caminhoCompleto;
        })
    );

    return caminhos.flat();
};

/**
 * Filtra apenas arquivos .txt de forma pura
 * @param {string[]} caminhos - Lista de caminhos de arquivos
 * @returns {string[]} Lista filtrada
 */
const filtrarArquivosTxt = (caminhos) =>
    caminhos.filter((caminho) => path.extname(caminho) === '.txt');

/**
 * Salva o resultado em um arquivo JSON de forma pura
 * @param {ResultadoRoteiros} resultado - Resultado a ser salvo
 * @param {string} caminhoSaida - Caminho do arquivo de saída
 * @returns {Promise<void>}
 */
const salvarResultado = async (resultado, caminhoSaida) =>
    await fs.writeFile(caminhoSaida, JSON.stringify(resultado, null, 2));

/**
 * Lê o conteúdo existente do arquivo JSON de forma pura
 * @param {string} caminhoArquivo - Caminho do arquivo JSON
 * @returns {Promise<ResultadoRoteiros>} Conteúdo do arquivo ou objeto vazio
 */
const lerConteudoExistente = async (caminhoArquivo) => {
    try {
        const conteudo = await fs.readFile(caminhoArquivo, 'utf-8');
        return JSON.parse(conteudo);
    } catch (erro) {
        return { roteiros: [] };
    }
};

/**
 * Combina resultados existentes com novos de forma pura
 * @param {ResultadoRoteiros} existente - Resultados existentes
 * @param {Array<{ laboratorio_id: number, materials: string[] }>} novos - Novos resultados
 * @returns {ResultadoRoteiros} Resultados combinados
 */
const combinarResultados = (existente, novos) => {
    const roteirosMap = new Map(
        existente.roteiros.map((roteiro) => [roteiro.laboratorio_id, roteiro])
    );

    // Atualiza ou adiciona novos roteiros
    novos.forEach((novoRoteiro) => {
        roteirosMap.set(novoRoteiro.laboratorio_id, novoRoteiro);
    });

    // Converte o Map de volta para array e ordena por laboratorio_id
    const roteirosCombinados = Array.from(roteirosMap.values()).sort(
        (a, b) => a.laboratorio_id - b.laboratorio_id
    );

    return Object.freeze({
        roteiros: roteirosCombinados
    });
};

/**
 * Remove um arquivo de forma pura
 * @param {string} caminho - Caminho do arquivo a ser removido
 * @returns {Promise<void>}
 */
const removerArquivo = async (caminho) => {
    try {
        await fs.unlink(caminho);
        console.log(`Arquivo removido: ${path.basename(caminho)}`);
    } catch (erro) {
        console.error(`Erro ao remover arquivo ${path.basename(caminho)}:`, erro.message);
    }
};

/**
 * Função principal que coordena o processamento dos roteiros
 * @param {string} diretorioEntrada - Diretório com os arquivos TXT
 * @param {string} arquivoSaida - Caminho do arquivo JSON de saída
 * @returns {Promise<void>}
 */
const processarRoteiros = async (diretorioEntrada, arquivoSaida) => {
    try {
        // Pipeline de processamento
        const todosArquivos = await listarArquivos(diretorioEntrada);
        const arquivosTxt = filtrarArquivosTxt(todosArquivos);
        const infosArquivos = arquivosTxt.map(criarArquivoInfo);

        // Processamento paralelo dos roteiros
        const novosResultados = await Promise.all(infosArquivos.map(processarRoteiro));

        // Lê o conteúdo existente e combina com os novos resultados
        const resultadosExistentes = await lerConteudoExistente(arquivoSaida);
        const resultadoCombinado = combinarResultados(resultadosExistentes, novosResultados);

        // Salva os resultados
        await salvarResultado(resultadoCombinado, arquivoSaida);

        // Remove os arquivos txt processados
        await Promise.all(arquivosTxt.map(removerArquivo));

        console.log(`Processamento concluído. Resultado salvo em ${arquivoSaida}`);
        console.log(`Total de roteiros processados: ${resultadoCombinado.roteiros.length}`);
    } catch (erro) {
        console.error('Erro no processamento:', erro.message);
        throw erro;
    }
};

// Caminhos dos diretórios e arquivo de saída
const diretorioBase = process.cwd();
const diretorioRoteiros = path.join(diretorioBase, 'roteiros_txt');
const arquivoSaida = path.join(diretorioBase, 'materiais.json');

// Executa o processamento
processarRoteiros(diretorioRoteiros, arquivoSaida);
