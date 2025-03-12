/**
 * Script para remover arquivos do diretório roteiros_txt que já foram processados em materiais.json
 * 
 * Este código segue rigorosamente os princípios do paradigma funcional:
 * - Funções puras sem efeitos colaterais
 * - Imutabilidade de dados
 * - Utilização de funções de alta ordem
 * - Composição de funções
 * - Transparência referencial
 * - Preferência por recursão em vez de loops imperativos
 */

import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

/**
 * Função pura que lê o conteúdo de um arquivo JSON
 * @param {string} caminhoArquivo - Caminho para o arquivo JSON
 * @returns {Promise<Object>} Objeto contendo os dados do arquivo JSON
 */
const lerArquivoJSON = async (caminhoArquivo) => {
    try {
        const conteudo = await fs.readFile(caminhoArquivo, 'utf-8');
        return JSON.parse(conteudo);
    } catch (erro) {
        console.error(`Erro ao ler o arquivo ${caminhoArquivo}:`, erro.message);
        throw erro;
    }
};

/**
 * Função pura que lê o conteúdo de um diretório
 * @param {string} caminhoDiretorio - Caminho para o diretório
 * @returns {Promise<string[]>} Array com nomes de arquivos no diretório
 */
const lerDiretorio = async (caminhoDiretorio) => {
    try {
        return await fs.readdir(caminhoDiretorio);
    } catch (erro) {
        console.error(`Erro ao ler o diretório ${caminhoDiretorio}:`, erro.message);
        throw erro;
    }
};

/**
 * Função pura que extrai os IDs dos laboratórios a partir dos dados do materiais.json
 * @param {Object} dados - Dados do arquivo materiais.json
 * @returns {Set<number>} Conjunto de IDs de laboratórios
 */
const extrairIdsProcessados = (dados) => {
    // Transforma a lista de roteiros em um conjunto de IDs
    return new Set(dados.roteiros.map(roteiro => roteiro.laboratorio_id));
};

/**
 * Função pura que extrai o ID do nome do arquivo de roteiro
 * @param {string} nomeArquivo - Nome do arquivo de roteiro (exemplo: "233_roteiro.txt")
 * @returns {number|null} ID extraído ou null se não for possível extrair
 */
const extrairIdDoNomeArquivo = (nomeArquivo) => {
    const correspondencia = nomeArquivo.match(/^(\d+)_roteiro\.txt$/);
    return correspondencia ? Number(correspondencia[1]) : null;
};

/**
 * Função pura que identifica arquivos a serem removidos com base nos IDs já processados
 * @param {string[]} arquivos - Lista de nomes de arquivos no diretório
 * @param {Set<number>} idsProcessados - Conjunto de IDs já processados
 * @returns {Object[]} Lista de objetos contendo arquivo e seu ID
 */
const identificarArquivosParaRemover = (arquivos, idsProcessados) => {
    return arquivos
        .map(arquivo => ({
            nome: arquivo,
            id: extrairIdDoNomeArquivo(arquivo)
        }))
        .filter(item => item.id !== null && idsProcessados.has(item.id));
};

/**
 * Função que remove um arquivo de forma assíncrona
 * @param {string} caminhoDiretorio - Caminho do diretório
 * @param {Object} arquivo - Objeto contendo nome e ID do arquivo
 * @returns {Promise<Object>} Resultado da operação
 */
const removerArquivo = async (caminhoDiretorio, arquivo) => {
    const caminhoCompleto = path.join(caminhoDiretorio, arquivo.nome);
    try {
        await fs.unlink(caminhoCompleto);
        return {
            sucesso: true,
            arquivo: arquivo.nome,
            id: arquivo.id,
            mensagem: `Arquivo ${arquivo.nome} removido com sucesso.`
        };
    } catch (erro) {
        return {
            sucesso: false,
            arquivo: arquivo.nome,
            id: arquivo.id,
            mensagem: `Erro ao remover ${arquivo.nome}: ${erro.message}`
        };
    }
};

/**
 * Função que remove arquivos recursivamente de forma funcional
 * @param {string} caminhoDiretorio - Caminho do diretório
 * @param {Object[]} arquivos - Lista de objetos contendo arquivo e seu ID
 * @param {number} indice - Índice atual no processamento recursivo
 * @param {Object[]} resultados - Resultados acumulados
 * @returns {Promise<Object[]>} Resultados das operações de remoção
 */
const removerArquivosRecursivamente = async (caminhoDiretorio, arquivos, indice = 0, resultados = []) => {
    // Caso base: todos os arquivos foram processados
    if (indice >= arquivos.length) {
        return resultados;
    }

    // Remover o arquivo atual
    const resultado = await removerArquivo(caminhoDiretorio, arquivos[indice]);
    
    // Adicionar o resultado à lista e continuar com o próximo arquivo
    const novosResultados = [...resultados, resultado];
    
    // Chamada recursiva para o próximo arquivo
    return removerArquivosRecursivamente(caminhoDiretorio, arquivos, indice + 1, novosResultados);
};

/**
 * Função principal que executa o processo de remoção dos roteiros já processados
 */
const removerRoteirosProcessados = async () => {
    try {
        // Definir caminhos dos arquivos e diretórios
        const caminhoDiretorioRoteiros = path.resolve('roteiros_txt');
        const caminhoArquivoMateriais = path.resolve('materiais.json');

        // Ler arquivos necessários
        const arquivosMateriais = await lerArquivoJSON(caminhoArquivoMateriais);
        const arquivosRoteiros = await lerDiretorio(caminhoDiretorioRoteiros);

        // Extrair os IDs dos laboratórios já processados
        const idsProcessados = extrairIdsProcessados(arquivosMateriais);
        console.log(`IDs processados em materiais.json: ${idsProcessados.size}`);

        // Identificar arquivos a serem removidos
        const arquivosParaRemover = identificarArquivosParaRemover(arquivosRoteiros, idsProcessados);
        console.log(`Total de arquivos para remover: ${arquivosParaRemover.length}`);
        
        // Se não há arquivos para remover, encerrar
        if (arquivosParaRemover.length === 0) {
            console.log('Não há arquivos para remover. Todos os roteiros são novos.');
            return {
                totalArquivos: arquivosRoteiros.length,
                removidos: 0,
                falhas: 0,
                arquivosRemovidos: []
            };
        }

        // Remover arquivos
        console.log('\nIniciando remoção de arquivos...');
        const resultados = await removerArquivosRecursivamente(caminhoDiretorioRoteiros, arquivosParaRemover);
        
        // Calcular estatísticas
        const sucessos = resultados.filter(resultado => resultado.sucesso);
        const falhas = resultados.filter(resultado => !resultado.sucesso);

        // Exibir resultados
        console.log('\n===== Resultados =====');
        console.log(`Total de arquivos no diretório: ${arquivosRoteiros.length}`);
        console.log(`Total de arquivos processados em materiais.json: ${idsProcessados.size}`);
        console.log(`Total de arquivos identificados para remoção: ${arquivosParaRemover.length}`);
        console.log(`Arquivos removidos com sucesso: ${sucessos.length}`);
        
        if (falhas.length > 0) {
            console.log(`Falhas na remoção: ${falhas.length}`);
            console.log('\nDetalhes das falhas:');
            falhas.forEach(falha => console.log(`- ${falha.mensagem}`));
        }

        // Exibir lista de arquivos removidos
        if (sucessos.length > 0) {
            console.log('\nArquivos removidos:');
            sucessos.forEach(sucesso => console.log(`- ${sucesso.arquivo} (ID: ${sucesso.id})`));
        }

        return {
            totalArquivos: arquivosRoteiros.length,
            removidos: sucessos.length,
            falhas: falhas.length,
            arquivosRemovidos: sucessos.map(item => item.arquivo)
        };
    } catch (erro) {
        console.error('Erro no processo:', erro.message);
        return {
            totalArquivos: 0,
            removidos: 0,
            falhas: 0,
            erro: erro.message
        };
    }
};

// Executar o script
const resultado = await removerRoteirosProcessados();

// Exportar a função principal para uso em outros módulos
export default removerRoteirosProcessados;