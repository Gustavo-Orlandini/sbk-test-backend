# SBK Test Backend - API REST de Processos Jurídicos

API REST desenvolvida em NestJS para consulta de processos jurídicos. A API **nunca retorna o JSON bruto de entrada**, mas sim **DTOs normalizados e simplificados**, pensados para consumo por frontend/UI.

> ⚠️ **IMPORTANTE**: O arquivo JSON (`data/itau.json`) é **apenas uma fonte de dados interna (raw input)**. Os endpoints retornam estruturas completamente diferentes, derivadas através de uma **camada de mapeamento (Raw → DTO)**.

## 📋 Requisitos

- **Node.js**: 18 ou superior
- **npm**: 9+ ou **yarn**: 1.22+
- **Sistema Operacional**: Windows, Linux ou macOS

## 🚀 Como Rodar o Projeto Localmente

### 1. Instalação das Dependências

```bash
npm install
```

### 2. Executar em Modo Desenvolvimento

```bash
npm run start:dev
```

A aplicação estará disponível em:
- **API**: `http://localhost:3000`
- **Swagger/OpenAPI Docs**: `http://localhost:3000/api/docs`

### 3. Executar em Modo Produção

```bash
# Compilar o projeto
npm run build

# Executar versão compilada
npm run start:prod
```

### 4. Executar Testes

```bash
# Testes unitários
npm test

# Testes em modo watch (re-executa ao salvar arquivos)
npm run test:watch

# Testes com cobertura de código
npm run test:cov

# Testes E2E (end-to-end)
npm run test:e2e
```

### 5. Outros Comandos Úteis

```bash
# Formatar código
npm run format

# Verificar e corrigir problemas de lint
npm run lint

# Debug dos testes
npm run test:debug
```

## 🏗️ Arquitetura

O projeto segue os princípios de **API First**, com separação clara de responsabilidades:

```
src/
├── app.module.ts            → Módulo raiz da aplicação
├── main.ts                  → Bootstrap da aplicação (configuração global)
├── modules/
│   └── processos/
│       ├── controllers/      → Expõe endpoints que retornam DTOs
│       │   └── lawsuit.controller.ts
│       ├── services/         → Lógica de negócio
│       │   └── lawsuit.service.ts
│       ├── repositories/     → Acesso aos dados raw (JSON)
│       │   └── lawsuit.repository.ts
│       ├── dto/             → Contratos de resposta da API (DTOs)
│       │   ├── get-lawsuits-query.dto.ts
│       │   ├── lawsuit-detail.dto.ts
│       │   └── lawsuit-summary.dto.ts
│       ├── interfaces/      → Interfaces TypeScript para dados raw
│       │   └── lawsuit-raw.interface.ts
│       ├── mappers/         → Transformação Raw → DTO (camada crítica)
│       │   └── lawsuit.mapper.ts
│       ├── rules/           → Regras de negócio (ex: seleção de tramitação)
│       │   ├── proceeding-selector.ts
│       │   └── proceeding-selector.spec.ts
│       └── processos.module.ts
└── shared/
    ├── errors/              → Tratamento padronizado de erros
    │   ├── api-error.ts
    │   └── http-exception.filter.ts
    ├── pagination/          → Paginação baseada em cursor
    │   ├── cursor-encoder.ts
    │   ├── cursor-pagination.dto.ts
    │   └── cursor-paginated-response.dto.ts
    └── utils/               → Utilitários
        └── json-loader.ts
```

### 🎯 Arquitetura em Camadas (Layered Architecture)

A arquitetura escolhida segue o padrão **Layered Architecture** (também conhecido como **Clean Architecture**), organizando o código em camadas bem definidas com responsabilidades específicas:

#### **Camada 1: Controllers (Apresentação)**
- **Responsabilidade**: Receber requisições HTTP, validar entrada, delegar para Service, retornar respostas
- **Localização**: `controllers/lawsuit.controller.ts`
- **Características**:
  - Anotações do NestJS (`@Controller`, `@Get`, `@Param`, `@Query`)
  - Documentação Swagger (`@ApiTags`, `@ApiOperation`, `@ApiResponse`)
  - **Não contém lógica de negócio** - apenas orquestração

#### **Camada 2: Services (Lógica de Negócio)**
- **Responsabilidade**: Orquestrar fluxo, aplicar regras de negócio, coordenar Repository e Mapper
- **Localização**: `services/lawsuit.service.ts`
- **Características**:
  - Lógica de aplicação (filtros, paginação, validações)
  - Coordena Repository e Mapper
  - Aplica filtros que dependem de dados já mapeados (ex: filtro por `grauAtual`)

#### **Camada 3: Repositories (Acesso a Dados)**
- **Responsabilidade**: Isolar acesso aos dados raw (JSON), fornecer métodos de busca e filtragem
- **Localização**: `repositories/lawsuit.repository.ts`
- **Características**:
  - Carrega JSON uma única vez na inicialização (`OnModuleInit`)
  - Fornece métodos de busca e filtragem em dados raw
  - **Não conhece DTOs** - trabalha apenas com interfaces raw

#### **Camada 4: Mappers (Transformação)**
- **Responsabilidade**: Transformar dados raw em DTOs normalizados
- **Localização**: `mappers/lawsuit.mapper.ts`
- **Características**:
  - Métodos estáticos puros (sem estado)
  - Transforma estruturas complexas em simples
  - Aplica regras de consolidação (ex: seleção de tramitação atual)

#### **Camada 5: Rules (Regras de Negócio Isoladas)**
- **Responsabilidade**: Regras complexas e determinísticas isoladas em classes dedicadas
- **Localização**: `rules/proceeding-selector.ts`
- **Características**:
  - Regra de seleção de tramitação atual
  - Fácil de testar isoladamente
  - Reutilizável em diferentes contextos

#### **Camada 6: DTOs (Contratos da API)**
- **Responsabilidade**: Definir estrutura de dados de entrada e saída da API
- **Localização**: `dto/*.dto.ts`
- **Características**:
  - Anotados com `@ApiProperty` para Swagger
  - Validação com `class-validator`
  - Contrato explícito entre API e Frontend

#### **Camada 7: Interfaces (Tipos Raw)**
- **Responsabilidade**: Definir tipos TypeScript para estrutura do JSON raw
- **Localização**: `interfaces/lawsuit-raw.interface.ts`
- **Características**:
  - Representam exatamente a estrutura do JSON de entrada
  - Usadas apenas internamente (nunca expostas na API)

#### **Camada Shared (Compartilhada)**
- **Responsabilidade**: Funcionalidades compartilhadas entre módulos
- **Localização**: `shared/`
- **Componentes**:
  - `errors/`: Tratamento padronizado de erros
  - `pagination/`: Implementação de paginação baseada em cursor
  - `utils/`: Utilitários genéricos (ex: JsonLoader)

### 🔄 Fluxo de Dados: Raw → DTO

```
┌─────────────────────────────────────────────────────────────┐
│                    Requisição HTTP                           │
│            GET /lawsuits?q=João&tribunal=TJSP                │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  CONTROLLER (lawsuit.controller.ts)                         │
│  • Recebe requisição HTTP                                    │
│  • Valida parâmetros (via ValidationPipe)                    │
│  • Delega para Service                                       │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  SERVICE (lawsuit.service.ts)                               │
│  • Aplica lógica de negócio                                  │
│  • Chama Repository para buscar dados raw                    │
│  • Coordena Mapper para transformar Raw → DTO                │
│  • Aplica filtros que dependem de DTOs (ex: grauAtual)       │
│  • Aplica paginação                                          │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  REPOSITORY (lawsuit.repository.ts)                         │
│  • Busca dados raw do JSON (já em memória)                  │
│  • Aplica filtros básicos (texto, tribunal)                  │
│  • Retorna array de LawsuitRaw[]                             │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  MAPPER (lawsuit.mapper.ts) ← CAMADA CRÍTICA               │
│  • Usa ProceedingSelector para escolher tramitação atual    │
│  • Transforma objetos aninhados → strings                    │
│  • Consolida múltiplas tramitações → uma única               │
│  • Agrega partes de todas as tramitações                     │
│  • Limita representantes (5 por parte)                       │
│  • Normaliza valores nulos                                   │
│  • Retorna LawsuitSummaryDto                                 │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  SERVICE (continua)                                          │
│  • Filtra DTOs por grauAtual (se necessário)                 │
│  • Aplica paginação                                          │
│  • Retorna CursorPaginatedResponseDto                        │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  CONTROLLER (continua)                                       │
│  • Retorna resposta HTTP (DTO serializado)                   │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    Resposta HTTP (JSON)                      │
│            { items: [...], nextCursor: "..." }               │
└─────────────────────────────────────────────────────────────┘
```

### ✅ Por que esta Arquitetura?

#### **1. Separação de Responsabilidades (SRP)**
Cada camada tem uma única responsabilidade bem definida:
- **Controller**: HTTP/API
- **Service**: Lógica de negócio
- **Repository**: Acesso a dados
- **Mapper**: Transformação de dados

#### **2. Testabilidade**
- Camadas podem ser testadas isoladamente
- Fácil criar mocks/stubs para testes
- Regras de negócio isoladas são facilmente testáveis

#### **3. Manutenibilidade**
- Mudanças em uma camada não afetam outras
- Código organizado e fácil de navegar
- Fácil adicionar novos recursos

#### **4. Reutilização**
- Mapper pode ser usado em diferentes contextos
- Regras isoladas são reutilizáveis
- Componentes compartilhados em `shared/`

#### **5. Flexibilidade**
- Fácil trocar fonte de dados (trocar Repository)
- Fácil mudar formato de resposta (trocar Mapper)
- Fácil adicionar novos endpoints (usar Service existente)

#### **6. API First**
- DTOs definem contrato da API antes da implementação
- Swagger gerado automaticamente dos DTOs
- Contrato claro para integração com frontend

### 🔒 Princípios Aplicados

- ✅ **Nunca expor o JSON bruto**: Todas as respostas passam pela camada de mapeamento
- ✅ **DTOs explícitos**: Cada endpoint tem DTOs definidos com `@ApiProperty` do Swagger
- ✅ **Simplificação**: Arrays profundos, objetos aninhados e campos internos são consolidados
- ✅ **Normalização**: Estruturas complexas do raw são transformadas em formatos simples e diretos
- ✅ **Valores padronizados**: Campos opcionais ausentes retornam `null` (não strings vazias)
- ✅ **Dependency Injection**: NestJS gerencia dependências automaticamente
- ✅ **Single Responsibility**: Cada classe tem uma única responsabilidade
- ✅ **Open/Closed Principle**: Fácil estender sem modificar código existente

## 🔍 Regra de Seleção de Tramitação Atual

Como o JSON raw pode conter múltiplas tramitações por processo, a aplicação utiliza uma **regra determinística e documentada** para selecionar qual tramitação será exposta no DTO `tramitacaoAtual`:

### Regra Implementada:

1. **Prioridade 1**: Selecionar tramitações com `ativo === true`
2. **Prioridade 2**: Entre as ativas, escolher a que possui o **maior `dataHoraUltimaDistribuicao`** (mais recente)
3. **Prioridade 3**: Em caso de empate na data, priorizar a de **maior `grau.numero`** (G2 > G1 > SUP)
4. **Fallback**: Utilizar a primeira tramitação disponível (se não houver ativas)

Esta regra é implementada na classe `ProceedingSelector` (`src/modules/processos/rules/proceeding-selector.ts`) e é aplicada em **TODOS** os endpoints através da camada de mapeamento.

> 💡 **Por que isso é importante?**: A API retorna uma **visão consolidada** do processo, não todas as tramitações do raw. Isso simplifica o consumo pelo frontend e garante consistência entre endpoints.

> 📝 **Nota**: A regra usa `dataHoraUltimaDistribuicao` (campo da tramitação), não `ultimoMovimento.dataHora`, conforme especificação obrigatória do desafio técnico.

## 📝 Contrato da API

### GET /lawsuits

Retorna uma lista paginada de processos no formato **DTO simplificado** (resumo).

**Query Parameters:**
- `q` (opcional): Busca textual simples (numeroProcesso, siglaTribunal, nome das partes, classe ou assunto). Se o texto corresponder a um padrão de grau (ex: "g3"), filtra por `grauAtual`.
- `tribunal` (opcional): Sigla do tribunal (ex: TJSP, TJMG) - filtro exato
- `grau` (opcional): Grau do processo (ex: G1, G2, SUP) - filtra por `grauAtual`
- `limit` (opcional): Número de itens por página (default: 20, máximo: 100)
- `cursor` (opcional): Token de paginação baseada em cursor

**Response (DTO `LawsuitSummaryDto`):**
```json
{
  "items": [
    {
      "numeroProcesso": "0000001-23.2023.8.26.0100",
      "siglaTribunal": "TJSP",
      "grauAtual": "G1",
      "classePrincipal": "Procedimento Comum Cível",
      "assuntoPrincipal": "Cobrança",
      "ultimoMovimento": {
        "dataHora": "2023-12-15T10:30:00Z",
        "descricao": "Julgamento realizado",
        "orgaoJulgador": "1ª Vara Cível"
      },
      "partesResumo": {
        "ativo": ["João Silva", "Maria Santos"],
        "passivo": ["Empresa XYZ Ltda"]
      }
    }
  ],
  "nextCursor": "eyJpZCI6IjAwMDAwMDEtMjMuMjAyMy44LjI2LjAxMDAifQ=="
}
```

**Notas sobre o DTO:**
- `partesResumo` é uma **consolidação**: múltiplas tramitações e partes do raw são unificadas
- `grauAtual` e `classePrincipal` são **extraídos** usando a regra de seleção de tramitação atual
- Estrutura **simplificada** para consumo direto por UI
- Campos opcionais ausentes retornam `null` (não strings vazias)

### GET /lawsuits/:caseNumber

Retorna os dados detalhados de um processo no formato **DTO normalizado**.

**Path Parameters:**
- `caseNumber`: Número do processo (ex: 0000001-23.2023.8.26.0100)

**Response (DTO `LawsuitDetailDto`):**
```json
{
  "numeroProcesso": "0000001-23.2023.8.26.0100",
  "siglaTribunal": "TJSP",
  "nivelSigilo": 0,
  "tramitacaoAtual": {
    "grau": "G1",
    "orgaoJulgador": "1ª Vara Cível",
    "classes": ["Procedimento Comum Cível"],
    "assuntos": ["Cobrança"],
    "dataDistribuicao": "2023-01-15T08:00:00Z",
    "dataAutuacao": "2023-01-15T08:00:00Z"
  },
  "partes": [
    {
      "nome": "João Silva",
      "polo": "ativo",
      "tipoParte": "pessoa_fisica",
      "representantes": [
        {
          "nome": "Advogado ABC",
          "tipo": "advogado"
        }
      ]
    }
  ],
  "ultimoMovimento": {
    "data": "2023-12-15T10:30:00Z",
    "descricao": "Julgamento realizado",
    "orgaoJulgador": "1ª Vara Cível",
    "codigo": "123"
  }
}
```

**Notas sobre o DTO:**
- `tramitacaoAtual` representa **apenas uma tramitação** selecionada pela regra de negócio
- O raw pode ter múltiplas tramitações, mas a API retorna **somente a atual** (consolidada)
- `partes` são **agregadas** de todas as tramitações e limitadas a 5 representantes por parte
- Campos internos do raw (`idCodex`, `hierarquia`, `outrosNomes`, etc.) **não são expostos**
- Campo `codigo` do último movimento retorna `null` quando não disponível

### Formato de Erro Padronizado

Todos os erros retornam o formato:
```json
{
  "code": "NOT_FOUND",
  "message": "Lawsuit with number 0000000-00.0000.0.00.0000 not found"
}
```

Códigos de erro comuns:
- `NOT_FOUND` (404): Recurso não encontrado
- `BAD_REQUEST` (400): Requisição inválida (validação)
- `INTERNAL_SERVER_ERROR` (500): Erro interno do servidor

## 🎯 Decisões Técnicas Tomadas

### 1. **API First com Swagger**
- **Decisão**: Swagger/OpenAPI como fonte da verdade para contratos de API
- **Justificativa**: Garante documentação sempre atualizada e facilita integração com frontend
- **Implementação**: Todos os DTOs usam decoradores `@ApiProperty` do `@nestjs/swagger`

### 2. **Paginação Baseada em Cursor**
- **Decisão**: Cursor-based pagination ao invés de offset-based
- **Justificativa**: Mais eficiente para grandes volumes de dados e evita problemas de inconsistência
- **Implementação**: Token base64 com `numeroProcesso` como chave

### 3. **Carregamento Único do JSON na Inicialização**
- **Decisão**: JSON carregado uma única vez no `onModuleInit` do Repository
- **Justificativa**: Melhor performance (não lê arquivo a cada requisição) e simula comportamento de banco de dados
- **Implementação**: `LawsuitRepository` implementa `OnModuleInit` e mantém dados em memória

### 4. **Camada de Mapeamento Explícita (Raw → DTO)**
- **Decisão**: Mapper dedicado (`LawsuitMapper`) para transformação
- **Justificativa**: Separação clara entre dados raw e contrato da API, facilita manutenção
- **Implementação**: Métodos estáticos `toSummary()` e `toDetail()` com helpers privados

### 5. **Regra de Negócio Isolada**
- **Decisão**: Classe `ProceedingSelector` isolada para seleção de tramitação atual
- **Justificativa**: Regra complexa e determinística, facilita testes e manutenção
- **Implementação**: Método estático `selectCurrentProceeding()` com regra documentada

### 6. **Validação com class-validator**
- **Decisão**: Validação de DTOs usando decoradores `@IsOptional`, `@IsString`, `@Min`, `@Max`
- **Justificativa**: Validação declarativa, integrada ao NestJS, com mensagens de erro padronizadas
- **Implementação**: `ValidationPipe` global configurado em `main.ts`

### 7. **Tratamento de Erros Padronizado**
- **Decisão**: `HttpExceptionFilter` global para formatar todos os erros
- **Justificativa**: Respostas de erro consistentes (`{ code, message }`) facilitam tratamento no frontend
- **Implementação**: Filter global que captura todas as exceções e formata resposta

### 8. **CORS Habilitado**
- **Decisão**: CORS habilitado globalmente para permitir requisições do frontend
- **Justificativa**: Necessário para desenvolvimento e integração com frontend em domínios diferentes
- **Implementação**: `app.enableCors()` em `main.ts`

### 9. **Padronização de Valores Nulos**
- **Decisão**: Campos opcionais ausentes retornam `null` (não strings vazias ou `undefined`)
- **Justificativa**: Contrato de API mais claro e previsível para o frontend
- **Implementação**: Mapper sempre retorna `null` para campos opcionais ausentes

### 10. **Filtro de Grau Aplicado Após Mapeamento**
- **Decisão**: Filtro por `grau` aplicado no DTO (após mapeamento), não no raw
- **Justificativa**: Garante que filtra pelo `grauAtual` (tramitação selecionada), não por tramitações raw
- **Implementação**: Filtro aplicado no Service após `LawsuitMapper.toSummary()`

## ⚖️ Trade-offs e Simplificações

### 1. **Sem Banco de Dados**
- **Trade-off**: Dados em memória (JSON carregado uma vez)
- **Simplificação**: Não há persistência, migrações ou queries complexas
- **Impacto**: Adequado para desafio técnico, mas não escalável para produção real

### 2. **Sem Autenticação/Autorização**
- **Trade-off**: API pública sem controle de acesso
- **Simplificação**: Foco na lógica de negócio e design de API
- **Impacto**: Adequado para desafio, mas produção precisaria de autenticação

### 3. **Busca Textual Simples (não full-text search)**
- **Trade-off**: Busca case-insensitive com `includes()` em strings
- **Simplificação**: Não usa Elasticsearch, Solr ou índices complexos
- **Impacto**: Funciona bem para volumes pequenos/médios, mas pode ser lento em grandes volumes

### 4. **Paginação em Memória**
- **Trade-off**: Todos os dados carregados, paginação feita em array
- **Simplificação**: Não há queries SQL com LIMIT/OFFSET
- **Impacto**: Adequado para desafio, mas não escalável para milhões de registros

### 5. **Limite de Representantes (5 por parte)**
- **Trade-off**: Não retorna todos os representantes
- **Simplificação**: Evita respostas muito grandes e mantém foco nos principais
- **Impacto**: Pode não atender casos onde todos os representantes são necessários

### 6. **Uma Única Tramitação no DTO**
- **Trade-off**: API retorna apenas `tramitacaoAtual`, não todas as tramitações
- **Simplificação**: Frontend recebe dados já consolidados, não precisa escolher
- **Impacto**: Se frontend precisar de histórico completo, precisaria endpoint adicional

### 7. **Sem Cache**
- **Trade-off**: Cada requisição processa dados do zero
- **Simplificação**: Não há complexidade de invalidação de cache
- **Impacto**: Adequado para desafio, mas produção se beneficiaria de cache (Redis, etc.)

### 8. **Filtro de Grau na Busca Textual**
- **Trade-off**: Quando `q` corresponde a padrão de grau (ex: "g3"), aplica filtro por `grauAtual`
- **Simplificação**: Usuário pode buscar por grau usando `q` ou `grau`
- **Impacto**: Pode ser confuso se usuário espera busca textual literal, mas melhora UX

## 🗂️ Fonte de Dados (JSON Raw - Apenas Referência)

> ⚠️ **LEIA COM ATENÇÃO**: A seção abaixo descreve o **formato do arquivo JSON de entrada** (`data/itau.json`), que é **diferente** do formato retornado pela API. Este JSON é uma **fonte de dados interna** e **nunca é exposto diretamente**.

O arquivo JSON de processos está localizado em `data/itau.json` e possui uma estrutura complexa com múltiplas tramitações, objetos aninhados e metadados internos:

```json
{
  "content": [
    {
      "numeroProcesso": "string",
      "siglaTribunal": "string",
      "nivelSigilo": 0,
      "tramitacoes": [
        {
          "grau": { "sigla": "G1", "nome": "1° Grau", "numero": 1 },
          "orgaoJulgador": { "id": 123, "nome": "1ª Vara Cível" },
          "ativo": true,
          "classe": [{ "codigo": 7, "descricao": "Procedimento Comum Cível" }],
          "assunto": [{ "codigo": 11806, "descricao": "Cobrança", "hierarquia": "..." }],
          "dataHoraUltimaDistribuicao": "ISO8601",
          "dataHoraAjuizamento": "ISO8601",
          "ultimoMovimento": {
            "dataHora": "ISO8601",
            "descricao": "string",
            "orgaoJulgador": [{ "id": 123, "nome": "..." }],
            "codigo": 92,
            "idCodex": 123456,
            ...
          },
          "partes": [
            {
              "nome": "string",
              "polo": "ATIVO",
              "tipoParte": "string",
              "outrosNomes": [...],
              "documentosPrincipais": [...],
              "representantes": [...],
              ...
            }
          ],
          ...
        }
      ]
    }
  ]
}
```

**Graus encontrados no JSON:**
- **G1**: 103 ocorrências
- **G2**: 35 ocorrências
- **SUP**: 5 ocorrências

**Diferenças entre Raw e DTO:**
- ❌ Raw tem **objetos aninhados** (`grau`, `orgaoJulgador` são objetos) → DTO tem **strings simples**
- ❌ Raw tem **arrays de objetos** (`classe`, `assunto` são arrays de objetos) → DTO tem **arrays de strings**
- ❌ Raw tem **múltiplas tramitações** → DTO retorna **apenas uma tramitação atual** (consolidada)
- ❌ Raw tem **campos internos** (`idCodex`, `hierarquia`, `outrosNomes`, etc.) → DTO **não expõe** esses campos
- ❌ Raw tem **estrutura profunda** → DTO é **simplificado** e pensado para UI

**Este JSON é processado pela camada `LawsuitMapper`, que transforma Raw → DTO antes de retornar ao cliente.**

## 🔄 Camada de Mapeamento (Raw → DTO)

A camada de mapeamento (`LawsuitMapper`) é responsável por:

1. **Transformar estruturas complexas em simples**: Objetos → strings, arrays de objetos → arrays de strings
2. **Consolidar múltiplas tramitações**: Aplicar regra de seleção e retornar apenas `tramitacaoAtual`
3. **Agregar dados**: Coletar partes de todas as tramitações e unificar em uma única lista
4. **Limitar dados**: Representantes limitados a 5 por parte, campos internos removidos
5. **Normalizar formatos**: Garantir estruturas consistentes e previsíveis para o frontend
6. **Padronizar valores nulos**: Campos opcionais ausentes retornam `null`

**Exemplo de transformação:**
```typescript
// Raw (JSON de entrada)
grau: { sigla: "G1", nome: "1° Grau", numero: 1 }
classe: [{ codigo: 7, descricao: "Procedimento Comum Cível" }]

// DTO (Resposta da API)
grau: "G1"
classePrincipal: "Procedimento Comum Cível"
classes: ["Procedimento Comum Cível"]
```

## 🧪 Testes

O projeto possui testes automatizados cobrindo:

### Testes Unitários
- **Localização**: `src/**/*.spec.ts`
- **Cobertura**: Regra de seleção de tramitação (`ProceedingSelector`)
- **Comando**: `npm test`

### Testes E2E (End-to-End)
- **Localização**: `test/app.e2e-spec.ts`
- **Cobertura**: Endpoints da API, validações, filtros, paginação
- **Comando**: `npm run test:e2e`

**Comandos disponíveis:**
```bash
# Testes unitários
npm test

# Testes em modo watch (re-executa ao salvar)
npm run test:watch

# Testes com cobertura de código
npm run test:cov

# Testes E2E
npm run test:e2e

# Debug dos testes
npm run test:debug
```

## 📚 Tecnologias

- **NestJS**: Framework Node.js progressivo para construção de APIs escaláveis
- **TypeScript**: Superset do JavaScript com tipagem estática
- **Swagger/OpenAPI**: Documentação automática da API (contratos de DTO)
- **class-validator**: Validação de DTOs com decoradores
- **class-transformer**: Transformação e serialização de objetos
- **Jest**: Framework de testes para JavaScript/TypeScript
- **Supertest**: Biblioteca para testes HTTP E2E

## 🔒 Segurança e Boas Práticas

- ✅ Validação de parâmetros de entrada com `class-validator`
- ✅ Tratamento de erros padronizado (`{ code, message }`)
- ✅ **DTOs explícitos para todas as respostas** (nunca retorna raw)
- ✅ **Separação clara entre raw data e API contract** (camada de mapeamento)
- ✅ Separação de responsabilidades (Controller → Service → Repository → Mapper)
- ✅ Código tipado e testável
- ✅ **API First**: Contratos definidos antes da implementação
- ✅ CORS habilitado para integração com frontend
- ✅ Valores nulos padronizados (`null` ao invés de `undefined` ou strings vazias)

## 📄 Licença

Este projeto foi desenvolvido como parte de um desafio técnico.

---

**Resumo para avaliadores técnicos:**

👉 **Esta API NÃO retorna o JSON original.**  
👉 **Todos os responses são DTOs normalizados e simplificados.**  
👉 **Há uma camada de mapeamento explícita (Raw → DTO) que transforma estruturas complexas em formatos simples para consumo por UI.**  
👉 **Os exemplos de response acima representam DTOs finais, não a estrutura do JSON de entrada.**  
👉 **Regra de seleção de tramitação atual documentada e implementada conforme especificação obrigatória.**  
👉 **Projeto preparado para testes automatizados (unitários e E2E).**
