# Materiais dos Laboratórios

Este projeto consiste em um conjunto de scripts JavaScript para extração, processamento e análise de materiais utilizados em roteiros de laboratório. O projeto segue princípios de programação funcional, com funções puras e imutabilidade de dados sempre que possível.

## Estrutura do Projeto

### Processamento de PDFs e Textos

-   **processarPdfs.js**: Converte arquivos PDF da pasta `roteiros_pdf` para arquivos de texto na pasta `roteiros_txt`. Utiliza pdf-parse para extrair o texto dos PDFs de forma paralela, com barra de progresso.

-   **processarTxts.js**: Processa os arquivos de texto extraídos, usando IA para identificar materiais mencionados em cada roteiro de laboratório. Salva os resultados em `materiais.json`. Utiliza o script `extrairMateriais.js`.

-   **extrairMateriais.js**: Utiliza a API OpenAI para analisar os textos dos roteiros e extrair nomes de materiais e equipamentos laboratoriais mencionados, normalizando suas grafias.

### Análise e Agrupamento de Dados

-   **groupMaterials.js**: Lê o arquivo `materiais.json` e apgrupa os materiais identificados por id, nome, contando em quantos laboratórios diferentes cada material é utilizado e os ids desses laboratórios. Salva o resultado em `grouped_materials.json`.

-   **dataAnalysis.js**: Realiza análise estatística sobre os dados de materiais agrupados, calculando porcentagens de laboratórios que utilizam materiais de diferentes frequências.

-   **encontrarSinonimos.js**: Utiliza a API OpenAI para identificar sinônimos entre diferentes nomes de materiais, ajudando a normalizar ainda mais os dados.

-   **createMaterialSubsets.js**: Cria subconjuntos de materiais relacionados ou sinônimos para cada material único identificado. Utiliza o script `encontrarSinonimos.js`.

### Gerenciamento de IDs e Metadados

-   **extrairIdsCatalogo.js**: Extrai IDs dos laboratórios do arquivo `catalogo.csv` seguindo o paradigma funcional.

-   **extrairIdsPdfs.js**: Extrai IDs dos laboratórios a partir dos nomes dos arquivos PDF na pasta `roteiros_pdf`.

-   **compararIds.js**: Compara IDs encontrados no catálogo com os IDs exis
tentes em grouped_materials.json, identificando quais roteiros estão faltando. Utiliza os scripts `extrairIdsCatalogo.js` e `extrairIdsPdfs.js`.

-   **addMaterialIds.js**: Adiciona identificadores sequenciais a cada material no arquivo `grouped_materials.json`.

-   **createLaboratoryInfo.js**: Cria arquivo `laboratoryInfo.json` com informações sobre cada laboratório, combinando dados do catálogo e dos materiais.

### Utilitários e Ferramentas

-   **baixarPdfs.js**: Baixa PDFs de roteiros de laboratórios a partir de URLs padronizadas, usando requisições HTTPS paralelas.

-   **csvToJson.js**: Converte o arquivo `catalogo.csv` para o formato JSON, lidando corretamente com campos entre aspas e valores booleanos.

-   **teste.js**: Script utilitário para listar arquivos recursivamente em um diretório, usado para testes e debug.

## Fluxo de Trabalho Típico

1. Execute `baixarPdfs.js` para obter os roteiros em PDF.
2. Execute `processarPdfs.js` para converter os PDFs em arquivos de texto.
3. Execute `processarTxts.js` para extrair os materiais de cada roteiro usando IA.
4. Execute `groupMaterials.js` para agrupar os materiais por nome e contar suas ocorrências.
5. Execute `dataAnalysis.js`, `createMaterialSubsets.js` e outros scripts de análise conforme necessário.

## Tecnologias Utilizadas

-   Node.js para execução dos scripts
-   APIs:
    -   OpenAI para extração de materiais e identificação de sinônimos
    -   pdf-parse para extração de texto de PDFs
-   Programação funcional para processamento de dados imutáveis
-   Processamento paralelo para operações intensivas

## Requisitos

Para executar este projeto, você precisa ter Node.js instalado e as seguintes dependências:

```bash
npm install fs-extra pdf-parse cli-progress openai dotenv zod
```

Para scripts que utilizam a API OpenAI, é necessário configurar uma variável de ambiente `OPENAI_API_KEY` com sua chave de API.
