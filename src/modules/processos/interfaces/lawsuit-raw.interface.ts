export interface DegreeRaw {
    sigla: string;
    nome: string;
    numero: number;
}

export interface ClassRaw {
    codigo: number;
    descricao: string;
}

export interface SubjectRaw {
    codigo: number;
    descricao: string;
    hierarquia?: string;
}

export interface CourtRaw {
    id: number;
    nome: string;
}

export interface LastMovementRaw {
    sequencia?: number;
    dataHora: string;
    codigo?: number;
    descricao: string;
    idCodex?: number;
    idMovimentoOrigem?: string;
    idDistribuicaoCodex?: number;
    classe?: ClassRaw;
    orgaoJulgador?: CourtRaw[];
}

export interface ProceedingRaw {
    idCodex?: number;
    dataHoraAjuizamento?: string;
    tribunal?: {
        sigla: string;
        nome: string;
        segmento?: string;
        jtr?: string;
    };
    grau: DegreeRaw;
    liminar?: boolean;
    nivelSigilo?: number;
    valorAcao?: number;
    dataHoraUltimaDistribuicao?: string;
    classe: ClassRaw[];
    assunto: SubjectRaw[];
    ultimoMovimento?: LastMovementRaw;
    partes?: PartyRaw[];
    ativo: boolean;
    orgaoJulgador?: CourtRaw;
    idFonteDadosCodex?: number;
    permitePeticionar?: boolean;
}

export interface RepresentativeRaw {
    tipoRepresentacao: string;
    nome: string;
    situacao?: string;
}

export interface PartyRaw {
    polo: 'ATIVO' | 'PASSIVO' | 'OUTROS_PARTICIPANTES';
    tipoParte: string;
    nome: string;
    outrosNomes?: Array<{ nome: string; tipo: string }>;
    tipoPessoa?: string;
    documentosPrincipais?: Array<{ numero: string; tipo: string }>;
    sigilosa?: boolean;
    representantes?: RepresentativeRaw[];
}

export interface LawsuitRaw {
    numeroProcesso: string;
    nivelSigilo: number;
    idCodexTribunal?: number;
    siglaTribunal: string;
    tramitacoes: ProceedingRaw[];
}

export interface LawsuitsDataRaw {
    content: LawsuitRaw[];
}