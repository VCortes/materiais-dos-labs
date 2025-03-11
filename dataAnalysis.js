/**
 * Script funcional em JavaScript para:
 * 1. Ler o arquivo grouped_materials.json.
 * 2. Para cada critério de quantidade (1, 2, 3, 4, >=5), calcular a porcentagem de
 *    laboratórios distintos em que pelo menos um material se enquadra no critério,
 *    em relação ao total de labs presentes em todos os materiais.
 *
 * Observações sobre o paradigma funcional aplicado:
 * - Funções puras: cada função abaixo não depende de estado externo nem produz efeitos colaterais.
 * - Imutabilidade: as variáveis não são reatribuídas após sua criação.
 * - Uso de funções de alta ordem (map, filter, reduce).
 * - Composição de funções: a saída de uma função serve de entrada para outra.
 * - Transparência referencial: a substituição de chamadas por seus valores não altera o comportamento.
 * - Recursão/coleções de alta ordem no lugar de loops imperativos for/while.
 * - Em JavaScript, não há tipagem estática forte, mas foram inseridos comentários JSDoc para esclarecimento.
 * - Evitamos mutar dados originais, optando por criar novos arrays/estruturas quando necessário.
 */
import fs from 'fs';

/**
 * Lê o conteúdo de um arquivo JSON e retorna o objeto correspondente.
 * @param {string} caminhoDoArquivo - Caminho para o arquivo JSON.
 * @returns {Object} Objeto resultante do parse do conteúdo JSON.
 */
const lerDadosDoArquivo = (caminhoDoArquivo) => {
    const conteudo = fs.readFileSync(caminhoDoArquivo, 'utf-8');
    return JSON.parse(conteudo);
};

/**
 * Filtra os materiais que satisfazem uma condição booleana sobre a quantidade.
 * @param {Array} materiais - Lista de materiais.
 * @param {(q: number) => boolean} condicaoQuantidade - Função que recebe quantity e retorna true ou false.
 * @returns {Array} Lista de materiais filtrados.
 */
const filtrarMateriaisPorCondicao = (materiais, condicaoQuantidade) =>
    materiais.filter((material) => condicaoQuantidade(material.quantity));

/**
 * Dado um array de materiais, extrai todos os laboratory_ids e retorna um conjunto (Set) imutável.
 * @param {Array} materiais - Lista de materiais.
 * @returns {Set<number>} Conjunto de ids de laboratórios.
 */
const obterConjuntoDeLabs = (materiais) => {
    const listaDeTodasIds = materiais
        .map((material) => material.laboratory_ids)
        .reduce((acumulador, ids) => [...acumulador, ...ids], []);

    return new Set(listaDeTodasIds);
};

/**
 * Calcula a porcentagem: (parte / total) * 100.
 * @param {number} parte - Valor parcial.
 * @param {number} total - Valor total.
 * @returns {number} Porcentagem.
 */
const calcularPorcentagem = (parte, total) => (total === 0 ? 0 : (parte / total) * 100);

/**
 * Função principal que orquestra a leitura dos dados, filtra os materiais
 * segundo critérios específicos de quantidade, calcula a porcentagem e imprime
 * o resultado no console.
 */
const main = () => {
    // Lê o arquivo na mesma pasta com os materiais
    const dados = lerDadosDoArquivo('grouped_materials.json');

    // Extrai o array de materiais
    const materiais = dados.materials;

    // Conjunto de todos os labs presentes em todos os materiais
    const todosLabs = obterConjuntoDeLabs(materiais);

    // Define os critérios de quantidade (funções que retornam boolean)
    const criterios = [
        { descricao: 'quantity = 1', teste: (q) => q === 1 },
        { descricao: 'quantity = 2', teste: (q) => q === 2 },
        { descricao: 'quantity = 3', teste: (q) => q === 3 },
        { descricao: 'quantity = 4', teste: (q) => q === 4 },
        { descricao: 'quantity >= 5', teste: (q) => q >= 5 }
    ];

    // Mapeia cada critério a um resultado de porcentagem
    const resultados = criterios.map((criterio) => {
        // Filtra materiais que atendem ao critério
        const materiaisFiltrados = filtrarMateriaisPorCondicao(materiais, criterio.teste);

        // Obtém conjunto de labs destes materiais
        const labsFiltrados = obterConjuntoDeLabs(materiaisFiltrados);

        // Calcula a porcentagem desses labs em relação ao total
        const porcentagem = calcularPorcentagem(labsFiltrados.size, todosLabs.size);

        // Retorna um objeto com a descrição e a porcentagem
        return {
            criterio: criterio.descricao,
            porcentagem
        };
    });

    // Exibe os resultados
    resultados.forEach((resultado) => {
        console.log(`Critério "${resultado.criterio}": ${resultado.porcentagem.toFixed(2)}%`);
    });
};

// Executa a função principal
main();
