const fs = require('fs-extra');
const path = require('path');
const pdfParse = require('pdf-parse');
const cliProgress = require('cli-progress');

/**
 * Tipo que representa informações de um arquivo
 * @typedef {Object} ArquivoInfo
 * @property {string} caminhoOrigem - Caminho do arquivo PDF
 * @property {string} caminhoDestino - Caminho do arquivo TXT
 */

/**
 * Cria o diretório de destino de forma pura
 * @param {string} caminho - Caminho do diretório
 * @returns {Promise<string>} Caminho do diretório criado
 */
const garantirDiretorio = async (caminho) => {
    await fs.ensureDir(caminho);
    return caminho;
};

/**
 * Encontra todos os arquivos PDF de forma síncrona
 * @param {string} diretorio - Diretório onde procurar
 * @returns {string[]} Lista de caminhos dos PDFs
 */
function encontrarPdfsSync(diretorio) {
    const arquivos = [];

    function explorarDiretorio(dir) {
        const itens = fs.readdirSync(dir);
        for (const item of itens) {
            const caminhoCompleto = path.join(dir, item);
            const stats = fs.statSync(caminhoCompleto);

            if (stats.isDirectory()) {
                explorarDiretorio(caminhoCompleto);
            } else if (path.extname(caminhoCompleto).toLowerCase() === '.pdf') {
                arquivos.push(caminhoCompleto);
            }
        }
    }

    explorarDiretorio(diretorio);
    return arquivos;
}

/**
 * Transforma caminho de PDF para TXT de forma pura
 * @param {string} caminhoPdf - Caminho do arquivo PDF
 * @param {string} dirDestino - Diretório de destino
 * @returns {string} Caminho do arquivo TXT
 */
const gerarCaminhoTxt = (caminhoPdf, dirDestino) => {
    const nomePdf = path.basename(caminhoPdf);
    const nomeTxt = nomePdf.replace('.pdf', '.txt');
    return path.join(dirDestino, nomeTxt);
};

/**
 * Extrai o texto de um PDF de forma pura
 * @param {Buffer} buffer - Buffer do arquivo PDF
 * @returns {Promise<string>} Texto extraído
 */
const extrairTextoPdf = async (buffer) => {
    const options = {
        // Desabilita warnings de TrueType fonts
        suppressWarnings: true
    };

    try {
        const data = await pdfParse(buffer, options);
        // Garante que retornamos uma string do texto extraído
        return data.text || '';
    } catch (erro) {
        console.error('Erro na extração do texto:', erro.message);
        throw erro;
    }
};

/**
 * Processa um único arquivo PDF de forma pura
 * @param {ArquivoInfo} arquivoInfo - Informações do arquivo
 * @returns {Promise<string>} Mensagem de resultado
 */
const processarArquivoUnico = async (arquivoInfo) => {
    try {
        const conteudoPdf = await fs.readFile(arquivoInfo.caminhoOrigem);
        const texto = await extrairTextoPdf(conteudoPdf);
        await fs.writeFile(arquivoInfo.caminhoDestino, texto);
        return `Sucesso ao processar ${path.basename(arquivoInfo.caminhoOrigem)}`;
    } catch (erro) {
        return `Falha ao processar ${path.basename(arquivoInfo.caminhoOrigem)}: ${erro.message}`;
    }
};

/**
 * Cria informações de arquivos de forma pura
 * @param {string[]} caminhosPdf - Lista de caminhos dos PDFs
 * @param {string} dirDestino - Diretório de destino
 * @returns {ArquivoInfo[]} Lista de informações dos arquivos
 */
const criarInfosArquivos = (caminhosPdf, dirDestino) =>
    caminhosPdf.map((caminhoPdf) => ({
        caminhoOrigem: caminhoPdf,
        caminhoDestino: gerarCaminhoTxt(caminhoPdf, dirDestino)
    }));

/**
 * Divide array em chunks de forma pura
 * @param {Array} array - Array a ser dividido
 * @param {number} tamanhoChunk - Tamanho de cada chunk
 * @returns {Array[]} Array de chunks
 */
const dividirEmChunks = (array, tamanhoChunk) =>
    Array.from({ length: Math.ceil(array.length / tamanhoChunk) }, (_, i) =>
        array.slice(i * tamanhoChunk, (i + 1) * tamanhoChunk)
    );

/**
 * Cria uma barra de progresso personalizada
 * @param {number} total - Total de arquivos
 * @returns {cliProgress.SingleBar} Barra de progresso
 */
const criarBarraProgresso = (total) => {
    const formatoBarra = '{bar} {percentage}% | {value}/{total} PDFs | Tempo restante: {eta}s';
    return new cliProgress.SingleBar(
        {
            format: formatoBarra,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        },
        cliProgress.Presets.shades_classic
    );
};

/**
 * Processa um grupo de arquivos em paralelo de forma pura
 * @param {ArquivoInfo[]} grupo - Grupo de arquivos
 * @param {cliProgress.SingleBar} barraProgresso - Barra de progresso
 * @returns {Promise<string[]>} Resultados do processamento
 */
const processarGrupoParalelo = (grupo, barraProgresso) =>
    Promise.all(
        grupo.map(async (arquivo) => {
            const resultado = await processarArquivoUnico(arquivo);
            barraProgresso.increment(1);
            return resultado;
        })
    );

/**
 * Função principal que coordena o processamento dos PDFs
 * @param {string} dirOrigem - Diretório dos PDFs
 * @param {string} dirDestino - Diretório dos TXTs
 * @param {number} numThreads - Número de threads paralelas
 * @returns {Promise<void>}
 */
const processarPdfsParalelo = async (dirOrigem, dirDestino, numThreads = 20) => {
    await garantirDiretorio(dirDestino);
    const caminhosPdf = encontrarPdfsSync(dirOrigem);
    const infosArquivos = criarInfosArquivos(caminhosPdf, dirDestino);
    const grupos = dividirEmChunks(infosArquivos, Math.ceil(infosArquivos.length / numThreads));

    console.log(`Iniciando processamento com ${numThreads} threads paralelas...`);
    console.log(`Total de arquivos: ${infosArquivos.length}`);
    console.log(`Arquivos por thread: ~${Math.ceil(infosArquivos.length / numThreads)}\n`);

    const barraProgresso = criarBarraProgresso(infosArquivos.length);
    barraProgresso.start(infosArquivos.length, 0);

    try {
        const resultadosGrupos = await Promise.all(
            grupos.map((grupo) => processarGrupoParalelo(grupo, barraProgresso))
        );

        barraProgresso.stop();
        const resultados = resultadosGrupos.flat();

        console.log('\nResultados detalhados:');
        resultados.forEach((resultado) => console.log(resultado));
        console.log('\nProcessamento concluído!');
    } catch (erro) {
        barraProgresso.stop();
        console.error('\nErro no processamento:', erro.message);
    }
};

// Caminhos dos diretórios
const diretorioBase = __dirname;
const diretorioPdfs = path.join(diretorioBase, 'roteiros_pdf');
const diretorioTxts = path.join(diretorioBase, 'roteiros_txt');

// Executa o processamento
processarPdfsParalelo(diretorioPdfs, diretorioTxts, 20);
