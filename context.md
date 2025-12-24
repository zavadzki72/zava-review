# zava-review – Project Context

## Visão Geral

O **zava-review** é um plugin de *code review automatizado* baseado em Inteligência Artificial, projetado para analisar alterações de código e gerar comentários técnicos de forma semelhante a ferramentas como SonarQube, porém com maior flexibilidade, personalização e suporte a múltiplos provedores de IA.

O projeto tem como objetivo:
- Elevar a qualidade do código em Pull Requests
- Automatizar feedback técnico
- Garantir aderência a padrões arquiteturais e de código definidos pelo projeto
- Funcionar tanto localmente (VSCode) quanto em pipelines de PR (Azure DevOps / GitHub)

---

## Arquitetura Geral

O projeto é dividido em **três camadas principais**:

### 1. Core de Análise (Compartilhado)
Camada central responsável por:
- Coleta e normalização do diff
- Leitura de configurações
- Construção de prompts
- Comunicação com provedores de IA
- Interpretação e padronização da resposta da IA

Essa camada é **agnóstica de plataforma** e reutilizada tanto pelo plugin VSCode quanto pelo pipeline de PR.

---

### 2. Plugin VSCode

O plugin VSCode oferece duas opções de execução:

#### 2.1 Análise Total
- Analisa **todos os arquivos do projeto**
- Utilizada principalmente para auditorias iniciais ou revisões completas
- Gera um arquivo `.md` com:
  - Sumário geral
  - Achados organizados por arquivo
  - Sugestões e observações técnicas

#### 2.2 Análise de Alterações Pendentes
- Analisa **apenas os arquivos alterados** (baseado em `git diff`)
- Utilizada para validação rápida antes de commits ou PRs
- Gera um `.md` estruturado contendo apenas os pontos relevantes ao diff

📌 O plugin utiliza os mecanismos nativos do VSCode para:
- Execução
- Armazenamento seguro de credenciais (Secret Storage)
- Exibição de feedback ao usuário

---

### 3. Integração com Pull Requests (Pipeline)

O zava-review pode ser executado automaticamente ao criar ou atualizar uma Pull Request em:

- Azure DevOps
- GitHub

#### Funcionamento:
- O pipeline coleta **apenas o diff da PR**
- Cada alteração é analisada individualmente
- Os comentários são publicados:
  - **Inline**, diretamente no escopo da alteração (linha/bloco)
  - Seguindo o padrão de ferramentas como Sonar

📌 O plugin **não bloqueia PRs** neste momento — atua apenas como ferramenta de feedback.

---

## Estratégia de Análise

### Escopo
- Apenas **diff** (não é analisado o arquivo completo)
- Não há limite de tamanho ou quantidade de arquivos
- Toda alteração deve ser analisada

### Linguagens
- O plugin é **agnóstico**
- A(s) linguagem(ns) utilizadas no projeto devem ser configuradas via arquivo `.yml`
- Linguagens iniciais mais comuns:
  - C#
  - Angular (TypeScript)

---

## Configuração Geral

Toda a configuração do zava-review é feita via um arquivo `.yml` presente no projeto ou pipeline.

### Exemplo de responsabilidades do arquivo `.yml`:

- Linguagens utilizadas no projeto
- Regras padrão de análise (booleanas)
- Caminho para documentação do projeto (`.md`)
- Caminho para padrões de arquitetura e código (`.md`)
- Flags de boas práticas
- Prompt customizado para regras específicas
- Provedor de IA selecionado

### Exemplo conceitual:
```yml
language:
  - csharp
  - angular

rules:
  cleanCode: true
  solid: true
  performance: true
  security: true

documentation:
  project: docs/project.md
  architecture: docs/architecture.md

ai:
  provider: openai
  model: gpt-4.1

customPrompt: |
  Avalie se o código segue padrões DDD e evite lógica no controller.
````

---

## Provedores de IA

O zava-review é **multi-IA**, permitindo alternar provedores sem alterar o core da aplicação.

Provedores previstos:

* OpenAI
* Gemini
* Claude
* Outros (via adaptação do adapter de IA)

Cada provedor deve implementar um **contrato comum** para:

* Envio de prompt
* Recebimento de resposta
* Tratamento de erros

---

## Formato de Saída da Análise

### Estrutura Padrão

#### Para arquivos `.md` (VSCode):

* Summary
* Arquivos analisados
* Comentários organizados por arquivo
* Severidade:

  * Info
  * Warning
  * Critical
* Sugestões práticas e objetivas

#### Para PRs:

* Comentários **inline**
* Texto curto e direto
* Referência explícita à regra violada ou boa prática sugerida

---

## Regras de Análise

### Regras Padrão (Booleanas)

* Clean Code
* SOLID
* Performance
* Segurança
* Legibilidade
* Manutenibilidade

### Regras Customizadas

* Definidas via prompt livre no `.yml`
* Permite adaptar o comportamento da IA à realidade do projeto

---

## Segurança

* Chaves de IA **não devem** ser commitadas
* VSCode utiliza armazenamento seguro nativo
* Pipelines utilizam secrets do provedor (Azure/GitHub)

---

## Extensibilidade Futura (Não Escopo Atual)

* Integração com SonarQube
* Rulesets por linguagem
* Cache de análise por commit
* Bloqueio de PR baseado em severidade
* Relatórios históricos
* Dashboard de métricas

---

## Objetivo do Projeto

O zava-review busca ser:

* Simples de configurar
* Poderoso na análise
* Flexível na integração
* Agnóstico de linguagem e plataforma
* Um copiloto real de code review, não apenas um linter