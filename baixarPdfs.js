const https = require('https');
const fs = require('fs/promises');
const path = require('path');
const cliProgress = require('cli-progress');

/**
 * Tipos de dados imutáveis
 * @typedef {Object} ArquivoInfo
 * @property {string} id - ID do laboratório
 * @property {string} url - URL completa do arquivo
 * @property {string} nomeArquivo - Nome do arquivo a ser salvo
 */

/**
 * Cria uma URL base do laboratório
 * @param {string} id - ID do laboratório
 * @returns {string} URL formatada
 */
const criarUrlBase = (id) =>
    `https://www.virtuaslab.net/ualabs/ualab/${id}/img_conteudo/roteiro/pdf/roteiro.pdf`;

/**
 * Cria informações do arquivo de forma imutável
 * @param {string} id - ID do laboratório
 * @returns {ArquivoInfo} Objeto imutável com informações do arquivo
 */
const criarArquivoInfo = (id) =>
    Object.freeze({
        id: id.toString(),
        url: criarUrlBase(id),
        nomeArquivo: `${id}_roteiro.pdf`
    });

/**
 * Verifica se um diretório existe, cria se necessário
 * @param {string} caminho - Caminho do diretório
 * @returns {Promise<string>} Caminho do diretório garantido
 */
const garantirDiretorio = async (caminho) => {
    try {
        await fs.access(caminho);
    } catch {
        await fs.mkdir(caminho, { recursive: true });
    }
    return caminho;
};

/**
 * Baixa um arquivo de forma pura
 * @param {string} url - URL do arquivo
 * @returns {Promise<Buffer>} Conteúdo do arquivo
 */
const baixarArquivo = (url) =>
    new Promise((resolver, rejeitar) => {
        https
            .get(url, (resposta) => {
                if (resposta.statusCode !== 200) {
                    rejeitar(new Error(`Erro no download: ${resposta.statusCode}`));
                    return;
                }

                const acumularChunks = (chunks, chunk) => [...chunks, chunk];
                const chunks = [];

                resposta
                    .on('data', (chunk) => chunks.push(chunk))
                    .on('end', () => resolver(Buffer.concat(chunks)))
                    .on('error', rejeitar);
            })
            .on('error', rejeitar);
    });

/**
 * Salva o arquivo de forma pura
 * @param {string} caminhoCompleto - Caminho do arquivo
 * @param {Buffer} conteudo - Conteúdo do arquivo
 * @returns {Promise<void>}
 */
const salvarArquivo = async (caminhoCompleto, conteudo) =>
    await fs.writeFile(caminhoCompleto, conteudo);

/**
 * Processa um único download de forma pura
 * @param {ArquivoInfo} arquivoInfo - Informações do arquivo
 * @param {string} diretorioBase - Diretório base para salvar
 * @returns {Promise<string>} Mensagem de resultado
 */
const processarDownloadUnico = async (arquivoInfo, diretorioBase) => {
    try {
        const caminhoCompleto = path.join(diretorioBase, arquivoInfo.nomeArquivo);
        const conteudo = await baixarArquivo(arquivoInfo.url);
        await salvarArquivo(caminhoCompleto, conteudo);
        return `Sucesso ao baixar ${arquivoInfo.id}`;
    } catch (erro) {
        return `Falha ao baixar ${arquivoInfo.id}: ${erro.message}`;
    }
};

/**
 * Gera uma sequência de números de forma funcional
 * @param {number} inicio - Número inicial
 * @param {number} fim - Número final
 * @returns {number[]} Array de números
 */
const gerarSequencia = (inicio, fim) =>
    Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);

/**
 * Divide um array em chunks de tamanho específico
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
 * @param {number} total - Total de downloads
 * @returns {cliProgress.SingleBar} Barra de progresso
 */
const criarBarraProgresso = (total) => {
    const formatoBarra = '{bar} {percentage}% | {value}/{total} Downloads | Tempo restante: {eta}s';
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
 * Processa um grupo de downloads em paralelo com progresso
 * @param {ArquivoInfo[]} grupo - Grupo de arquivos para processar
 * @param {string} diretorioBase - Diretório base para salvar
 * @param {cliProgress.SingleBar} barraProgresso - Barra de progresso
 * @returns {Promise<string[]>} Array de mensagens de resultado
 */
const processarGrupoParalelo = async (grupo, diretorioBase, barraProgresso) => {
    const resultados = await Promise.all(
        grupo.map(async (arquivo) => {
            const resultado = await processarDownloadUnico(arquivo, diretorioBase);
            barraProgresso.increment(1);
            return resultado;
        })
    );
    return resultados;
};

/**
 * Função principal que orquestra todos os downloads em paralelo
 * @param {number} inicio - ID inicial
 * @param {number} fim - ID final
 * @param {number} numThreads - Número de threads paralelas
 * @returns {Promise<void>}
 */
const processarDownloadsParalelo = async (inicio, fim, numThreads = 20) => {
    const diretorioBase = await garantirDiretorio(path.join(__dirname, 'roteiros_pdf'));
    const arquivosInfo = gerarSequencia(inicio, fim).map((id) => criarArquivoInfo(id));
    const tamanhoChunk = Math.ceil(arquivosInfo.length / numThreads);
    const grupos = dividirEmChunks(arquivosInfo, tamanhoChunk);

    console.log(`Iniciando downloads com ${numThreads} threads paralelas...`);
    console.log(`Total de arquivos: ${arquivosInfo.length}`);
    console.log(`Arquivos por thread: ~${tamanhoChunk}\n`);

    const barraProgresso = criarBarraProgresso(arquivosInfo.length);
    barraProgresso.start(arquivosInfo.length, 0);

    try {
        const resultadosGrupos = await Promise.all(
            grupos.map((grupo) => processarGrupoParalelo(grupo, diretorioBase, barraProgresso))
        );

        barraProgresso.stop();
        console.log('\nResultados detalhados:');
        const resultados = resultadosGrupos.flat();
        resultados.forEach((resultado) => console.log(resultado));

        console.log('\nProcessamento paralelo concluído!');
    } catch (erro) {
        barraProgresso.stop();
        console.error('\nErro no processamento paralelo:', erro.message);
    }
};

// Executa os downloads do ID 1 ao 50 usando 20 threads
processarDownloadsParalelo(1000, 2000, 20);
