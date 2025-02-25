import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const systemContent = `Você é um assistente especializado em Processamento de Linguagem Natural. Sua tarefa é:
1. Analisar cuidadosamente o texto fornecido.
2. Identificar todos os nomes de materiais e equipamentos laboratoriais mencionados, com ênfase nas seções "MATERIAIS NECESSÁRIOS".
3. Normalizar eventuais variações de grafia (plural, acentos, letras maiúsculas ou minúsculas etc.) de forma que apareçam de maneira unificada/consistente.
4. Retornar esses nomes únicos em português, organizados em uma lista (formato JSON).
5. No roteiro, o laboratorio_id é indicado por <laboratorio_id>.

Instruções de saída:
- **Não** inclua nomes de seções, títulos ou explicações que não sejam estritamente materiais/equipamentos.
- **Não** inclua observações ou instruções de segurança que não sejam o nome de algum equipamento real.
- Normalize os nomes para a forma padrão em português, por exemplo:
   - "Bico de Bunsen", "bico de bunsen", "Bunsen" → "bico de Bunsen"
   - "Acendedor", "isqueiro de laboratório" (se ocorrerem) → "acendedor"
   - "borrifadores com soluções" → "borrifador"
   - "EPIs" específicos (jaleco, máscara, luvas, óculos) → listar cada item individualmente
- Retorne apenas itens físicos (não software, não partes do computador).
- Formato final: JSON com a lista de materiais normalizados, por exemplo:
\`\`\`json
{
  "laboratorio_id": 123,
  "materials": [
    "bico de Bunsen",
    "acendedor",
    "borrifador",
    "jaleco",
    "máscara",
    "luvas",
    "óculos"
  ]
}
\`\`\`
`;

const CalendarEvent = z.object({
    laboratorio_id: z.number(),
    materials: z.array(z.string())
});


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


async function extractMaterials(laboratorioId, userContent) {
    const response = await openai.chat.completions.create({
        model: 'o3-mini',
        messages: [
            {
                role: 'system',
                content: systemContent
            },
            {
                role: 'user',
                content: `<laboratorio_id>${laboratorioId}</laboratorio_id><roteiro>${userContent}</roteiro>`
            }
        ],
        response_format: zodResponseFormat(CalendarEvent, 'event'),
        reasoning_effort: 'high'
    });
    const event = response.choices[0].message.content;
    const parsedEvent = CalendarEvent.parse(JSON.parse(event));
    return parsedEvent;
}

// Exemplo de uso:
// extractMaterials(123, '...conteúdo do roteiro...')
//     .then((parsedEvent) => console.log(parsedEvent))
//     .catch((error) => console.error(error));

export default extractMaterials;
