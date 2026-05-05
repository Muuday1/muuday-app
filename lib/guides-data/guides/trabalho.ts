import type { Guide } from "../types"

export const TRABALHO_GUIDES: Guide[] = [
{
    "slug": "nota-fiscal-exterior",
    "title": "Como emitir nota fiscal para clientes no exterior",
    "category": "trabalho",
    "excerpt": "Você presta serviço para cliente brasileiro ou estrangeiro? Saiba como emitir nota fiscal corretamente, qual CFOP usar e como funciona a tributação.",
    "readTime": "10 min",
    "date": "21 de abril de 2026",
    "content": [
      "Prestar serviço para clientes no exterior é uma ótima forma de gerar renda, mas gera dúvidas na hora da nota fiscal. Qual CFOP usar? Precisa de nota se o cliente é estrangeiro? E se o pagamento vem em dólar? Este guia responde tudo.",
      "## Serviço para cliente brasileiro, executado do exterior",
      "Se o cliente é brasileiro (tem CNPJ ou CPF no Brasil), você deve emitir nota fiscal no Brasil, mesmo executando o serviço do exterior. A nota usa CFOP de prestação de serviço (varia conforme o município) e o valor deve ser em reais, convertendo pelo câmbio do dia.",
      "## Serviço para cliente estrangeiro",
      "Se o cliente é estrangeiro (empresa ou pessoa física sem vínculo com o Brasil), a regra muda. Serviços prestados para o exterior geralmente são isentos de ISS (Lei Complementar 116/2003). Mas você ainda precisa registrar a operação, seja por nota fiscal de exportação de serviços (quando exigida pelo município) ou por registro em livro próprio.",
      "## Conversão cambial",
      "O valor da nota fiscal deve ser em reais. Use a cotação do dólar (ou outra moeda) do dia do fato gerador (geralmente a emissão da nota ou o recebimento). Guarde o comprovante da cotação usada.",
      "## Impostos",
      "Para cliente brasileiro: ISS (conforme alíquota do município), PIS/COFINS e IR (se optante pelo Simples Nacional, tudo está incluso). Para cliente estrangeiro: geralmente isento de ISS, mas pode haver retenção de INSS dependendo da natureza do serviço."
    ],
    "steps": [
      {
        "title": "Identifique o cliente",
        "description": "É brasileiro ou estrangeiro? Tem CNPJ/CPF no Brasil? Isso define toda a operação."
      },
      {
        "title": "Verifique regras do município",
        "description": "Cada prefeitura tem regras diferentes para notas de serviço para o exterior. Consulte o site da sua prefeitura."
      },
      {
        "title": "Converta valor para reais",
        "description": "Use câmbio comercial do dia. Documente a fonte da cotação."
      },
      {
        "title": "Emita a nota fiscal",
        "description": "Preencha corretamente CFOP, dados do cliente, descrição do serviço e valor em reais."
      },
      {
        "title": "Envie ao cliente e guarde",
        "description": "Envie por email e arquive a nota para fins contábeis e fiscais."
      }
    ],
    "tips": [
      {
        "title": "Contrato internacional",
        "text": "Tenha um contrato claro com cliente estrangeiro: escopo, prazo, valor, moeda, forma de pagamento. Isso evita disputas e facilita comprovação fiscal."
      },
      {
        "title": "Recebimento em moeda estrangeira",
        "text": "Quando recebe em dólar/euro, a conversão para a nota deve ser feita na data do fato gerador. Se o câmbio mudar entre emissão e recebimento, pode haver ganho/perda cambial tributável."
      },
      {
        "title": "Simples Nacional",
        "text": "Se é MEI ou Simples Nacional, a nota para cliente no exterior pode ter tratamento diferenciado. Confirme com seu contador antes de emitir."
      }
    ],
    "relatedGuides": [
      "mei-cnpj-exterior",
      "precificar-servicos-exterior",
      "enviar-dinheiro-exterior"
    ]
  }
]
