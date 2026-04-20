export interface GuideStep {
  title: string
  description: string
}

export interface GuideTip {
  title: string
  text: string
}

export interface Guide {
  slug: string
  title: string
  category: string
  excerpt: string
  readTime: string
  date: string
  content: string[]
  steps: GuideStep[]
  tips: GuideTip[]
  relatedGuides: string[]
}

export interface GuideCategory {
  id: string
  label: string
  icon: string
}

export const GUIDE_CATEGORIES: GuideCategory[] = [
  { id: 'documentos', label: 'Documentos e Identidade', icon: 'FileText' },
  { id: 'impostos', label: 'Impostos e Receita Federal', icon: 'Calculator' },
  { id: 'bancos', label: 'Bancos e Finanças', icon: 'Banknote' },
  { id: 'previdencia', label: 'Previdência e INSS', icon: 'ShieldCheck' },
  { id: 'saude', label: 'Saúde', icon: 'HeartPulse' },
  { id: 'educacao', label: 'Educação e Diplomas', icon: 'GraduationCap' },
  { id: 'familia', label: 'Família e Relacionamentos', icon: 'Users' },
  { id: 'imoveis', label: 'Imóveis e Patrimônio', icon: 'Home' },
  { id: 'trabalho', label: 'Trabalho e Empreendedorismo', icon: 'Briefcase' },
  { id: 'mudanca', label: 'Mudança e Logística', icon: 'Truck' },
  { id: 'veiculos', label: 'Veículos e CNH', icon: 'Car' },
  { id: 'cidadania', label: 'Eleições e Cidadania', icon: 'Flag' },
  { id: 'compras', label: 'Compras e Envio', icon: 'Package' },
  { id: 'comunicacao', label: 'Comunicação', icon: 'Phone' },
]

export const GUIDES: Guide[] = [
  {
    "slug": "cpf-regularizado-exterior",
    "title": "Como manter seu CPF regularizado morando no exterior",
    "category": "documentos",
    "excerpt": "CPF suspenso, cancelado ou pendente de regularização? Guia passo a passo para resolver sua situação cadastral à distância, evitar bloqueios e manter suas contas liberadas.",
    "readTime": "12 min",
    "date": "18 de abril de 2026",
    "content": [
      "O CPF é a porta de entrada para praticamente tudo no Brasil: contas bancárias, investimentos, heranças, aposentadoria, compra e venda de imóveis. Morar no exterior não elimina essa necessidade — na verdade, torna a regularização ainda mais importante, porque você não pode simplesmente ir até uma Receita Federal resolver pessoalmente.",
      "Um CPF irregular pode ser bloqueado por vários motivos: falta de declaração de Imposto de Renda, dados desatualizados, inconsistência cadastral ou, o mais comum entre expatriados, não ter comunicado a saída definitiva do país. Quando isso acontece, suas contas bancárias podem ser bloqueadas, transferências travadas e até o recebimento de benefícios do INSS pode ser suspenso.",
      "## Por que o CPF fica irregular",
      "As causas mais comuns para expatriados são: não entregar a Declaração de Imposto de Renda quando era obrigatório; não atualizar o endereço para o exterior; não fazer a Comunicação de Saída Definitiva; ou inconsistências entre dados cadastrais (nome com acentuação diferente em documentos distintos, por exemplo).",
      "## Como verificar a situação do seu CPF",
      "Acesse consultasituacao.cpf na Receita Federal. A consulta é gratuita e imediata. Anote exatamente qual é o motivo da irregularidade — isso vai definir todo o seu plano de ação.",
      "## Como regularizar de fora do Brasil",
      "A regularização pode ser feita 100% online se você tiver uma conta gov.br de nível prata ou ouro. Acesse o e-CAC, vá em \"Meu CPF\" > \"Regularizar\" e siga as instruções. Em casos complexos, envie email para cpf.residente.exterior@rfb.gov.br com cópia dos documentos digitalizados."
    ],
    "steps": [
      {
        "title": "Consulte a situação",
        "description": "Acesse consultasituacao.cpf e anote o motivo exato da irregularidade."
      },
      {
        "title": "Reúna documentos",
        "description": "Passaporte, comprovante de residência no exterior, certidão de nascimento atualizada e declarações de IR pendentes."
      },
      {
        "title": "Acesse o e-CAC",
        "description": "Crie/acesse conta gov.br (nível prata ou ouro) e vá em Meu CPF > Regularizar."
      },
      {
        "title": "Preencha e anexe",
        "description": "Informe o motivo da regularização, anexe os documentos e guarde o protocolo."
      },
      {
        "title": "Aguarde e confirme",
        "description": "Prazo médio de 5-10 dias úteis. Consulte novamente para confirmar a regularização."
      }
    ],
    "tips": [
      {
        "title": "Conta gov.br no exterior",
        "text": "Você pode validar sua conta gov.br pelo app da Caixa ou de bancos brasileiros, mesmo sem estar no Brasil. Alguns consulados também oferecem apoio."
      },
      {
        "title": "Procuração digital",
        "text": "Se o caso for complexo, dê procuração a um contador ou advogado no Brasil. A procuração pode ser feita por meio eletrônico no e-CAC."
      },
      {
        "title": "Mantenha endereço atualizado",
        "text": "Atualize seu endereço no exterior sempre que mudar. Um endereço desatualizado é uma das principais causas de suspensão."
      }
    ],
    "relatedGuides": [
      "declaracao-saida-definitiva",
      "imposto-renda-exterior",
      "conta-bancaria-brasil"
    ]
  },
  {
    "slug": "passaporte-brasileiro-exterior",
    "title": "Como tirar ou renovar passaporte brasileiro no exterior",
    "category": "documentos",
    "excerpt": "Passaporte vencendo ou perdido? Veja como solicitar, renovar ou emitir segunda via diretamente no consulado brasileiro do país onde reside.",
    "readTime": "10 min",
    "date": "16 de abril de 2026",
    "content": [
      "O passaporte brasileiro é um dos documentos mais importantes para quem vive no exterior. Sem ele válido, você não pode viajar, muitos países não renovam seu visto e alguns serviços consulares ficam bloqueados. A boa notícia é que a emissão e renovação podem ser feitas no consulado brasileiro do país onde você reside.",
      "## Quando renovar",
      "Não espere o passaporte vencer. Muitos países exigem passaporte válido por pelo menos 6 meses além da data de entrada. Se você planeja viajar, renovar com antecedência é essencial.",
      "## Documentos necessários",
      "Geralmente você precisa de: passaporte anterior (se for renovação), RG ou CNH brasileira válida, comprovante de residência no exterior, foto 5x7 cm com fundo branco e recibo de pagamento da GRU. Cada consulado pode ter requisitos específicos — consulte sempre o site oficial.",
      "## Como agendar",
      "A maioria dos consulados usa o sistema e-Consular (sistema-consular.itamaraty.gov.br). Crie sua conta, preencha o formulário de solicitação de passaporte, pague a GRU e agende o atendimento presencial.",
      "## O que acontece no dia do atendimento",
      "Você leva os documentos, faz a biometria (digital e foto) e assina. O passaporte novo geralmente fica pronto em 5-15 dias úteis, dependendo do consulado. Alguns oferecem retirada por correio."
    ],
    "steps": [
      {
        "title": "Verifique prazos",
        "description": "Confira a validade do seu passaporte atual e os prazos exigidos pelo país onde reside."
      },
      {
        "title": "Reúna documentos",
        "description": "RG/CNH, comprovante de residência, foto 5x7 cm fundo branco e passaporte anterior."
      },
      {
        "title": "Preencha no e-Consular",
        "description": "Acesse o sistema, preencha o formulário de passaporte e gere a GRU para pagamento."
      },
      {
        "title": "Pague a GRU",
        "description": "O pagamento pode ser feito em bancos brasileiros, lotéricas ou via transferência internacional (consulte o consulado)."
      },
      {
        "title": "Agende e compareça",
        "description": "Marque o dia no e-Consular, leve os originais e faça a biometria no consulado."
      },
      {
        "title": "Retire ou receba",
        "description": "Aguarde o prazo de confecção e retire pessoalmente ou por correio, conforme opção do consulado."
      }
    ],
    "tips": [
      {
        "title": "Agende com antecedência",
        "text": "Consulados costumam ter filas de espera de semanas ou meses. Não deixe para a última hora."
      },
      {
        "title": "Fotos específicas",
        "text": "Alguns consulados são rigorosos com as fotos. Faça em estúdio fotográfico que conheça os requisitos do Itamaraty."
      },
      {
        "title": "Passaporte de emergência",
        "text": "Se perdeu o passaporte e precisa viajar urgentemente, solicite passaporte de emergência. É válido por menos tempo, mas resolve imediatamente."
      }
    ],
    "relatedGuides": [
      "cpf-regularizado-exterior",
      "certidoes-exterior",
      "declaracao-saida-definitiva"
    ]
  },
  {
    "slug": "certidoes-exterior",
    "title": "Como obter certidões de nascimento e casamento do Brasil morando no exterior",
    "category": "documentos",
    "excerpt": "Precisa de certidão atualizada para processo de cidadania, casamento no exterior ou regularização? Veja como solicitar à distância e receber onde estiver.",
    "readTime": "8 min",
    "date": "14 de abril de 2026",
    "content": [
      "Certidões de nascimento, casamento e óbito são documentos que parecem simples, mas são fundamentais para dezenas de processos no exterior: cidadania europeia, reconhecimento de casamento, matrícula escolar de filhos, regularização fiscal, herança. Morando fora, obter essas certidões pode parecer um labirinto, mas existem caminhos diretos.",
      "## Certidão online via cartório digital",
      "Desde 2022, muitos cartórios brasileiros oferecem emissão online de certidões. Acesse o site do cartório do registro civil do município onde o evento foi registrado e verifique se há opção de solicitação digital. Você recebe por email em PDF, com validade nacional.",
      "## Pela Central de Certidões",
      "O Portal de Serviços do Registro Civil (registrocivil.org.br) permite solicitar certidões de qualquer município brasileiro. O processo é online, você paga por boleto ou cartão e recebe o documento por email.",
      "## Apostilamento de Haia",
      "Se a certidão vai ser usada em país signatário da Convenção de Haia, ela precisa de apostila. A apostila é emitida pelo cartório de notas do município brasileiro ou pela Corregedoria do Tribunal de Justiça. Alguns cartórios já emitem certidão com apostila integrada.",
      "## Pelo consulado brasileiro",
      "Em alguns casos específicos, você pode solicitar certidão pelo consulado, especialmente se for para processo consular. Verifique no site do consulado do seu país."
    ],
    "steps": [
      {
        "title": "Identifique o cartório",
        "description": "Descubra qual é o cartório de registro civil do município brasileiro onde nasceu/casou."
      },
      {
        "title": "Verifique opções online",
        "description": "Acesse o site do cartório ou registrocivil.org.br para solicitar digitalmente."
      },
      {
        "title": "Preencha e pague",
        "description": "Informe seus dados, selecione o tipo de certidão e efetue o pagamento."
      },
      {
        "title": "Receba por email",
        "description": "O documento chega em PDF em poucos dias. Verifique se está com todos os dados corretos."
      },
      {
        "title": "Apostile se necessário",
        "description": "Se for usar no exterior, verifique se precisa de apostila de Haia e solicite junto ao cartório ou tribunal."
      }
    ],
    "tips": [
      {
        "title": "Certidão atualizada",
        "text": "Certidões antigas (mais de 90 dias) podem não ser aceitas para alguns processos no exterior. Sempre peça a mais recente."
      },
      {
        "title": "Tradução juramentada",
        "text": "Além da apostila, alguns países exigem tradução juramentada para o idioma local. Verifique antes de gastar dinheiro."
      },
      {
        "title": "Procuração no Brasil",
        "text": "Se precisar de certidão antiga ou de cartório sem sistema online, dê procuração a um familiar ou despachante no Brasil."
      }
    ],
    "relatedGuides": [
      "passaporte-brasileiro-exterior",
      "casamento-exterior-reconhecimento",
      "cidadania-europeia"
    ]
  },
  {
    "slug": "declaracao-saida-definitiva",
    "title": "Declaração de Saída Definitiva: guia completo passo a passo",
    "category": "impostos",
    "excerpt": "A saída definitiva é o documento mais importante para quem vai morar fora. Saiba como fazer, quando é obrigatória e quais erros evitar para não ter problemas com a Receita Federal.",
    "readTime": "15 min",
    "date": "20 de abril de 2026",
    "content": [
      "A Declaração de Saída Definitiva do País (DSDP) é o documento que informa à Receita Federal que você deixou de ser residente fiscal no Brasil. Sem ela, você continua sendo tratado como residente, com todas as obrigações tributárias — incluindo declarar renda mundial. É como sair de um apartamento e não avisar o síndico: você continua recebendo contas e cobranças por algo que não usa mais.",
      "## Quem precisa fazer",
      "Todo brasileiro que se muda para o exterior de forma permanente ou por período superior a 12 meses consecutivos deve fazer a saída definitiva. A única exceção são funcionários públicos em missão oficial ou estudantes com programas temporários claros.",
      "## Passo 1: Comunicação de Saída",
      "Antes da DSDP, você deve fazer a Comunicação de Saída Definitiva no e-CAC. Acesse com sua conta gov.br, vá em \"Meu Imposto de Renda\" > \"Comunicação de Saída Definitiva\" e preencha os dados. Isso deve ser feito até fevereiro do ano seguinte à saída.",
      "## Passo 2: Declaração de Saída Definitiva",
      "No ano seguinte à saída, ao invés da declaração de ajuste anual comum, você preenche a DSDP no programa do IRPF. Informe a data exata da saída, declare todos os bens, direitos e rendimentos até aquela data e indique um procurador no Brasil (altamente recomendável).",
      "## O que muda depois",
      "Após a saída definitiva, você passa a ser não residente fiscal. Isso significa que rendimentos de fonte brasileira continuam tributáveis (aluguéis, ganhos de capital, aplicações), mas rendimentos do exterior não precisam mais ser declarados no Brasil. Você também fica isento da declaração anual de ajuste.",
      "## Erros que custam caro",
      "Os erros mais comuns são: não avisar fontes pagadoras (bancos, empregadores) sobre a nova condição de não residente; manter CPF com endereço brasileiro antigo; esquecer de declarar todos os bens até a data de saída; e perder o prazo de entrega. Cada um desses erros pode gerar multas, juros e bloqueios.",
      "## Se você voltar ao Brasil",
      "Não há \"declaração de retorno\". Basta, no ano seguinte ao retorno, entregar a declaração de ajuste anual normalmente informando a data do reingresso. Você volta automaticamente a ser residente fiscal."
    ],
    "steps": [
      {
        "title": "Comunique a saída",
        "description": "Acesse o e-CAC e envie a Comunicação de Saída Definitiva até fevereiro do ano seguinte à saída."
      },
      {
        "title": "Reúna documentação",
        "description": "Informes de rendimentos, extratos bancários, escrituras, comprovante de saída (passagem ou contrato de trabalho)."
      },
      {
        "title": "Preencha a DSDP",
        "description": "No programa do IRPF do ano seguinte, selecione \"Declaração de Saída Definitiva\" e preencha todos os dados até a data de saída."
      },
      {
        "title": "Indique procurador",
        "description": "Nomeie um representante fiscal no Brasil para receber notificações e resolver pendências."
      },
      {
        "title": "Transmita e guarde recibo",
        "description": "Envie a declaração dentro do prazo e guarde o recibo de entrega comprovante."
      },
      {
        "title": "Atualize cadastros",
        "description": "Informe bancos, empregadores e outros que você é não residente fiscal."
      }
    ],
    "tips": [
      {
        "title": "Prazo é rigoroso",
        "text": "A DSDP deve ser entregue até o final de maio do ano seguinte à saída. Atraso gera multa de 1% ao mês (limite 20%) mais juros SELIC."
      },
      {
        "title": "Bens no Brasil",
        "text": "Você pode (e deve) manter bens no Brasil mesmo como não residente. Eles devem ser declarados na DSDP e não precisam ser vendidos."
      },
      {
        "title": "Restituição",
        "text": "Se tiver direito a restituição de IR, ela só pode ser depositada em conta bancária no Brasil. Mantenha uma conta ativa."
      }
    ],
    "relatedGuides": [
      "imposto-renda-exterior",
      "cpf-regularizado-exterior",
      "investimentos-exterior"
    ]
  },
  {
    "slug": "imposto-renda-exterior",
    "title": "Imposto de Renda para brasileiros no exterior: o que você realmente precisa declarar",
    "category": "impostos",
    "excerpt": "Morando fora, você ainda tem obrigações com a Receita Federal. Descubra o que declarar, o que não declarar e como evitar a temida malha fina.",
    "readTime": "14 min",
    "date": "18 de abril de 2026",
    "content": [
      "A pergunta que mais ouvimos de brasileiros no exterior é: \"Ainda preciso declarar Imposto de Renda no Brasil?\" A resposta curta é: depende. A resposta longa é este guia completo.",
      "## Se você fez saída definitiva",
      "Como não residente fiscal, você não precisa mais entregar a Declaração de Ajuste Anual do IRPF. No entanto, rendimentos de fonte brasileira continuam tributáveis. Aluguéis, ganhos de capital na venda de imóveis ou ações no Brasil, rendimentos de aplicações financeiras — tudo isso ainda precisa ser declarado e/ou ter imposto retido na fonte.",
      "## Se você NÃO fez saída definitiva",
      "Você continua sendo residente fiscal no Brasil. Isso significa que deve declarar sua renda mundial — incluindo salário no exterior, rendimentos de investimentos no exterior, tudo. E pode ser tributado no Brasil sobre isso. A boa notícia é que o Brasil tem acordos para evitar bitributação com muitos países.",
      "## Acordos para evitar bitributação",
      "O Brasil tem acordos com mais de 30 países (Portugal, Espanha, França, Alemanha, Japão, EUA, entre outros). Esses acordos garantem que você não pague imposto duas vezes sobre a mesma renda. Mas você precisa comprovar que já pagou no país de residência, geralmente através de certidão de residência fiscal.",
      "## O que acontece se não declarar",
      "Multa de 1% ao mês sobre o imposto devido (limite 20%), juros SELIC, inclusão na malha fina, bloqueio do CPF e dificuldades para movimentar contas bancárias. Em casos graves, pode haver ação fiscal.",
      "## Como se regularizar",
      "A Receita Federal permite retificar declarações dos últimos 5 anos. Se você tem declarações pendentes, a melhor estratégia é regularizar o quanto antes, antes que a Receita descubra por conta própria."
    ],
    "steps": [
      {
        "title": "Verifique sua condição fiscal",
        "description": "Você é residente ou não residente? Isso define todas as suas obrigações."
      },
      {
        "title": "Liste rendimentos no Brasil",
        "description": "Aluguéis, ganhos de capital, aplicações, heranças — tudo que vem de fonte brasileira."
      },
      {
        "title": "Verifique acordos internacionais",
        "description": "Consulte se o Brasil tem acordo de bitributação com o país onde reside."
      },
      {
        "title": "Obtenha certidão de residência fiscal",
        "description": "Solicite no país de residência para comprovar que já paga impostos lá."
      },
      {
        "title": "Declare ou regularize",
        "description": "Entregue a declaração no prazo ou faça retificação retroativa se estiver em atraso."
      }
    ],
    "tips": [
      {
        "title": "Contador especializado",
        "text": "Impostos internacionais são complexos. Invista em um contador que entenda de expatriados. O custo do contador é muito menor que o custo de uma multa."
      },
      {
        "title": "Mantenha registros",
        "text": "Guarde todos os comprovantes de pagamento de impostos no exterior por pelo menos 5 anos. Você pode precisar comprovar para a Receita Federal."
      },
      {
        "title": "Não ignore notificações",
        "text": "Se receber comunicação da Receita Federal, responda no prazo. Ignorar só piora a situação e aumenta as multas."
      }
    ],
    "relatedGuides": [
      "declaracao-saida-definitiva",
      "investimentos-exterior",
      "cpf-regularizado-exterior"
    ]
  },
  {
    "slug": "investimentos-exterior",
    "title": "Como declarar investimentos no exterior morando fora do Brasil",
    "category": "impostos",
    "excerpt": "Tem conta em corretora americana, criptomoedas ou imóveis no exterior? Entenda suas obrigações fiscais no Brasil e no país de residência.",
    "readTime": "11 min",
    "date": "15 de abril de 2026",
    "content": [
      "Investir no exterior deixou de ser privilégio de ricos. Hoje, qualquer brasileiro pode abrir conta em corretora americana, comprar criptomoedas ou investir em imóveis em outros países. Mas com oportunidade vem responsabilidade fiscal — e ela é dupla: no Brasil e no país onde você reside.",
      "## No Brasil: CBE e IRPF",
      "Se você é residente fiscal no Brasil, deve declarar todos os bens e direitos no exterior na Declaração de Ajuste Anual. Ativos acima de US$ 100.000 também exigem a Declaração de Capitais Brasileiros no Exterior (CBE), anual e independente do IRPF.",
      "## Como não residente",
      "Após a saída definitiva, você não precisa mais declarar investimentos no exterior no Brasil. Mas rendimentos de fonte brasileira (aluguéis, ganhos de capital em ativos brasileiros) continuam declaráveis.",
      "## No país de residência",
      "Cada país tem suas próprias regras. Portugal taxa rendimentos de investimentos em 28%. Espanha usa escala progressiva. EUA cobra imposto sobre ganhos de capital independentemente da nacionalidade. Você precisa entender as regras locais e, idealmente, contratar um contador local.",
      "## Criptomoedas",
      "Criptoativos são um campo minado fiscal. A Receita Federal exige declaração no IRPF se você é residente. No exterior, regras variam absurdamente: Portugal isenta ganhos de cripto pessoais, Espanha taxa como renda, EUA trata como property. Documente todas as transações."
    ],
    "steps": [
      {
        "title": "Liste todos os ativos no exterior",
        "description": "Corretoras, contas bancárias, imóveis, criptomoedas, participações societárias."
      },
      {
        "title": "Verifique obrigações no Brasil",
        "description": "Se residente: IRPF + CBE (se > US$ 100k). Se não residente: só rendimentos de fonte brasileira."
      },
      {
        "title": "Entenda regras do país de residência",
        "description": "Cada país taxa diferente. Consulte um contador local especializado."
      },
      {
        "title": "Documente transações",
        "description": "Guarde comprovantes de compra, venda, dividendos e ganhos de capital por pelo menos 5 anos."
      },
      {
        "title": "Declare nos dois países se necessário",
        "description": "Use acordos de bitributação para evitar pagar duas vezes sobre o mesmo ganho."
      }
    ],
    "tips": [
      {
        "title": "CBE esquecida",
        "text": "Muitos brasileiros no exterior esquecem a CBE. É uma declaração separada do IRPF, obrigatória anualmente para ativos > US$ 100k. Multa por omissão pode chegar a R$ 5.000."
      },
      {
        "title": "Exchange de cripto",
        "text": "Use exchanges que emitam relatórios fiscais. Isso facilita drasticamente a declaração. Binance, Coinbase e Kraken oferecem relatórios anuais."
      },
      {
        "title": "Planejamento tributário",
        "text": "Estruturar seus investimentos de forma inteligente pode economizar milhares em impostos. Um planejador financeiro internacional vale o investimento."
      }
    ],
    "relatedGuides": [
      "imposto-renda-exterior",
      "declaracao-saida-definitiva",
      "conta-bancaria-brasil"
    ]
  },
  {
    "slug": "mei-cnpj-exterior",
    "title": "Como manter CNPJ e MEI no Brasil morando no exterior",
    "category": "impostos",
    "excerpt": "Empreender à distância é possível. Saiba como manter seu CNPJ ativo, emitir nota fiscal de fora e cumprir obrigações acessórias sem dor de cabeça.",
    "readTime": "10 min",
    "date": "12 de abril de 2026",
    "content": [
      "Ter um CNPJ no Brasil enquanto mora no exterior não é só possível — é comum. Muitos brasileiros mantêm negócios, aluguéis, consultorias ou prestação de serviços online com CNPJ brasileiro. O desafio é cumprir as obrigações sem estar fisicamente no país.",
      "## MEI no exterior",
      "O Microempreendedor Individual permite faturamento de até R$ 81.000 por ano com tributação simplificada. Mesmo morando fora, você pode ser MEI desde que tenha CPF regular, endereço no Brasil (pode ser de procurador) e pague o DAS mensal. A declaração anual do MEI é online e simples.",
      "## CNPJ fora do MEI",
      "Para faturamento maior ou atividades não permitidas no MEI, você precisa de uma empresa formal (Ltda ou outra). Isso exige contador no Brasil, escrituração contábil regular e declarações mais complexas. Mas é perfeitamente viável operar à distância com procuração.",
      "## Nota fiscal de fora",
      "Você pode emitir nota fiscal eletrônica de qualquer lugar do mundo, desde que tenha acesso ao sistema da prefeitura do município onde o CNPJ está registrado. A maioria das prefeituras oferece emissão 100% online.",
      "## Obrigações acessórias",
      "Dependendo do porte da empresa: DAS (MEI), DCTF, EFD Contribuições, EFD Reinf, SPED Fiscal. Tudo pode ser transmitido online. Um bom contador no Brasil cuida de tudo e só te consulta quando necessário."
    ],
    "steps": [
      {
        "title": "Verifique viabilidade",
        "description": "Sua atividade permite MEI? Se não, qual regime tributário é mais vantajoso?"
      },
      {
        "title": "Contrate contador no Brasil",
        "description": "Alguém que entenda de empresas com sócio no exterior e possa operar por procuração."
      },
      {
        "title": "Abra ou mantenha CNPJ",
        "description": "Registre no município ou mantenha o existente atualizado com endereço e email válidos."
      },
      {
        "title": "Configure emissão de nota",
        "description": "Obtenha certificado digital e configure acesso ao sistema da prefeitura para emissão remota."
      },
      {
        "title": "Pague obrigações em dia",
        "description": "DAS mensal, declarações trimestrais/anuais. Use débito automático ou pague por internet banking."
      },
      {
        "title": "Dê procuração ao contador",
        "description": "Facilite a vida dele (e a sua) permitindo que ele resolva burocracias em seu nome."
      }
    ],
    "tips": [
      {
        "title": "Certificado digital",
        "text": "O certificado digital A1 ou A3 é obrigatório para emitir nota fiscal e transmitir declarações. Renove antes do vencimento."
      },
      {
        "title": "Endereço fiscal",
        "text": "Você pode usar o endereço do contador, de um familiar ou de um espaço de coworking como endereço fiscal da empresa."
      },
      {
        "title": "Faturamento em moeda estrangeira",
        "text": "Nota fiscal para cliente no exterior deve ser emitida em reais, convertendo pelo câmbio do dia. Guarde o comprovante da taxa usada."
      }
    ],
    "relatedGuides": [
      "nota-fiscal-exterior",
      "imposto-renda-exterior",
      "conta-bancaria-brasil"
    ]
  },
  {
    "slug": "conta-bancaria-brasil",
    "title": "Como manter conta bancária no Brasil morando no exterior",
    "category": "bancos",
    "excerpt": "Conta bloqueada? Banco exigindo presença? Veja como manter, reativar ou abrir conta bancária no Brasil à distância, sem precisar voltar ao país.",
    "readTime": "12 min",
    "date": "20 de abril de 2026",
    "content": [
      "Manter uma conta bancária no Brasil enquanto mora no exterior não é luxo — é necessidade. Você precisa receber aluguéis, restituições de imposto de renda, transferir dinheiro para familiares, pagar contas de imóveis, investir. Mas os bancos brasileiros não facilitam a vida do expatriado.",
      "## Por que contas são bloqueadas",
      "O principal motivo é CPF irregular. Quando a Receita Federal suspende ou pende o CPF, os bancos recebem alerta e bloqueiam movimentações até a regularização. Outro motivo comum é endereço desatualizado: se o banco manda correspondência para endereço antigo e ela volta, a conta pode ser suspensa por falta de atualização cadastral.",
      "## Como reativar conta bloqueada",
      "Primeiro: regularize o CPF. Segundo: entre em contato com o banco. Alguns bancos permitem atualização cadastral por videochamada ou app. Outros exigem procuração para alguém no Brasil ir à agência. Cada banco tem política diferente.",
      "## Abrir conta nova morando fora",
      "É difícil, mas não impossível. Bancos digitais (Nubank, Inter, C6) permitem abertura de conta pelo app, mas exigem CPF regular, selfie e às vezes comprovante de residência no Brasil. Se você não tem endereço brasileiro, pode usar endereço de familiar ou de procurador.",
      "## Conta de não residente",
      "Alguns bancos oferecem conta específica para não residentes (BB, Itaú, Bradesco). Essas contas têm limitações — geralmente não têm cartão de crédito e alguns serviços são restritos — mas permitem movimentação básica.",
      "## Transferências internacionais",
      "Para enviar dinheiro do Brasil para o exterior (ou vice-versa), você pode usar SWIFT (bancário, caro), Wise (mais barato, mais rápido), Remitly, Western Union ou criptomoedas. Cada um tem limites, taxas e prazos diferentes. Para valores grandes, pode ser necessário comprovar origem dos recursos."
    ],
    "steps": [
      {
        "title": "Verifique situação do CPF",
        "description": "Conta bloqueada geralmente começa com CPF irregular. Resolva isso primeiro."
      },
      {
        "title": "Atualize cadastro no banco",
        "description": "Informe novo endereço no exterior, email e telefone. Use app, internet banking ou procuração."
      },
      {
        "title": "Verifique limites",
        "description": "Contas de não residentes podem ter limites de saque e transferência. Entenda as regras do seu banco."
      },
      {
        "title": "Configure acesso digital",
        "description": "Mantenha app atualizado, token ativo e senhas em dia para operar à distância."
      },
      {
        "title": "Escolha canal de remessas",
        "description": "Compare Wise, Remitly, bancos e cripto para encontrar a melhor opção para suas transferências."
      }
    ],
    "tips": [
      {
        "title": "Não deixe conta inativa",
        "text": "Faça pelo menos uma movimentação a cada 6 meses. Contas inativas por longos períodos podem ser encerradas pelo banco."
      },
      {
        "title": "Token físico",
        "text": "Se o banco usar token físico, leve-o com você no exterior. Sem ele, algumas operações ficam bloqueadas."
      },
      {
        "title": "Múltiplos bancos",
        "text": "Não dependa de um único banco. Ter contas em dois bancos diferentes reduz risco de ficar sem acesso."
      }
    ],
    "relatedGuides": [
      "cpf-regularizado-exterior",
      "enviar-dinheiro-exterior",
      "declaracao-saida-definitiva"
    ]
  },
  {
    "slug": "enviar-dinheiro-exterior",
    "title": "Como enviar e receber dinheiro entre Brasil e exterior: todas as opções comparadas",
    "category": "bancos",
    "excerpt": "Wise, Remitly, banco, cripto ou Western Union? Compare taxas, prazos, limites e burocracia de cada método para escolher o ideal para você.",
    "readTime": "13 min",
    "date": "17 de abril de 2026",
    "content": [
      "Enviar dinheiro do Brasil para o exterior (ou vice-versa) é uma necessidade constante para expatriados: pagar contas no Brasil, ajudar familiares, receber aluguéis, investir. Mas cada método tem suas vantagens, desvantagens e armadilhas. Este guia compara todas as opções principais.",
      "## Transferência bancária (SWIFT)",
      "É o método mais tradicional e seguro, mas também o mais caro e lento. Taxas podem chegar a US$ 50-100 por transferência, além do spread cambial. Prazo: 3-5 dias úteis. Para valores grandes, pode ser necessário comprovar origem dos recursos.",
      "## Wise (TransferWise)",
      "Uma das melhores opções para a maioria dos casos. Taxas transparentes (geralmente 0,5-1% do valor), câmbio próximo do comercial, prazo de 1-2 dias. O receptor precisa ter conta bancária no país de destino. Limite geralmente alto.",
      "## Remitly",
      "Similar à Wise, com opção de \"economia\" (mais barato, mais lento) ou \"expresso\" (mais caro, instantâneo). Boa para transferências recorrentes. Cobre mais países que a Wise em algumas regiões.",
      "## Western Union e MoneyGram",
      "Ideais quando o receptor não tem conta bancária. O dinheiro pode ser retirado em dinheiro em uma agência. Desvantagem: taxas mais altas e câmbio menos favorável. Útil para emergências.",
      "## Criptomoedas",
      "Bitcoin, stablecoins (USDT, USDC) e outras criptos permitem transferências instantâneas e com taxas mínimas. O desafio é a volatilidade (exceto stablecoins) e a necessidade de ambos os lados entenderem como usar. Além disso, movimentações grandes podem chamar atenção fiscal.",
      "## PayPal, Payoneer, Venmo",
      "PayPal funciona entre Brasil e vários países, mas taxas são altas (cerca de 5-6%). Payoneer é popular entre freelancers. Venmo só funciona EUA-EUA."
    ],
    "steps": [
      {
        "title": "Defina valor e frequência",
        "description": "Transferência única ou recorrente? Valor pequeno ou grande? Isso muda a melhor opção."
      },
      {
        "title": "Compare taxas totais",
        "description": "Não olhe só a taxa de transferência. Some taxa + spread cambial + possível taxa de recebimento."
      },
      {
        "title": "Verifique limites e burocracia",
        "description": "Para valores acima de R$ 10.000 ou equivalente, pode ser necessário comprovar origem dos recursos."
      },
      {
        "title": "Teste com valor pequeno",
        "description": "Antes de enviar quantias grandes, faça um teste com valor pequeno para confirmar que tudo funciona."
      },
      {
        "title": "Guarde comprovantes",
        "description": "Documente todas as transferências para possíveis questionamentos fiscais futuros."
      }
    ],
    "tips": [
      {
        "title": "Câmbio do dia",
        "text": "As taxas de câmbio flutuam durante o dia. Se o valor for grande, acompanhe o câmbio e envie em momento favorável."
      },
      {
        "title": "Limite anual",
        "text": "O Brasil tem limite de US$ 150.000 por ano para remessas ao exterior por CPF (acima disso, exige autorização do Banco Central)."
      },
      {
        "title": "Stablecoins para freelancers",
        "text": "Se você recebe de clientes internacionais, stablecoins (USDC, USDT) são uma opção rápida e barata, mas documente tudo para fins fiscais."
      }
    ],
    "relatedGuides": [
      "conta-bancaria-brasil",
      "investimentos-exterior",
      "mei-cnpj-exterior"
    ]
  },
  {
    "slug": "inss-contribuicao-exterior",
    "title": "Como contribuir para o INSS e garantir aposentadoria morando no exterior",
    "category": "previdencia",
    "excerpt": "Não perca seus direitos previdenciários. Guia completo sobre como contribuir para o INSS de fora do Brasil, fazer prova de vida e receber benefícios no exterior.",
    "readTime": "14 min",
    "date": "22 de abril de 2026",
    "content": [
      "Muitos brasileiros que se mudam para o exterior simplesmente param de contribuir para o INSS. Anos depois, descobrem que não têm tempo suficiente de contribuição para se aposentar e precisam começar do zero — ou pior, não conseguem se aposentar nunca. Não deixe isso acontecer com você.",
      "## Por que continuar contribuindo",
      "A aposentadoria por tempo de contribuição exige, na maioria dos casos, pelo menos 15 anos de contribuição (mulher) ou 20 anos (homem). Se você já contribuiu por 10 anos no Brasil e parar, perde tudo? Não — o tempo fica guardado. Mas se quiser se aposentar por tempo de contribuição, precisa completar o mínimo. Continuar contribuindo de fora garante que você não interrompa a contagem.",
      "## Como contribuir de fora",
      "O INSS permite contribuição de não residentes através de GPS (Guia da Previdência Social) emitida no site do INSS ou pelo app Meu INSS. Você paga via boleto (se tiver conta bancária no Brasil) ou por transferência internacional para a conta do INSS.",
      "## Quanto contribuir",
      "Como contribuinte individual (autônomo), você pode escolher qualquer valor entre o salário mínimo e o teto previdenciário. Quanto mais contribuir, maior será o valor da aposentadoria futura. A contribuição é de 20% sobre o valor que você escolher.",
      "## Prova de vida no exterior",
      "Beneficiários do INSS no exterior precisam fazer prova de vida anualmente. Isso pode ser feita no consulado brasileiro, em agências do INSS quando visitar o Brasil, ou em alguns casos por biometria facial pelo app Meu INSS. Não fazer a prova de vida suspende o pagamento do benefício.",
      "## Receber aposentadoria no exterior",
      "Se você já é aposentado e se mudou, pode solicitar a transferência do benefício para o país de residência. O processo é feito pelo INSS, mas exige que o país tenha acordo previdenciário com o Brasil ou que você tenha conta bancária no Brasil para recebimento. Atenção: aposentadorias transferidas para o exterior sofrem retenção de 25% de IR na fonte."
    ],
    "steps": [
      {
        "title": "Verifique seu tempo de contribuição",
        "description": "Acesse o Meu INSS e consulte quanto tempo você já tem acumulado."
      },
      {
        "title": "Escolha o valor da contribuição",
        "description": "Defina um valor entre salário mínimo e teto previdenciário que faça sentido para seu orçamento."
      },
      {
        "title": "Emita a GPS",
        "description": "Gere a guia no site do INSS ou app Meu INSS. Selecione a categoria correta (contribuinte individual)."
      },
      {
        "title": "Pague a guia",
        "description": "Use boleto (conta no Brasil) ou transferência internacional para a conta do INSS indicada na guia."
      },
      {
        "title": "Guarde comprovantes",
        "description": "Documente todos os pagamentos. Eles serão essenciais na hora de solicitar a aposentadoria."
      },
      {
        "title": "Faça prova de vida anual",
        "description": "Se já é beneficiário, não esqueça da prova de vida no consulado ou pelo app."
      }
    ],
    "tips": [
      {
        "title": "Contribuição mensal",
        "text": "A contribuição precisa ser feita todos os meses. Uma falta não invalida o tempo anterior, mas interrompe a continuidade, que pode ser importante para alguns tipos de aposentadoria."
      },
      {
        "title": "Meu INSS no exterior",
        "text": "O app Meu INSS funciona de qualquer lugar do mundo. Use-o para consultar tempo de contribuição, emitir guias e acompanhar processos."
      },
      {
        "title": "Imposto de 25%",
        "text": "Aposentadorias recebidas no exterior têm retenção de 25% de IR na fonte. Isso pode ser contestado judicialmente em alguns casos. Consulte um advogado previdenciário."
      }
    ],
    "relatedGuides": [
      "cpf-regularizado-exterior",
      "declaracao-saida-definitiva",
      "aposentadoria-exterior"
    ]
  },
  {
    "slug": "aposentadoria-exterior",
    "title": "Como receber aposentadoria do INSS morando no exterior",
    "category": "previdencia",
    "excerpt": "Já é aposentado e se mudou? Veja como transferir seu benefício para o exterior, fazer prova de vida e evitar a suspensão do pagamento.",
    "readTime": "10 min",
    "date": "19 de abril de 2026",
    "content": [
      "Receber aposentadoria do INSS morando no exterior é um direito garantido, mas exige burocracia. Muitos aposentados descobrem, meses depois de se mudarem, que o benefício foi suspenso por falta de prova de vida ou porque não informaram a mudança de endereço. Não deixe que isso aconteça.",
      "## Transferência do benefício",
      "Você pode solicitar a transferência do pagamento para uma conta bancária no país de residência. O processo é feito no INSS, geralmente com formulário específico, comprovante de residência no exterior e dados bancários locais. Nem todos os países permitem transferência direta — verifique se há acordo previdenciário.",
      "## Prova de vida",
      "Obrigatória anualmente. Pode ser feita: no consulado brasileiro (agende com antecedência), em agência do INSS quando visitar o Brasil, ou pelo app Meu INSS (quando disponível para seu caso). A prova de vida no consulado gera um atestado que deve ser enviado ao INSS.",
      "## Se o benefício foi suspenso",
      "Não entre em pânico. A reativação é possível. Entre em contato com o INSS, explique a situação, faça a prova de vida atrasada e solicite a reativação. Em alguns casos, os valores atrasados podem ser pagos retroativamente."
    ],
    "steps": [
      {
        "title": "Informe mudança de endereço",
        "description": "Comunique ao INSS seu novo endereço no exterior pelo Meu INSS ou consulado."
      },
      {
        "title": "Solicite transferência",
        "description": "Peça transferência do benefício para conta no exterior ou mantenha conta no Brasil."
      },
      {
        "title": "Agende prova de vida",
        "description": "Marque no consulado brasileiro ou use o app Meu INSS para fazer a prova de vida anual."
      },
      {
        "title": "Envie documentação",
        "description": "Envie o atestado de prova de vida e comprovante de residência ao INSS conforme instruções."
      },
      {
        "title": "Acompanhe pagamentos",
        "description": "Verifique se os depósitos estão ocorrendo regularmente. Em caso de atraso, contate o INSS imediatamente."
      }
    ],
    "tips": [
      {
        "title": "Não deixe acumular",
        "text": "Se o pagamento for suspenso, resolva o mais rápido possível. Quanto mais tempo passa, mais difícil é reaver valores retroativos."
      },
      {
        "title": "Procuração",
        "text": "Dê procuração a um advogado ou familiar no Brasil para resolver pendências do INSS em seu nome."
      },
      {
        "title": "Conta no Brasil",
        "text": "Mesmo morando no exterior, manter uma conta bancária no Brasil facilita o recebimento e evita complicações com transferências internacionais."
      }
    ],
    "relatedGuides": [
      "inss-contribuicao-exterior",
      "cpf-regularizado-exterior",
      "conta-bancaria-brasil"
    ]
  },
  {
    "slug": "plano-saude-brasil-exterior",
    "title": "Plano de saúde no Brasil morando no exterior: vale a pena manter?",
    "category": "saude",
    "excerpt": "Muitos brasileiros mantêm plano de saúde no Brasil para quando voltam a visitar. Saiba quando vale a pena, como escolher e o que observar na contratação.",
    "readTime": "9 min",
    "date": "21 de abril de 2026",
    "content": [
      "A pergunta que todo brasileiro no exterior faz: \"Cancelo meu plano de saúde no Brasil?\" A resposta depende de quantas vezes por ano você visita o país, se tem condições pré-existentes, e se precisa de atendimento específico que só encontra no Brasil.",
      "## Quando vale a pena manter",
      "Se você volta ao Brasil pelo menos uma vez por ano e faz exames, consultas ou tratamentos regulares, manter o plano pode ser economicamente vantajoso. Planos de saúde no Brasil costumam ser mais baratos que nos EUA e Europa, e a cobertura é ampla.",
      "## Quando cancelar",
      "Se você raramente visita o Brasil, não tem condições de saúde especiais, e o plano está pesando no orçamento, cancelar pode fazer sentido. Mas atenção: se um dia quiser voltar a ter plano, terá que cumprir carência novamente (geralmente 180-300 dias para cirurgias e parto).",
      "## Plano internacional vs. nacional",
      "Planos internacionais cobrem atendimento em vários países, mas são caríssimos. Planos nacionais só cobrem o Brasil, mas são mais acessíveis. Algumas operadoras oferecem planos com cobertura internacional limitada para emergências.",
      "## Carência e idade",
      "Quanto mais velho você fica, mais caro fica o plano. E se desenvolver uma condição de saúde enquanto está sem cobertura, pode ter dificuldade de readmissão. Para pessoas acima de 50 anos, manter a cobertura contínua é altamente recomendável."
    ],
    "steps": [
      {
        "title": "Avalie frequência de visitas",
        "description": "Você vai ao Brasil pelo menos uma vez por ano? Usaria o plano nessas visitas?"
      },
      {
        "title": "Considere idade e saúde",
        "description": "Tem mais de 50 anos ou condições pré-existentes? A readmissão futura pode ser difícil ou cara."
      },
      {
        "title": "Compare preços",
        "description": "Plano no Brasil + seguro saúde local pode sair mais barato que plano internacional."
      },
      {
        "title": "Verifique carência",
        "description": "Se cancelar e voltar depois, terá que cumprir carência novamente. Calcule se vale a pena."
      },
      {
        "title": "Decida e execute",
        "description": "Mantenha, reduza categoria ou cancele. Se mantiver, atualize endereço para correspondência eletrônica."
      }
    ],
    "tips": [
      {
        "title": "Telemedicina",
        "text": "Muitos planos brasileiros agora oferecem telemedicina. Você pode fazer consultas online mesmo morando no exterior, mas verifique se o serviço permite atendimento de fora do Brasil."
      },
      {
        "title": "Correspondência",
        "text": "Atualize seu endereço no plano para email ou endereço de familiar no Brasil. Boletos e comunicações importantes precisam chegar."
      },
      {
        "title": "Seguro viagem",
        "text": "Se mantém plano no Brasil mas viaja para outros países, contrate seguro viagem separado. O plano brasileiro não cobre atendimento no exterior (exceto emergências em alguns planos internacionais)."
      }
    ],
    "relatedGuides": [
      "vacinas-expatriados",
      "primeira-consulta-profissional-online"
    ]
  },
  {
    "slug": "vacinas-expatriados",
    "title": "Vacinas e saúde preventiva para brasileiros no exterior",
    "category": "saude",
    "excerpt": "Quais vacinas você precisa antes de viajar? E depois de chegar? Guia completo de imunização, exames preventivos e cuidados de saúde para expatriados.",
    "readTime": "8 min",
    "date": "16 de abril de 2026",
    "content": [
      "A saúde no exterior começa antes de embarcar. Muitos países exigem vacinas específicas para entrada, e outros recomendam imunizações adicionais dependendo da região. Além disso, o calendário vacinal do país de destino pode ser diferente do brasileiro, o que significa que vacinas que você tomou no Brasil podem não ser reconhecidas ou podem faltar reforços locais.",
      "## Vacinas obrigatórias e recomendadas",
      "A febre amarela é exigida para entrada em vários países da África, Ásia e Oceania. Alguns países europeus exigem comprovante de vacinação contra COVID-19 (embora regras estejam relaxando). Crianças podem precisar de comprovante de vacinação completa para matrícula escolar.",
      "## Calendário vacinal diferente",
      "Países como EUA, Reino Unido e Austrália têm calendários vacinais diferentes do Brasil. Isso significa que seu filho pode precisar de doses adicionais ou antecipadas para estar em dia com as exigências locais. Leve o cartão de vacinação brasileiro e peça ao pediatra local para \"converter\" para o calendário local.",
      "## Exames preventivos",
      "Não deixe de fazer exames preventivos anuais só porque mudou de país. Mamografia, papanicolau, exame de próstata, check-up completo — todos são essenciais. Se o sistema de saúde local tem filas longas, considere seguro saúde privado ou telemedicina com profissionais brasileiros.",
      "## Remédios de uso contínuo",
      "Se você toma medicamentos regularmente, leve uma reserva de pelo menos 3 meses. Medicamentos brasileiros podem não existir no exterior (mesmo que com outro nome) ou podem exigir receita local. Leve a receita e um relatório médico traduzidos."
    ],
    "steps": [
      {
        "title": "Consulte calendário do destino",
        "description": "Pesquise o calendário vacinal e exigências de entrada do país onde vai morar."
      },
      {
        "title": "Atualize vacinas no Brasil",
        "description": "Tome vacinas pendentes antes de viajar. É mais fácil e geralmente gratuito no SUS."
      },
      {
        "title": "Leve documentação",
        "description": "Cartão de vacinação, receitas médicas, relatórios de exames — tudo traduzido se possível."
      },
      {
        "title": "Encontre médico local",
        "description": "Cadastre-se no sistema de saúde local ou contrate seguro privado. Tenha um médico de referência."
      },
      {
        "title": "Faça check-up anual",
        "description": "Não deixe exames preventivos de lado. Agende uma vez por ano, mesmo que seja por telemedicina."
      }
    ],
    "tips": [
      {
        "title": "Cartão de vacina digital",
        "text": "Alguns países aceitam comprovante digital de vacinação. Verifique se o país de destino reconhece o ConecteSUS ou app similar."
      },
      {
        "title": "Remédios controlados",
        "text": "Medicamentos controlados (ansiolíticos, opioides) podem ser proibidos em alguns países ou exigir documentação especial. Pesquise antes de levar."
      },
      {
        "title": "Plano de saúde local",
        "text": "Mesmo que tenha plano no Brasil, entenda como funciona o sistema de saúde do país onde reside. Saber onde ir em emergência pode salvar sua vida."
      }
    ],
    "relatedGuides": [
      "plano-saude-brasil-exterior",
      "primeira-consulta-profissional-online"
    ]
  },
  {
    "slug": "revalidacao-diploma-exterior",
    "title": "Como revalidar diploma brasileiro no exterior",
    "category": "educacao",
    "excerpt": "Seu diploma vale no exterior? Saiba como fazer reconhecimento, revalidação e equivalência de estudos em diferentes países.",
    "readTime": "11 min",
    "date": "19 de abril de 2026",
    "content": [
      "Um diploma brasileiro não é automaticamente reconhecido no exterior. Cada país tem seu próprio processo de revalidação, reconhecimento ou equivalência — e os nomes variam: revalidação (Portugal), homologación (Espanha), recognition (Reino Unido), credential evaluation (EUA). Entender o processo do seu país de destino é essencial.",
      "## Portugal: revalidação",
      "Portugal tem acordo com o Brasil que facilita a revalidação de diplomas de graduação e pós-graduação. O processo é feito pela Direção-Geral do Ensino Superior (DGES). Você precisa de diploma apostilado, histórico escolar, programa das disciplinas e comprovante de identidade. O prazo varia de 3 a 12 meses.",
      "## Espanha: homologación",
      "O processo é feito pelo Ministerio de Universidades. É burocrático e lento (6-18 meses). Exige diploma apostilado, tradução juramentada, certificado de equivalência de títulos e, em alguns casos, prova de conhecimento do idioma.",
      "## Reino Unido: NARIC",
      "O UK NARIC (agora UK ENIC) emite um Statement of Comparability que compara seu diploma brasileiro com o sistema britânico. Não é revalidação propriamente dita, mas é aceito pela maioria dos empregadores e instituições. Processo online, prazo de cerca de 15 dias úteis.",
      "## EUA: credential evaluation",
      "Nos EUA, não há revalidação federal. Você contrata uma agência de credential evaluation (WES, ECE, SpanTran) que analisa seus documentos e emite um relatório comparativo. Cada estado e instituição decide se aceita.",
      "## Dicas gerais",
      "Comece o processo o quanto antes. Revalidação leva meses e pode exigir documentos que você não tem à mão. Apostile todos os documentos no Brasil antes de sair — é mais fácil e barato. E considere que, em alguns casos, pode ser mais rápido fazer uma nova graduação ou certificação local do que revalidar."
    ],
    "steps": [
      {
        "title": "Pesquise o processo do país",
        "description": "Cada país tem regras diferentes. Acesse o site oficial do órgão responsável."
      },
      {
        "title": "Apostile documentos no Brasil",
        "description": "Diploma, histórico e programas de disciplinas devem ser apostilados antes de sair."
      },
      {
        "title": "Traduza juramentadamente",
        "description": "Contrate tradutor juramentado no país de destino para traduzir todos os documentos."
      },
      {
        "title": "Envie a solicitação",
        "description": "Preencha formulários, pague taxas e envie documentação conforme exigido."
      },
      {
        "title": "Acompanhe e responda",
        "description": "O órgão pode pedir documentos adicionais. Responda rápido para não atrasar."
      }
    ],
    "tips": [
      {
        "title": "Programas de disciplinas",
        "text": "Muitos processos exigem o conteúdo programático de cada matéria. Solicite na faculdade brasileira antes de se formar ou se mudar."
      },
      {
        "title": "Registro profissional",
        "text": "Diploma revalidado não garante exercício profissional. Muitas profissões exigem registro no conselho local (medicina, engenharia, psicologia, direito)."
      },
      {
        "title": "Custo e prazo",
        "text": "Revalidação pode custar de € 100 a € 2.000+ e levar de 3 meses a 2 anos. Programe-se financeira e temporalmente."
      }
    ],
    "relatedGuides": [
      "revalidacao-diploma-brasil",
      "trabalho-direitos-exterior"
    ]
  },
  {
    "slug": "revalidacao-diploma-brasil",
    "title": "Como revalidar diploma estrangeiro no Brasil",
    "category": "educacao",
    "excerpt": "Estudou no exterior e quer exercer no Brasil? Veja como funciona a revalidação de diploma estrangeiro no Brasil, passo a passo.",
    "readTime": "9 min",
    "date": "14 de abril de 2026",
    "content": [
      "Se você estudou no exterior e quer exercer sua profissão no Brasil, precisa revalidar seu diploma. O processo é feito por universidades brasileiras credenciadas pelo MEC, e as regras variam conforme a área de atuação.",
      "## Quem pode revalidar",
      "A revalidação é feita por universidades brasileiras que tenham curso equivalente ao seu. Nem todas as universidades fazem revalidação — você precisa consultar quais estão autorizadas para sua área.",
      "## Documentos necessários",
      "Diploma apostilado (Convenção de Haia) ou legalizado no consulado brasileiro do país de origem, histórico escolar completo, programa das disciplinas cursadas, comprovante de identidade e CPF. Algumas universidades exigem tradução juramentada.",
      "## O processo",
      "Você envia a documentação para a universidade, que faz uma análise de equivalência. Se houver equivalência total, o diploma é revalidado. Se faltar disciplinas, você pode precisar fazer adaptação curricular (matricular nas matérias pendentes).",
      "## Prazo e custo",
      "O prazo varia de 3 a 12 meses. O custo pode ir de R$ 500 a R$ 5.000, dependendo da universidade e da área. Algumas áreas, como medicina, exigem revalidação de diploma mais prova de residência no Brasil."
    ],
    "steps": [
      {
        "title": "Encontre universidade credenciada",
        "description": "Consulte o e-MEC ou entre em contato com universidades que ofereçam curso equivalente ao seu."
      },
      {
        "title": "Reúna documentação",
        "description": "Diploma apostilado, histórico, programas de disciplinas, identidade e CPF."
      },
      {
        "title": "Envie solicitação",
        "description": "Preencha o formulário da universidade, pague a taxa e envie os documentos."
      },
      {
        "title": "Aguarde análise",
        "description": "A universidade analisa equivalência curricular. Prazo médio: 3-12 meses."
      },
      {
        "title": "Faça adaptação se necessário",
        "description": "Se faltarem disciplinas, matricule-se e cumpra as exigências pendentes."
      },
      {
        "title": "Obtenha diploma revalidado",
        "description": "Após aprovação, a universidade emite o diploma de revalidação, válido em todo o Brasil."
      }
    ],
    "tips": [
      {
        "title": "Médicos e áreas regulamentadas",
        "text": "Medicina, odontologia, enfermagem e outras áreas da saúde exigem revalidação de diploma + revalidação de registro profissional no conselho de classe."
      },
      {
        "title": "Pós-graduação no exterior",
        "text": "Mestrado e doutorado no exterior geralmente são reconhecidos automaticamente se a instituição for reconhecida no país de origem. Mas verifique com a universidade brasileira."
      },
      {
        "title": "Comece antes de voltar",
        "text": "Se planeja retornar ao Brasil, comece a reunir documentação e pesquisar universidades enquanto ainda está no exterior."
      }
    ],
    "relatedGuides": [
      "revalidacao-diploma-exterior",
      "trabalho-direitos-exterior"
    ]
  },
  {
    "slug": "casamento-exterior-reconhecimento",
    "title": "Casamento no exterior: como fazer reconhecimento no Brasil",
    "category": "familia",
    "excerpt": "Casou fora do Brasil? Saiba como fazer o reconhecimento da união no Brasil, atualizar documentos e garantir todos os direitos.",
    "readTime": "10 min",
    "date": "17 de abril de 2026",
    "content": [
      "Casar no exterior é relativamente simples. O desafio vem depois: fazer com que o Brasil reconheça esse casamento. Sem o reconhecimento, você não consegue registrar a união no Registro Civil brasileiro, atualizar documentos, herdar bens ou garantir direitos previdenciários para o cônjuge.",
      "## Reconhecimento no consulado",
      "A forma mais direta é registrar o casamento no consulado brasileiro do país onde você reside. Você precisa da certidão de casamento local apostilada (Convenção de Haia) ou legalizada, traduzida por tradutor juramentado, e documentos de identidade de ambos. O consulado emite um termo de casamento que é válido no Brasil.",
      "## Reconhecimento judicial no Brasil",
      "Se não registrou no consulado, pode fazer o reconhecimento judicial no Brasil através de ação de homologação de sentença estrangeira (se já houve processo no exterior) ou de reconhecimento de casamento. Requer advogado no Brasil e pode levar meses.",
      "## Atualização de documentos",
      "Após o reconhecimento, atualize: CPF (para incluir estado civil e nome do cônjuge se houver mudança), título de eleitor, passaporte (se mudou nome), registros em bancos e empresas."
    ],
    "steps": [
      {
        "title": "Obtenha certidão de casamento",
        "description": "Solicite no cartório/local de registro do país onde casou."
      },
      {
        "title": "Apostile ou legalize",
        "description": "Se o país for signatário da Convenção de Haia, apostile. Se não, legalize no consulado brasileiro."
      },
      {
        "title": "Traduza juramentadamente",
        "description": "Traduza a certidão para português por tradutor juramentado no Brasil ou no exterior."
      },
      {
        "title": "Registre no consulado",
        "description": "Leve documentos ao consulado brasileiro e solicite registro do casamento."
      },
      {
        "title": "Atualize documentos brasileiros",
        "description": "CPF, passaporte, título de eleitor e cadastros em bancos e empresas."
      }
    ],
    "tips": [
      {
        "title": "Pacto antenupcial",
        "text": "Se fez pacto antenupcial (pre-nup) no exterior, ele também precisa ser reconhecido no Brasil. Consulte um advogado de família."
      },
      {
        "title": "Casamento entre brasileiros",
        "text": "Se ambos são brasileiros, o processo no consulado é mais direto. Se um é estrangeiro, podem ser exigidos documentos adicionais."
      },
      {
        "title": "União estável",
        "text": "Se vive em união estável no exterior, o reconhecimento segue processo similar ao casamento. Documente a vida em comum (contas conjuntas, contrato de aluguel, etc.)."
      }
    ],
    "relatedGuides": [
      "registro-nascimento-filho-exterior",
      "divorcio-exterior-brasil",
      "certidoes-exterior"
    ]
  },
  {
    "slug": "registro-nascimento-filho-exterior",
    "title": "Como registrar nascimento de filho no exterior no Brasil",
    "category": "familia",
    "excerpt": "Seu filho nasceu fora do Brasil? Saiba como fazer o registro no consulado, obter a certidão e garantir a cidadania brasileira.",
    "readTime": "9 min",
    "date": "15 de abril de 2026",
    "content": [
      "Quando um filho de brasileiros nasce no exterior, ele tem direito à cidadania brasileira — mas esse direito precisa ser formalizado. O registro deve ser feito no consulado brasileiro do país de nascimento, e quanto mais cedo, melhor.",
      "## Documentos necessários",
      "Certidão de nascimento local apostilada ou legalizada, tradução juramentada, passaportes dos pais, comprovante de residência dos pais no exterior e declaração de que não há impedimento ao registro. Alguns consulados exigem presença de ambos os pais.",
      "## O registro no consulado",
      "O consulado emite um \"Termo de Nascimento\" que é transmitido ao Cartório de Registro Civil do Brasil (geralmente em Brasília). A partir daí, a criança está oficialmente registrada como brasileira e pode obter CPF, passaporte e outros documentos.",
      "## Se não registrar no consulado",
      "É possível fazer o registro diretamente no Brasil, mas é mais complexo. Requer ida a um cartório de registro civil no Brasil com todos os documentos apostilados e traduzidos. O ideal é resolver no consulado o mais rápido possível."
    ],
    "steps": [
      {
        "title": "Obtenha certidão local",
        "description": "Solicite a certidão de nascimento no hospital ou cartório do país onde nasceu."
      },
      {
        "title": "Apostile ou legalize",
        "description": "Apostille (Convenção de Haia) ou legalize no consulado brasileiro."
      },
      {
        "title": "Traduza para português",
        "description": "Tradução juramentada é obrigatória para o registro brasileiro."
      },
      {
        "title": "Agende no consulado",
        "description": "Marque atendimento no consulado brasileiro e leve todos os documentos + passaportes dos pais."
      },
      {
        "title": "Registre e obtenha documentos",
        "description": "Após o registro, solicite CPF e passaporte brasileiro para a criança."
      }
    ],
    "tips": [
      {
        "title": "Prazo ideal",
        "text": "Registre o quanto antes. Quanto mais tempo passa, mais burocrático pode ficar, especialmente se os pais mudarem de endereço no exterior."
      },
      {
        "title": "Dupla cidadania",
        "text": "Se o país de nascimento concede cidadania por solo (jus soli), como EUA, Canadá e vários países latino-americanos, seu filho terá dupla cidadania. Isso é uma vantagem enorme para o futuro dele."
      },
      {
        "title": "Registro tardio",
        "text": "Se o filho já tem anos e não foi registrado, ainda é possível, mas pode exigir investigação de filiação e processo mais longo. Não deixe para depois."
      }
    ],
    "relatedGuides": [
      "casamento-exterior-reconhecimento",
      "passaporte-brasileiro-exterior",
      "cidadania-europeia"
    ]
  },
  {
    "slug": "divorcio-exterior-brasil",
    "title": "Divórcio no exterior: validade no Brasil e o que fazer depois",
    "category": "familia",
    "excerpt": "Se divorciou fora do Brasil, a sentença precisa ser reconhecida aqui. Entenda o processo de homologação e como atualizar sua situação.",
    "readTime": "9 min",
    "date": "13 de abril de 2026",
    "content": [
      "Um divórcio realizado no exterior não é automaticamente válido no Brasil. Para que a sentença estrangeira produza efeitos no país — como atualizar estado civil, partilhar bens no Brasil ou registrar novo casamento — ela precisa passar por homologação pelo Superior Tribunal de Justiça (STJ).",
      "## Homologação no STJ",
      "A homologação é um processo judicial que reconhece a validade da sentença estrangeira no Brasil. É feita por advogado no Brasil, através de petição ao STJ. O processo leva de 6 meses a 2 anos e exige a sentença de divórcio apostilada e traduzida.",
      "## Requisitos para homologação",
      "A sentença deve ser definitiva no país de origem; não pode contrariar soberania nacional, ordem pública ou bons costumes brasileiros; as partes devem ter sido citadas ou o processo deve ter sido feito por procurador. Se houver bens no Brasil, a partilha deve ser compatível com a legislação brasileira.",
      "## Divórcio consensual no exterior",
      "Se o divórcio foi feito de comum acordo e não envolve bens no Brasil, a homologação é geralmente mais simples. Se houver disputa sobre bens, pensão alimentícia ou guarda de filhos, o processo pode ser mais complexo.",
      "## Depois da homologação",
      "Com a sentença homologada, você pode atualizar seu estado civil no Registro Civil, CPF, passaporte e outros documentos. Também pode registrar novo casamento no Brasil."
    ],
    "steps": [
      {
        "title": "Obtenha sentença definitiva",
        "description": "Certifique-se de que o divórcio está definitivo no país onde foi realizado."
      },
      {
        "title": "Apostile e traduza",
        "description": "Apostile a sentença (Convenção de Haia) e traduza por tradutor juramentado."
      },
      {
        "title": "Contrate advogado no Brasil",
        "description": "A homologação no STJ exige advogado brasileiro com inscrição no Brasil."
      },
      {
        "title": "Petição ao STJ",
        "description": "O advogado prepara e envia a petição de homologação com todos os documentos."
      },
      {
        "title": "Aguarde decisão",
        "description": "Prazo médio: 6 meses a 2 anos. O STJ pode pedir informações adicionais."
      },
      {
        "title": "Transcreva e atualize",
        "description": "Após homologação, transcreva a sentença no Registro Civil e atualize documentos."
      }
    ],
    "tips": [
      {
        "title": "Custódia de filhos",
        "text": "Se o divórcio envolve guarda de filhos, a homologação pode ser mais complexa. O STJ verifica se a decisão está de acordo com o Estatuto da Criança e do Adolescente brasileiro."
      },
      {
        "title": "Bens no Brasil",
        "text": "Se houver bens no Brasil, a partilha deverá ser cumprida aqui. A homologação da sentença estrangeira facilita, mas pode ser necessário processo adicional para execução."
      },
      {
        "title": "Novo casamento",
        "text": "Não é possível casar no Brasil antes da homologação do divórcio estrangeiro. Planeje-se com antecedência se pretende se casar novamente no Brasil."
      }
    ],
    "relatedGuides": [
      "casamento-exterior-reconhecimento",
      "registro-nascimento-filho-exterior",
      "testamentos-heranca"
    ]
  },
  {
    "slug": "comprar-imovel-brasil-exterior",
    "title": "Como comprar imóvel no Brasil morando no exterior",
    "category": "imoveis",
    "excerpt": "Quer investir ou ter um pé-de-meia no Brasil? Guia completo sobre como comprar imóvel à distância, documentos necessários e cuidados jurídicos.",
    "readTime": "13 min",
    "date": "23 de abril de 2026",
    "content": [
      "Comprar imóvel no Brasil morando no exterior é perfeitamente legal e bastante comum. Muitos expatriados querem manter um investimento no país, garantir uma casa para visitas ou simplesmente diversificar o patrimônio. O processo é similar ao de quem mora no Brasil, com algumas ressalvas burocráticas.",
      "## Documentos necessários",
      "CPF regularizado é essencial. Se for não residente fiscal, o CPF deve estar com endereço no exterior atualizado. Você também precisará de identidade válida (passaporte ou RG), comprovante de residência no exterior e, em alguns casos, procuração para um representante no Brasil.",
      "## Procuração: seu braço direito",
      "Como você não pode ir ao cartório toda hora, dar procuração a alguém de confiança no Brasil é quase obrigatório. O procurado pode assinar contratos, fazer registros, pagar impostos e representar você em praticamente todas as etapas. A procuração deve ser específica para o imóvel ou geral com poderes amplos.",
      "## Financiamento",
      "Conseguir financiamento bancário no Brasil morando no exterior é difícil. A maioria dos bancos exige comprovação de renda no Brasil. A alternativa é pagar à vista ou buscar financiamento no país de residência (usando o imóvel brasileiro como garantia é raro).",
      "## Impostos e taxas",
      "ITBI (Imposto de Transmissão de Bens Imóveis) varia de 0,5% a 3% do valor do imóvel, dependendo do município. Registro no cartório de imóveis custa cerca de 1-2% do valor. Escritura pública também tem custos. Como não residente, você também precisa informar o Banco Central sobre a aquisição se o valor for significativo.",
      "## Cuidados jurídicos",
      "Nunca compre imóvel sem pesquisa completa: certidão de matrícula atualizada, certidão de ônus reais, certidão de débitos de IPTU e condomínio, e vistoria física. Contrate um advogado imobiliário no Brasil. A distância amplifica riscos — uma pesquisa completa é investimento, não custo."
    ],
    "steps": [
      {
        "title": "Regularize CPF",
        "description": "CPF ativo e com endereço atualizado é pré-requisito para qualquer transação imobiliária."
      },
      {
        "title": "Defina orçamento e local",
        "description": "Pesquise bairros, valores e defina se compra à vista ou busca alternativas de financiamento."
      },
      {
        "title": "Contrate advogado e corretor",
        "description": "Profissionais de confiança no Brasil são seus olhos e ouvidos no processo."
      },
      {
        "title": "Faça procuração",
        "description": "Dê procuração ao advogado ou a um familiar de confiança para assinar documentos em seu nome."
      },
      {
        "title": "Pesquise o imóvel",
        "description": "Certidão de matrícula, ônus reais, débitos, vistoria. Não pule nenhuma etapa."
      },
      {
        "title": "Assinatura e registro",
        "description": "Escritura pública, pagamento de ITBI e registro no cartório de imóveis."
      }
    ],
    "tips": [
      {
        "title": "Procuração pública",
        "text": "A procuração deve ser feita em cartório no Brasil ou no consulado brasileiro no exterior. Verifique quais poderes são necessários (compra, venda, locação, financiamento)."
      },
      {
        "title": "Investimento estrangeiro",
        "text": "A compra de imóvel por não residente é considerada investimento estrangeiro e deve ser informada ao Banco Central se acima de certos limites. Seu advogado pode orientar."
      },
      {
        "title": "Aluguel para pagar financiamento",
        "text": "Se comprar para investir, o aluguel pode cobrir parte do custo. Mas lembre: aluguel no Brasil é tributável e exige nota fiscal em muitos municípios."
      }
    ],
    "relatedGuides": [
      "vender-imovel-brasil-exterior",
      "conta-bancaria-brasil",
      "declaracao-saida-definitiva"
    ]
  },
  {
    "slug": "vender-imovel-brasil-exterior",
    "title": "Como vender imóvel no Brasil morando no exterior",
    "category": "imoveis",
    "excerpt": "Vender imóvel à distância exige planejamento. Aprenda a preparar documentação, calcular impostos e fazer a transação sem precisar voltar ao Brasil.",
    "readTime": "12 min",
    "date": "20 de abril de 2026",
    "content": [
      "Vender um imóvel no Brasil morando no exterior é possível, mas exige preparação. Você precisa de documentação em dia, procuração para alguém no Brasil, cálculo preciso de impostos e paciência para o processo burocrático.",
      "## Documentos do imóvel",
      "Antes de colocar à venda, reúna: certidão de matrícula atualizada, certidão negativa de ônus reais, quitação de IPTU e condomínio, memorial descritivo atualizado e, se for apartamento, ata de assembleia do condomínio autorizando a venda (quando necessário).",
      "## Procuração para venda",
      "Assim como na compra, a procuração é essencial. O procurado pode negociar, assinar contrato de compra e venda, receber sinal e representar você no cartório. A procuração deve mencionar especificamente o imóvel e os poderes de venda.",
      "## Impostos na venda",
      "Ganho de capital: 15% sobre o lucro (valor de venda menos valor de aquisição corrigido pelo IPCA, menos custos com obras e comissões). Se for imóvel residencial e você comprar outro imóvel no Brasil em até 180 dias, pode ser isento. Como não residente, você não tem isenção de até R$ 440.000 (essa é só para residentes).",
      "## Recebimento do valor",
      "O valor pode ser recebido em conta bancária no Brasil (mais simples) ou transferido para o exterior. Transferências internacionais de valores imobiliários podem exigir comprovação de origem e registro no Banco Central. Planeje com antecedência."
    ],
    "steps": [
      {
        "title": "Reúna documentação",
        "description": "Matrícula, ônus reais, quições, autorizações necessárias."
      },
      {
        "title": "Avalie o imóvel",
        "description": "Contrate avaliação profissional ou pesquise valores de mercado na região."
      },
      {
        "title": "Dê procuração",
        "description": "Procuração específica para venda do imóvel a alguém de confiança no Brasil."
      },
      {
        "title": "Coloque à venda",
        "description": "Corretor, plataformas imobiliárias, divulgação. Seu procurado pode mostrar o imóvel."
      },
      {
        "title": "Negocie e feche",
        "description": "Contrato de compra e venda, sinal, prazo para pagamento e escrita."
      },
      {
        "title": "Pague impostos e registre",
        "description": "Recolha IR sobre ganho de capital e registre a transferência no cartório."
      }
    ],
    "tips": [
      {
        "title": "Ganho de capital de não residente",
        "text": "Não residentes pagam IR sobre ganho de capital na fonte, na escritura. O cartório retém o imposto e recolhe à Receita Federal."
      },
      {
        "title": "Isenção de reinvestimento",
        "text": "A isenção por reinvestir em outro imóvel residencial no Brasil é válida para não residentes? Infelizmente, não. Essa isenção é só para residentes fiscais no Brasil."
      },
      {
        "title": "Moeda estrangeira",
        "text": "Se o comprador pagar em moeda estrangeira, o valor deve ser convertido para reais na data da escritura. Use câmbio comercial do Banco Central."
      }
    ],
    "relatedGuides": [
      "comprar-imovel-brasil-exterior",
      "testamentos-heranca",
      "imposto-renda-exterior"
    ]
  },
  {
    "slug": "testamentos-heranca",
    "title": "Testamentos e herança para brasileiros no exterior",
    "category": "imoveis",
    "excerpt": "Proteja sua família e seu patrimônio. Entenda como fazer testamentos válidos no Brasil e no exterior, e como funciona o inventário para não residentes.",
    "readTime": "11 min",
    "date": "18 de abril de 2026",
    "content": [
      "Ninguém gosta de pensar no assunto, mas planejar o futuro do seu patrimônio é um ato de amor com sua família. Para brasileiros no exterior, a questão se complica: bens no Brasil, bens no exterior, herdeiros em diferentes países, leis diferentes. Sem planejamento, seu patrimônio pode ficar anos preso em inventário enquanto sua família sofre.",
      "## Testamento no Brasil",
      "Você pode fazer testamento no Brasil mesmo morando no exterior. A forma mais segura é o testamento público em cartório, que pode ser feito por procuração (seu procurador vai ao cartório em seu nome). Também é possível fazer testamento particular (escrito de próprio punho), mas é mais fácil de ser contestado.",
      "## Testamento no exterior",
      "Cada país tem suas próprias regras. Em Portugal, o testamento pode ser feito em cartório ou particular. Nos EUA, existem wills e trusts. O ideal é ter testamentos em cada país onde você tem bens significativos, desde que não se contradigam.",
      "## Inventário no Brasil para não residentes",
      "Se o falecido era não residente fiscal no Brasil, mas tinha bens no país, o inventário deve ser feito no Brasil para esses bens. Pode ser extrajudicial (se todos os herdeiros concordarem e forem maiores de idade) ou judicial. Como herdeiros podem estar no exterior, procurações são essenciais.",
      "## Bitributação de herança",
      "O Brasil não tem imposto de herança federal (alguns estados têm ITCMD). Mas muitos países têm. Portugal tem Stamp Duty de 10% sobre herança para não parentes diretos. Espanha, França, Reino Unido e EUA têm impostos significativos. Planejamento tributário é essencial."
    ],
    "steps": [
      {
        "title": "Liste todos os bens",
        "description": "No Brasil e no exterior. Imóveis, contas, investimentos, empresas, seguros de vida."
      },
      {
        "title": "Consulte advogados",
        "description": "Um no Brasil (direito brasileiro) e outro no país de residência (direito local)."
      },
      {
        "title": "Faça testamento(s)",
        "description": "Testamento no Brasil (por procuração se necessário) e, se aconselhável, no país de residência."
      },
      {
        "title": "Informe herdeiros",
        "description": "Diga à família onde estão os testamentos, senhas de contas e documentos importantes."
      },
      {
        "title": "Revise periodicamente",
        "description": "Testamentos não são eternos. Revise a cada 3-5 anos ou quando houver mudanças significativas."
      }
    ],
    "tips": [
      {
        "title": "Procuração para inventário",
        "text": "Dê procuração a alguém de confiança no Brasil para lidar com inventário futuro. Isso economiza meses de burocracia."
      },
      {
        "title": "Seguro de vida internacional",
        "text": "Seguros de vida com beneficiários definidos passam fora do inventário, acelerando o acesso ao dinheiro pela família."
      },
      {
        "title": "Contas conjuntas",
        "text": "Contas bancárias conjuntas com direito de sobrevivência também passam fora do inventário, mas tenha cuidado: o co-titular tem acesso imediato a todo o dinheiro."
      }
    ],
    "relatedGuides": [
      "comprar-imovel-brasil-exterior",
      "vender-imovel-brasil-exterior",
      "divorcio-exterior-brasil"
    ]
  },
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
  },
  {
    "slug": "mudanca-exterior-checklist",
    "title": "Checklist definitivo da mudança para o exterior: o que levar, o que vender e o que esquecer",
    "category": "mudanca",
    "excerpt": "A mudança para fora do Brasil é um marco. Use este checklist completo para não esquecer nada importante e não carregar o que não precisa.",
    "readTime": "12 min",
    "date": "24 de abril de 2026",
    "content": [
      "A primeira vez que me mudei para o exterior, levei três malas de roupas, um liquidificador, um ferro de passar e uma coleção de DVDs. Resultado: o liquidificador não funcionava na voltagem local, o ferro era mais barato comprar novo e os DVDs ficaram na caixa por três anos. Aprendi na marra que menos é mais quando se muda de país.",
      "## O que LEVAR (essenciais)",
      "Documentos: passaporte, RG, CPF, certidões, diplomas, históricos escolares — tudo em cópia e digitalizado. Remédios de uso contínuo (3 meses de reserva). Eletrônicos compatíveis com a voltagem local. Fotos e itens de valor sentimental. Roupas para a estação do destino.",
      "## O que VENDER",
      "Móveis pesados, eletrodomésticos que não funcionam na voltagem local, carro (a menos que vá para país com volante do mesmo lado), roupas que não usa há mais de um ano, livros (digitalize os importantes), itens de decoração volumosos.",
      "## O que DEIXAR no Brasil",
      "Documentos originais que não precisa levar (deixe cópias com familiares de confiança). Conta bancária ativa. Procuração para alguém resolver pendências. Endereço de correspondência (casa de pais ou amigos).",
      "## Envio de mudança",
      "Container marítimo é o mais econômico para volumes grandes, mas leva 30-60 dias. Aviação é rápida (7-15 dias) mas cara. Correios é opção para caixas pequenas. Compare opções e verifique restrições de importação do país de destino."
    ],
    "steps": [
      {
        "title": "Digitalize documentos",
        "description": "Escaneie todos os documentos importantes e guarde na nuvem + pendrive."
      },
      {
        "title": "Venda o que não vai levar",
        "description": "Use OLX, Facebook Marketplace, bazares. Quanto antes começar, melhores os preços."
      },
      {
        "title": "Separe remédios e documentos",
        "description": "Leve na bagagem de mão. Nunca na bagagem despachada."
      },
      {
        "title": "Verifique voltagem e padrões",
        "description": "Eletrônicos brasileiros são 127/220V. Muitos países usam 110V ou 240V. Verifique antes de levar."
      },
      {
        "title": "Contrate transporte",
        "description": "Container, frete aéreo ou correio. Compare prazos, taxas e seguros."
      },
      {
        "title": "Deixe procuração e contatos",
        "description": "Alguém no Brasil precisa poder resolver coisas por você nos primeiros meses."
      }
    ],
    "tips": [
      {
        "title": "Peso da bagagem",
        "text": "A maioria das companhias aéreas permite 2 malas de 23kg cada para voos internacionais. Pague excesso antecipado se precisar — é mais barato que no aeroporto."
      },
      {
        "title": "Seguro de mudança",
        "text": "Contrate seguro para o transporte de suas coisas. Containeres às vezes sofrem avarias, roubos ou atrasos."
      },
      {
        "title": "Doação",
        "text": "O que não conseguir vender, doe. Há ONGs que buscam móveis e roupas em casa. Você ajuda alguém e não precisa jogar fora."
      }
    ],
    "relatedGuides": [
      "cnh-exterior",
      "conta-bancaria-brasil",
      "declaracao-saida-definitiva"
    ]
  },
  {
    "slug": "cnh-exterior",
    "title": "CNH brasileira no exterior: validade, troca e como dirigir legalmente",
    "category": "veiculos",
    "excerpt": "Sua CNH vale no exterior? Depende do país. Veja onde pode usar diretamente, onde precisa trocar e como fazer a Permissão Internacional para Dirigir.",
    "readTime": "10 min",
    "date": "22 de abril de 2026",
    "content": [
      "A Carteira Nacional de Habilitação (CNH) brasileira é reconhecida em alguns países, mas não em todos. E mesmo onde é reconhecida, geralmente há um prazo limite (6 meses a 1 ano) para que você troque pela carteira local. Dirigir com CNH brasileira além desse prazo pode resultar em multas, apreensão do veículo e até problemas com seguro.",
      "## Países que aceitam CNH brasileira",
      "Portugal aceita CNH brasileira por até 185 dias para não residentes e permite troca direta sem nova prova para residentes. Espanha exige troca em até 6 meses. Reino Unido permite dirigir por até 12 meses com CNH brasileira. EUA: regras variam por estado — alguns aceitam, outros exigem troca imediata.",
      "## Permissão Internacional para Dirigir (PID)",
      "A PID é um documento traduzido da sua CNH, válido em mais de 150 países. É emitida pelo Detran e tem validade de 1 ano. Não substitui a CNH — você precisa carregar ambos. Nem todos os países exigem PID, mas ter um facilita muito se for parado pela polícia.",
      "## Como trocar CNH no exterior",
      "Cada país tem processo próprio. Geralmente envolve: pedido no órgão de trânsito local, exame médico, exame teórico (às vezes) e exame prático (às vezes). Portugal é um dos mais fáceis: basta apresentar CNH válida, exame médico e pagar taxa. Espanha e EUA geralmente exigem prova prática.",
      "## CNH vencendo no exterior",
      "Se sua CNH brasileira vencer enquanto você mora no exterior, a renovação pode ser feita em alguns consulados brasileiros ou, em alguns casos, pelo Detran com procuração no Brasil. Mas o ideal é renovar antes de sair do Brasil."
    ],
    "steps": [
      {
        "title": "Verifique regras do país",
        "description": "Cada país tem regras diferentes. Consulte o site do órgão de trânsito local."
      },
      {
        "title": "Obtenha PID",
        "description": "Solicite a Permissão Internacional para Dirigir no Detran antes de viajar."
      },
      {
        "title": "Renove CNH se necessário",
        "description": "Se está perto de vencer, renove no Brasil antes de sair."
      },
      {
        "title": "Inicie troca no prazo",
        "description": "Não espere o prazo acabar. Comece o processo de troca assim que chegar ao país de destino."
      },
      {
        "title": "Faça exames necessários",
        "description": "Médico, teórico e/ou prático conforme exigido pelo país."
      }
    ],
    "tips": [
      {
        "title": "Seguro de carro",
        "text": "Seguradoras no exterior podem não cobrir acidentes se você estiver dirigindo com CNH brasileira além do prazo permitido. Troque a carteira antes de contratar seguro anual."
      },
      {
        "title": "Aluguel de carro",
        "text": "Locadoras de veículos geralmente aceitam CNH brasileira + PID para turistas. Mas para residentes, podem exigir carteira local."
      },
      {
        "title": "Pontuação no Brasil",
        "text": "Mesmo morando no exterior, infrações cometidas no Brasil continuam registradas na sua CNH. Multas não pagas podem impedir renovação futura."
      }
    ],
    "relatedGuides": [
      "mudanca-exterior-checklist",
      "conta-bancaria-brasil"
    ]
  },
  {
    "slug": "voto-exterior",
    "title": "Como votar no exterior: guia completo para brasileiros fora do país",
    "category": "cidadania",
    "excerpt": "Voto é obrigatório mesmo fora do Brasil? Como se cadastrar? Veja tudo sobre votação no exterior, zonas eleitorais e como justificar.",
    "readTime": "9 min",
    "date": "20 de abril de 2026",
    "content": [
      "Sim, o voto é obrigatório para brasileiros no exterior — mas com ressalvas. Se você se mudou para o exterior de forma permanente, deve transferir seu título de eleitor para a zona eleitoral do exterior (seção no consulado). Se está fora temporariamente, deve justificar a ausência. Não fazer isso pode gerar multas e impedir a obtenção de passaporte e outros documentos.",
      "## Transferir título para o exterior",
      "Acesse o site do TSE (tse.jus.br) ou o aplicativo e-Título. Solicite transferência de domicílio eleitoral para o exterior. Você precisará comparecer ao consulado brasileiro para biometria. Após a transferência, você vota no consulado nas eleições brasileiras.",
      "## Justificativa de ausência",
      "Se está no exterior temporariamente e não votou, justifique a ausência no e-Título ou no site do TSE. O prazo é de 60 dias após a eleição. A justificativa aceita inclui comprovante de residência no exterior (conta de luz, contrato de aluguel) ou passagem aérea.",
      "## Multas e consequências",
      "Não votar e não justificar gera multa de R$ 3,51 por eleição (acumulativa). Além disso, quem está inadimplente não pode obter passaporte, não pode ser nomeado para cargos públicos e pode ter dificuldades em alguns processos administrativos.",
      "## Desobrigação do voto",
      "Em alguns casos, você pode pedir desobrigação do voto no exterior: se tem mais de 70 anos, se tem deficiência física que impede o deslocamento, ou se mora em área sem seção eleitoral próxima (distância superior a 100km do consulado)."
    ],
    "steps": [
      {
        "title": "Verifique situação eleitoral",
        "description": "Acesse o site do TSE e consulte se está regular ou se há multas pendentes."
      },
      {
        "title": "Transfira ou justifique",
        "description": "Se mora permanentemente no exterior, transfira o título. Se está temporariamente, justifique as ausências."
      },
      {
        "title": "Compareça ao consulado",
        "description": "Para transferência, biometria no consulado é obrigatória em muitos casos. Agende com antecedência."
      },
      {
        "title": "Vote ou justifique sempre",
        "description": "Nas eleições, vote no consulado ou justifique a ausência no prazo de 60 dias."
      },
      {
        "title": "Quite multas se houver",
        "description": "Multas podem ser pagas no site do TSE ou em qualquer banco brasileiro."
      }
    ],
    "tips": [
      {
        "title": "e-Título",
        "text": "Baixe o aplicativo e-Título. Ele permite consultar situação, justificar ausência, pagar multas e solicitar transferência direto pelo celular."
      },
      {
        "title": "Eleições no consulado",
        "text": "As seções eleitorais no exterior costumam ter filas. Chegue cedo e leve documento com foto."
      },
      {
        "title": "Regularize antes de precisar",
        "text": "Se planeja tirar passaporte novo ou fazer algum processo que exija certidão de quitação eleitoral, regularize sua situação com antecedência."
      }
    ],
    "relatedGuides": [
      "cidadania-europeia",
      "cpf-regularizado-exterior"
    ]
  },
  {
    "slug": "cidadania-europeia",
    "title": "Cidadania europeia para brasileiros: Portugal, Itália, Espanha e mais",
    "category": "cidadania",
    "excerpt": "Sonha em ter passaporte europeu? Veja como funciona a cidadania por ascendência nos principais países e o que você precisa para começar.",
    "readTime": "14 min",
    "date": "17 de abril de 2026",
    "content": [
      "Ter cidadania europeia é um dos objetivos de milhões de brasileiros. Um passaporte europeu abre portas para morar, trabalhar, estudar e viajar por toda a União Europeia. Os principais caminhos para brasileiros são: cidadania portuguesa (por tempo de residência ou ascendência judaica sefardita), cidadania italiana (jus sanguinis, por ascendência), cidadania espanhola (por residência ou ascendência em alguns casos), e outras menos comuns.",
      "## Cidadania portuguesa",
      "Por residência: após 5 anos de residência legal em Portugal (com visto adequado), você pode solicitar. Por casamento: após 3 anos de casamento com português. Sefardita: descendentes de judeus expulsos de Portugal podem solicitar comprovação histórica.",
      "## Cidadania italiana (jus sanguinis)",
      "A mais popular entre brasileiros. Se você tem ascendente italiano (avô, bisavô), pode ter direito à cidadania. A regra é: a linha de descendência não pode ter sido interrompida por naturalização (o ascendente não pode ter se naturalizado brasileiro antes do nascimento do filho seguinte). O processo é feito no consulado italiano no Brasil ou diretamente na Itália.",
      "## Cidadania espanhola",
      "Por residência: 10 anos de residência legal (2 anos para ibero-americanos, mas Brasil não está mais na lista simplificada desde 2024). Por ascendência: filhos/nétos de espanhóis exilados durante a ditadura de Franco.",
      "## Documentos necessários",
      "Certidões de nascimento, casamento e óbito de todos os ascendentes na linha direta, apostiladas e traduzidas. Prova de não naturalização do ascendente italiano/português. Documentos de identidade do requerente. Cada consulado tem requisitos específicos."
    ],
    "steps": [
      {
        "title": "Pesquise sua ascendência",
        "description": "Fale com familiares, pesquise registros. Identifique de qual país vem seu ascendente europeu."
      },
      {
        "title": "Reúna certidões",
        "description": "Nascimento, casamento e óbito de todos na linha direta, desde o ascendente europeu até você."
      },
      {
        "title": "Apostile e traduza",
        "description": "Apostille (Convenção de Haia) e traduza juramentadamente para o idioma do país de origem."
      },
      {
        "title": "Agende no consulado",
        "description": "Consulados costumam ter filas enormes. Agende o quanto antes (às vezes anos de espera)."
      },
      {
        "title": "Apresente documentação",
        "description": "Leve todos os documentos ao consulado e aguarde análise."
      },
      {
        "title": "Conclua o processo",
        "description": "Se aprovado, obtenha passaporte europeu e aproveite os direitos de cidadão da UE."
      }
    ],
    "tips": [
      {
        "title": "Naturalização do ascendente",
        "text": "No caso italiano, se seu avô italiano se naturalizou brasileiro ANTES do nascimento do seu pai, a linha foi quebrada e você não tem direito. Se naturalizou DEPOIS, você tem direito."
      },
      {
        "title": "Processo na Itália",
        "text": "Fazer o processo na Itália (em vez do consulado no Brasil) é geralmente mais rápido, mas exige que você more lá por alguns meses."
      },
      {
        "title": "Advogado especializado",
        "text": "Processos de cidadania são burocráticos e demorados. Um advogado ou assessoria especializada pode economizar anos de dor de cabeça."
      }
    ],
    "relatedGuides": [
      "passaporte-brasileiro-exterior",
      "certidoes-exterior",
      "registro-nascimento-filho-exterior"
    ]
  },
  {
    "slug": "comprar-brasil-receber-exterior",
    "title": "Como comprar no Brasil e receber no exterior: guia completo de remessas e encomendas",
    "category": "compras",
    "excerpt": "Quer comprar produtos brasileiros ou receber encomendas de familiares? Entenda taxas, tributação, limites e as melhores formas de envio.",
    "readTime": "11 min",
    "date": "19 de abril de 2026",
    "content": [
      "Saudade de produtos brasileiros? Quer receber um presente da família? Ou comprou algo no Brasil e precisa enviar para sua nova casa? Enviar encomendas do Brasil para o exterior é possível, mas envolve regras de exportação, tributação no destino e limites de valor.",
      "## Correios (Carta Registrada, EMS, PAC, Sedex)",
      "Os Correios oferecem várias modalidades de envio internacional. Carta Registrada é a mais barata para documentos e pequenos itens. EMS é rápido (7-15 dias) e tem rastreamento. Sedex e PAC Internacional são opções para volumes maiores. Cada país tem limites de peso e dimensões.",
      "## Taxas e tributação no destino",
      "O destino é que cobra impostos, não o Brasil. Cada país tem suas próprias regras: EUA isenta até US$ 800 por remessa; UE cobra IVA (geralmente 20%+) e possíveis direitos alfandegários acima de € 150 para produtos comerciais; Reino Unido tem limite de £ 135 para produtos sem direitos alfandegários.",
      "## Remessa de presentes",
      "Muitos países têm tratamento diferenciado para presentes entre pessoas físicas. Geralmente há limite de valor (ex: € 45 na UE) abaixo do qual não há impostos. O remetente deve declarar como \"gift\" e especificar o conteúdo e valor.",
      "## Empresas de redirecionamento",
      "Empresas como Shipito, MyUS e Borderlinx oferecem endereços nos EUA (ou outros países) para você comprar online e redirecionar para onde mora. Algumas oferecem consolidação de pacotes (juntar várias compras em uma só caixa), economizando frete.",
      "## O que não pode enviar",
      "Alimentos perecíveis, produtos inflamáveis, armas, drogas, plantas, animais e certos medicamentos são proibidos ou restritos. Verifique sempre as regras do país de destino antes de enviar."
    ],
    "steps": [
      {
        "title": "Verifique regras do destino",
        "description": "Cada país tem limites e proibições diferentes. Pesquise antes de comprar/enviar."
      },
      {
        "title": "Declare corretamente",
        "description": "Especifique conteúdo, valor e finalidade (compra, presente, amostra) com precisão."
      },
      {
        "title": "Escolha modalidade de envio",
        "description": "Compare Correios, transportadoras (DHL, FedEx) e redirecionadores por preço, prazo e rastreamento."
      },
      {
        "title": "Acompanhe rastreamento",
        "description": "Guarde o código de rastreamento e acompanhe até a entrega."
      },
      {
        "title": "Pague impostos se necessário",
        "description": "Se a encomenda for tributada no destino, pague para liberar a entrega."
      }
    ],
    "tips": [
      {
        "title": "Limite de isenção",
        "text": "Conheça o limite de isenção do país de destino. Dividir compras em remessas menores pode ser vantajoso, mas cuidado: enviar muitas remessas seguidas pode ser interpretado como fraude de importação."
      },
      {
        "title": "Seguro de envio",
        "text": "Sempre declare o valor real e contrate seguro. Se a encomenda se perder, você será reembolsado pelo valor declarado."
      },
      {
        "title": "Comida brasileira",
        "text": "Produtos industrializados (café, doces, farinha) geralmente são aceitos. Produtos frescos (queijos, carnes) são proibidos na maioria dos países."
      }
    ],
    "relatedGuides": [
      "enviar-dinheiro-exterior",
      "comprar-imovel-brasil-exterior"
    ]
  },
  {
    "slug": "manter-celular-brasil-exterior",
    "title": "Como manter número de celular brasileiro no exterior",
    "category": "comunicacao",
    "excerpt": "Receber SMS do banco, WhatsApp com contatos e códigos de verificação: manter seu número brasileiro é essencial. Veja as melhores opções.",
    "readTime": "8 min",
    "date": "15 de abril de 2026",
    "content": [
      "Nosso número de celular brasileiro está ligado a tudo: bancos, apps, contas de email, WhatsApp, verificações em duas etapas. Mudar tudo para um número estrangeiro é um pesadelo logístico. A boa notícia é que existem várias formas de manter seu número brasileiro funcionando no exterior, cada uma com seus prós e contras.",
      "## Roaming internacional",
      "A opção mais simples: ative roaming na sua operadora brasileira. Você recebe ligações e SMS normalmente. O problema é o custo: ligações e dados no exterior são caríssimos. Use apenas para receber SMS e ligações, nunca para navegar.",
      "## Plano de dados local + manter chip brasileiro",
      "Use um celular com dual chip ou mantenha o chip brasileiro desligado e ligue apenas quando precisar receber SMS. Use o chip local para dados e ligações do dia a dia. É a opção mais econômica.",
      "## eSIM brasileiro",
      "Algumas operadoras brasileiras oferecem eSIM, que permite ter o plano brasileiro ativo sem chip físico. Ideal se você tem celular compatível com eSIM. Consulte sua operadora.",
      "## Portabilidade para operadora digital",
      "Operadoras digitais como Porto Seguro Conecta, Inter Cel e C6 Cel oferecem planos baratos para manter número ativo. Algumas têm opções específicas para quem está no exterior.",
      "## Portabilidade para VoIP",
      "Serviços como DID (Direct Inward Dialing) permitem ter um número brasileiro que encaminha ligações e SMS para um app no seu celular. É mais barato, mas nem todos os bancos aceitam para verificação em duas etapas."
    ],
    "steps": [
      {
        "title": "Verifique opções da operadora",
        "description": "Ligue para sua operadora e pergunte sobre planos para manter número no exterior."
      },
      {
        "title": "Ative roaming",
        "description": "Mesmo que não use, ative roaming para receber SMS e ligações."
      },
      {
        "title": "Considere dual chip",
        "description": "Celular com dois chips permite usar número brasileiro e local simultaneamente."
      },
      {
        "title": "Migre WhatsApp com cuidado",
        "description": "Mudar número do WhatsApp pode perder grupos. Faça backup antes."
      },
      {
        "title": "Teste recebimento de SMS",
        "description": "Verifique se consegue receber SMS de bancos e apps importantes com sua configuração."
      }
    ],
    "tips": [
      {
        "title": "Plano mínimo",
        "text": "A maioria das operadoras tem planos de manutenção de número por menos de R$ 30/mês. Não precisa manter plano completo."
      },
      {
        "title": "Dual SIM",
        "text": "iPhones a partir do XS e a maioria dos Androids modernos suportam dual SIM (físico + eSIM). Isso facilita muito."
      },
      {
        "title": "Cuidado com portabilidade VoIP",
        "text": "Alguns bancos e serviços não aceitam números VoIP para verificação em duas etapas. Teste antes de migrar definitivamente."
      }
    ],
    "relatedGuides": [
      "conta-bancaria-brasil",
      "enviar-dinheiro-exterior"
    ]
  }
]
