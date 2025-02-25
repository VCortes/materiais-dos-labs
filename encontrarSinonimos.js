import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const systemContent = `Você é um assistente especializado em Processamento de Linguagem Natural.  
Receberá dois textos de JSON:
1) <ConjuntoDeItens> com um "conjunto de materiais" (lista de objetos).  
2) <ItemAnalisado> contendo **somente um** material específico.  

Sua tarefa é:
- Comparar o material de ItemAnalisado com cada item de ConjuntoDeItens.
- Determinar se algum item do primeiro texto é sinônimo, alias ou representa o mesmo objeto/equipamento que o material único do segundo texto.
- Para cada item que seja considerado sinônimo ou equivalente, retorne **todos** os dados referentes a ele.
- Se não houver nenhum item equivalente, retorne uma lista vazia.
- **Importante:** considere que os materiais podem ter variações ortográficas, acréscimo de hífens, nomes químicos oficiais e nomes alternativos.

**Definições:**
- Dois materiais são "sinônimos/aliases" ou "o mesmo objeto" se o nome se referir essencialmente à mesma substância ou equipamento.  
- Podem existir variações ortográficas, acréscimo de hífens, nomes químicos oficiais e nomes alternativos, pequenas divergências de grafia, etc.

**Como comparar:**
- Usar análise linguística, normalização de strings (por exemplo, minúsculas, sem acentos) e detecção de sinônimos.
- Se pertinente, considere possíveis nomes químicos conhecidos (por exemplo, "2-metil-2-propanol" e "tert-butanol").
- Adjetivos ou termos adicionais que quando removidos revelam ser materiais equivalentes.
`;

const Item = z.object({
    id: z.number(),
    name: z.string(),
    quantity: z.number(),
    laboratory_ids: z.array(z.number())
});

const ConjuntoDeItens = z.object({
    materials: z.array(Item)
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function encontrarSinonimos(conjunto, item) {
    const response = await openai.chat.completions.create({
        model: 'o3-mini',
        messages: [
            {
                role: 'system',
                content: systemContent
            },
            {
                role: 'user',
                content: `<ConjuntoDeItens>${JSON.stringify(
                    conjunto
                )}</ConjuntoDeItens><ItemAnalisado>${JSON.stringify(item)}</ItemAnalisado>`
            }
        ],
        response_format: zodResponseFormat(ConjuntoDeItens, 'items'),
        reasoning_effort: 'high'
    });
    const items = response.choices[0].message.content;
    const parsedEvent = ConjuntoDeItens.parse(JSON.parse(items));
    return parsedEvent;
}

export default encontrarSinonimos;
