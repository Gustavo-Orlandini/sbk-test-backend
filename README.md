# SBK Test Backend - API REST de Processos Jurídicos

API REST desenvolvida em NestJS para consulta de processos jurídicos. A API **nunca retorna o JSON bruto de entrada**, mas sim **DTOs normalizados e simplificados**, pensados para consumo por frontend/UI.

> ⚠️ **IMPORTANTE**: O arquivo JSON (`data/itau.json`) é **apenas uma fonte de dados interna (raw input)**. Os endpoints retornam estruturas completamente diferentes, derivadas através de uma **camada de mapeamento (Raw → DTO)**.

## 🏗️ Arquitetura

O projeto segue os princípios de **API First**, com separação clara de responsabilidades:

```
src/
├── modules/
│   └── processos/
│       ├── controllers/      → Expõe endpoints que retornam DTOs
│       ├── services/         → Lógica de negócio
│       ├── repositories/     → Acesso aos dados raw (JSON)
│       ├── dto/             → Contratos de resposta da API (DTOs)
│       ├── mappers/         → Transformação Raw → DTO (camada crítica)
│       ├── rules/           → Regras de negócio (ex: seleção de tramitação)
│       └── processos.module.ts
├── shared/
│   ├── errors/
│   ├── pagination/
│   └── utils/
└── main.ts
```

### 🔄 Fluxo de Dados: Raw → DTO

```
JSON Raw (itau.json)
    ↓
Repository (carrega raw)
    ↓
Service (aplica regras de negócio)
    ↓
Mapper (transforma Raw → DTO) ← CAMADA CRÍTICA
    ↓
DTO Normalizado (response da API)
    ↓
Frontend/UI
```

**Princípios aplicados:**
- ✅ **Nunca expor o JSON bruto**: Todas as respostas passam pela camada de mapeamento
- ✅ **DTOs explícitos**: Cada endpoint tem DTOs definidos com `@ApiProperty`
- ✅ **Simplificação**: Arrays profundos, objetos aninhados e campos internos são consolidados
- ✅ **Normalização**: Estruturas complexas do raw são transformadas em formatos simples e diretos

## 📋 Requisitos

- Node.js 18+
- npm ou yarn

## 🚀 Instalação

```bash
npm install
```

## ⚙️ Executando a aplicação

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

A aplicação estará disponível em `http://localhost:3000`  
A documentação Swagger estará disponível em `http://localhost:3000/api/docs`

## 📝 Endpoints

> ⚠️ **ATENÇÃO**: Todos os exemplos abaixo representam **DTOs finais** retornados pela API, **não** a estrutura do JSON de entrada.

### GET /lawsuits

Retorna uma lista paginada de processos no formato **DTO simplificado** (resumo).

**Query Parameters:**
- `q` (opcional): Busca textual simples (numeroProcesso, nome das partes, classe ou assunto)
- `tribunal` (opcional): Sigla do tribunal (ex: TJSP, TJMG)
- `grau` (opcional): Grau do processo (ex: G1, G2)
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
- `tramitacaoAtual` representa **apenas uma tramitação** selecionada pela regra de negócio (ver seção abaixo)
- O raw pode ter múltiplas tramitações, mas a API retorna **somente a atual** (consolidada)
- `partes` são **agregadas** de todas as tramitações e limitadas a 5 representantes por parte
- Campos internos do raw (`idCodex`, `hierarquia`, `outrosNomes`, etc.) **não são expostos**

## 🔍 Regra de Seleção de Tramitação Atual

Como o JSON raw pode conter múltiplas tramitações por processo, a aplicação utiliza uma **regra determinística** para selecionar qual tramitação será exposta no DTO `tramitacaoAtual`:

1. **Prioridade 1**: Selecionar tramitações com `ativo === true`
2. **Prioridade 2**: Entre as ativas, escolher a que possui o `ultimoMovimento.dataHora` mais recente
3. **Prioridade 3**: Em caso de empate na data, priorizar a de maior grau (G2 > G1)
4. **Fallback**: Utilizar a primeira tramitação disponível

Esta regra é implementada na classe `ProceedingSelector` e é aplicada em **TODOS** os endpoints através da camada de mapeamento.

> 💡 **Por que isso é importante?**: A API retorna uma **visão consolidada** do processo, não todas as tramitações do raw. Isso simplifica o consumo pelo frontend.

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

```bash
# Testes unitários
npm run test

# Testes com cobertura
npm run test:cov

# Testes E2E
npm run test:e2e
```

## 📚 Tecnologias

- **NestJS**: Framework Node.js progressivo
- **TypeScript**: Superset do JavaScript
- **Swagger/OpenAPI**: Documentação automática da API (contratos de DTO)
- **class-validator**: Validação de DTOs
- **class-transformer**: Transformação de objetos

## 🔒 Segurança e Boas Práticas

- ✅ Validação de parâmetros de entrada
- ✅ Tratamento de erros padronizado
- ✅ **DTOs explícitos para todas as respostas** (nunca retorna raw)
- ✅ **Separação clara entre raw data e API contract** (camada de mapeamento)
- ✅ Separação de responsabilidades
- ✅ Código tipado e testável
- ✅ **API First**: Contratos definidos antes da implementação

## 📄 Licença

Este projeto foi desenvolvido como parte de um desafio técnico.

---

**Resumo para avaliadores técnicos:**

👉 **Esta API NÃO retorna o JSON original.**  
👉 **Todos os responses são DTOs normalizados e simplificados.**  
👉 **Há uma camada de mapeamento explícita (Raw → DTO) que transforma estruturas complexas em formatos simples para consumo por UI.**  
👉 **Os exemplos de response acima representam DTOs finais, não a estrutura do JSON de entrada.**