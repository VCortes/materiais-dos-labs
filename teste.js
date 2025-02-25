const fs = require('fs');
const path = require('path');

/**
 * Retorna todos os arquivos encontrados (recursivamente) em um diretório.
 * @param {string} dirPath - Caminho para o diretório alvo.
 * @returns {string[]} - Vetor de strings com os caminhos completos de cada arquivo.
 */
function listarArquivos(dirPath) {
    const arquivos = [];

    function explorarDiretorio(diretorio) {
        const itens = fs.readdirSync(diretorio);
        for (const item of itens) {
            const caminhoCompleto = path.join(diretorio, item);
            const stats = fs.statSync(caminhoCompleto);

            if (stats.isDirectory()) {
                // Se for diretório, explorar recursivamente
                explorarDiretorio(caminhoCompleto);
            } else {
                // Se for arquivo, adiciona ao array
                arquivos.push(caminhoCompleto);
            }
        }
    }

    explorarDiretorio(dirPath);
    return arquivos;
}

// Exemplo de uso
const caminhoExemplo = './roteiros_pdf';
const resultado = listarArquivos(caminhoExemplo);
console.log(resultado);
