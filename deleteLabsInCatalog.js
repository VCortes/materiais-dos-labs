/**
 * Script para remover arquivos TXT da pasta roteiros_txt que não possuem IDs correspondentes no catalogo.json
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

// Promisificar funções do fs para trabalhar com promises
const lerArquivo = promisify(fs.readFile);
const lerDiretorio = promisify(fs.readdir);
const removerArquivo = promisify(fs.unlink);
const verificarArquivo = promisify(fs.stat);

/**
 * Função pura que verifica se o texto tem extensão .txt
 * @param {string} nomeArquivo - Nome do arquivo
 * @returns {boolean} Verdadeiro se for um arquivo TXT, falso caso contrário
 */
const ehArquivoTxt = (nomeArquivo) => nomeArquivo.toLowerCase().endsWith('.txt');

/**
 * Função pura que extrai o ID de um nome de arquivo TXT
 * @param {string} nomeArquivo - Nome do arquivo TXT
 * @returns {string|null} ID extraído ou null se não for possível extrair
 */
const extrairIdDoNomeArquivo = (nomeArquivo) => {
    // Usando expressão regular para capturar os números antes de ".txt"
    const correspondencia = nomeArquivo.match(/^0*(\d+)\.txt$/);
    return correspondencia ? correspondencia[1] : null;
};

/**
 * Função pura que filtra entradas válidas do catálogo (não vazias e com ID numérico)
 * @param {Object} entrada - Entrada do catálogo
 * @returns {boolean} Verdadeira se a entrada for válida
 */
const entradaValida = (entrada) => {
    return entrada && entrada.id && !isNaN(Number(entrada.id));
};

/**
 * Função pura que extrai o ID de uma entrada JSON do catálogo
 * @param {Object} entrada - Entrada do catálogo
 * @returns {string|null} ID extraído ou null se não for possível extrair
 */
const extrairIdDoCatalogo = (entrada) => {
    return entradaValida(entrada) ? entrada.id : null;
};

/**
 * Função recursiva pura que processa as entradas do catálogo e coleta todos os IDs válidos
 * @param {Array} entradas - Array de entradas do catálogo
 * @param {number} indice - Índice atual sendo processado
 * @param {Set} idsAcumulados - Set com IDs acumulados até o momento
 * @returns {Set} Set contendo todos os IDs válidos
 */
const coletarIdsDoCatalogo = (entradas, indice, idsAcumulados) => {
    // Caso base: fim do array
    if (indice >= entradas.length) {
        return idsAcumulados;
    }

    const entradaAtual = entradas[indice];
    const idExtraido = extrairIdDoCatalogo(entradaAtual);

    // Adicionar o ID ao Set somente se for válido
    const novosIds = idExtraido 
        ? new Set([...idsAcumulados, idExtraido])
        : idsAcumulados;

    // Chamada recursiva para a próxima entrada
    return coletarIdsDoCatalogo(entradas, indice + 1, novosIds);
};

/**
 * Função recursiva pura que processa a lista de arquivos e identifica aqueles que devem ser removidos
 * @param {string[]} arquivos - Lista de nomes de arquivos
 * @param {number} indice - Índice atual sendo processado
 * @param {Set} idsCatalogo - Set com todos os IDs válidos do catálogo
 * @param {string[]} arquivosParaRemover - Array acumulador com os arquivos a serem removidos
 * @returns {string[]} Lista final de arquivos para remover
 */
const identificarArquivosParaRemover = (arquivos, indice, idsCatalogo, arquivosParaRemover) => {
    // Caso base: fim do array
    if (indice >= arquivos.length) {
        return arquivosParaRemover;
    }

    const nomeArquivoAtual = arquivos[indice];
    
    // Pular arquivos que não são TXT
    if (!ehArquivoTxt(nomeArquivoAtual)) {
        return identificarArquivosParaRemover(arquivos, indice + 1, idsCatalogo, arquivosParaRemover);
    }

    const idExtraido = extrairIdDoNomeArquivo(nomeArquivoAtual);
    
    // Se o ID for válido mas não estiver no catálogo, adicionar à lista para remoção
    const novosArquivosParaRemover = (idExtraido && !idsCatalogo.has(idExtraido))
        ? [...arquivosParaRemover, nomeArquivoAtual]
        : arquivosParaRemover;

    // Chamada recursiva para o próximo arquivo
    return identificarArquivosParaRemover(arquivos, indice + 1, idsCatalogo, novosArquivosParaRemover);
};

/**
 * Função recursiva pura para remover arquivos, usando efeitos isolados
 * @param {string[]} arquivosParaRemover - Lista de arquivos para remover
 * @param {number} indice - Índice atual sendo processado
 * @param {string} diretorioBase - Caminho do diretório base onde estão os arquivos
 * @param {string[]} arquivosRemovidos - Array acumulador com os nomes dos arquivos removidos
 * @returns {Promise<string[]>} Promise com a lista de arquivos que foram removidos
 */
const removerArquivosRecursivamente = async (arquivosParaRemover, indice, diretorioBase, arquivosRemovidos) => {
    // Caso base: fim do array
    if (indice >= arquivosParaRemover.length) {
        return arquivosRemovidos;
    }

    const nomeArquivoAtual = arquivosParaRemover[indice];
    const caminhoCompleto = path.join(diretorioBase, nomeArquivoAtual);
    
    try {
        // Verificar se o arquivo existe
        await verificarArquivo(caminhoCompleto);
        
        // Remover o arquivo
        await removerArquivo(caminhoCompleto);
        console.log(`Arquivo deletado: ${nomeArquivoAtual}`);
        
        // Atualizar a lista de arquivos removidos
        const novosArquivosRemovidos = [...arquivosRemovidos, nomeArquivoAtual];
        
        // Chamada recursiva para o próximo arquivo
        return removerArquivosRecursivamente(
            arquivosParaRemover,
            indice + 1,
            diretorioBase,
            novosArquivosRemovidos
        );
    } catch (erro) {
        console.error(`Erro ao remover o arquivo ${nomeArquivoAtual}:`, erro.message);
        
        // Continuar com o próximo arquivo, mesmo se houver erro
        return removerArquivosRecursivamente(
            arquivosParaRemover,
            indice + 1,
            diretorioBase,
            arquivosRemovidos
        );
    }
};

/**
 * Função principal que executa o processo de remoção de arquivos TXT sem correspondência
 * @returns {Promise<Object>} Promise que resolve para um objeto com estatísticas de remoção
 */
const removerArquivosSemCorrespondencia = async () => {
    try {
        // Caminhos para o catálogo e diretório de roteiros
        const caminhoCatalogo = path.resolve('catalogo.json');
        const diretorioRoteiros = path.resolve('roteiros_txt');
        
        // Estatísticas que serão retornadas no final
        const estatisticas = {
            totalArquivosTxt: 0,
            arquivosRemovidos: 0,
            arquivosComErro: 0
        };
        
        console.log('Iniciando processo de remoção de arquivos sem correspondência...');
        
        // 1. Carregar o catálogo JSON
        const conteudoCatalogo = await lerArquivo(caminhoCatalogo, 'utf8');
        const catalogoJson = JSON.parse(conteudoCatalogo);
        
        // 2. Coletar todos os IDs válidos do catálogo
        const idsCatalogo = coletarIdsDoCatalogo(catalogoJson, 0, new Set());
        console.log(`Total de IDs válidos no catálogo: ${idsCatalogo.size}`);
        
        // 3. Listar arquivos no diretório de roteiros
        const arquivosRoteiros = await lerDiretorio(diretorioRoteiros);
        const arquivosTxt = arquivosRoteiros.filter(ehArquivoTxt);
        estatisticas.totalArquivosTxt = arquivosTxt.length;
        console.log(`Total de arquivos TXT encontrados: ${estatisticas.totalArquivosTxt}`);
        
        // 4. Identificar arquivos para remover (TXT sem correspondência no catálogo)
        const arquivosParaRemover = identificarArquivosParaRemover(
            arquivosTxt,
            0,
            idsCatalogo,
            []
        );
        console.log(`Arquivos sem correspondência no catálogo: ${arquivosParaRemover.length}`);
        
        // 5. Remover os arquivos identificados
        if (arquivosParaRemover.length > 0) {
            const arquivosRemovidos = await removerArquivosRecursivamente(
                arquivosParaRemover,
                0,
                diretorioRoteiros,
                []
            );
            estatisticas.arquivosRemovidos = arquivosRemovidos.length;
            estatisticas.arquivosComErro = arquivosParaRemover.length - arquivosRemovidos.length;
        }
        
        // 6. Exibir resumo final
        console.log('\n===== Resumo da Operação =====');
        console.log(`Total de arquivos TXT analisados: ${estatisticas.totalArquivosTxt}`);
        console.log(`Total de arquivos removidos: ${estatisticas.arquivosRemovidos}`);
        
        if (estatisticas.arquivosComErro > 0) {
            console.log(`Erros durante a remoção: ${estatisticas.arquivosComErro}`);
        }
        
        return estatisticas;
    } catch (erro) {
        console.error('Erro durante o processo:', erro.message);
        return {
            totalArquivosTxt: 0,
            arquivosRemovidos: 0,
            arquivosComErro: 0
        };
    }
};

// Executar a função principal
const resultado = await removerArquivosSemCorrespondencia();

// Exportar a função principal para uso em outros módulos
export default removerArquivosSemCorrespondencia;