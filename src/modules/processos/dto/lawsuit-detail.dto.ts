import { ApiProperty } from '@nestjs/swagger';

export class CurrentProceedingDto {
    @ApiProperty({
        description: 'Proceeding degree',
        example: 'G1',
    })
    grau: string;

    @ApiProperty({
        description: 'Judging court',
        example: '1ª Vara Cível',
        nullable: true,
    })
    orgaoJulgador: string | null;

    @ApiProperty({
        description: 'Case classes',
        type: [String],
        example: ['Procedimento Comum Cível'],
    })
    classes: string[];

    @ApiProperty({
        description: 'Case subjects',
        type: [String],
        example: ['Cobrança'],
    })
    assuntos: string[];

    @ApiProperty({
        description: 'Distribution date',
        example: '2023-01-15T08:00:00Z',
        nullable: true,
    })
    dataDistribuicao: string | null;

    @ApiProperty({
        description: 'Filing date',
        example: '2023-01-15T08:00:00Z',
        nullable: true,
    })
    dataAutuacao: string | null;
}

export class RepresentativeDto {
    @ApiProperty({
        description: 'Representative name',
        example: 'Advogado ABC',
    })
    nome: string;

    @ApiProperty({
        description: 'Representative type',
        example: 'advogado',
        nullable: true,
    })
    tipo: string | null;
}

export class PartyDetailDto {
    @ApiProperty({
        description: 'Party name',
        example: 'João Silva',
    })
    nome: string;

    @ApiProperty({
        description: 'Party role (active or passive)',
        example: 'ativo',
        enum: ['ativo', 'passivo'],
    })
    polo: 'ativo' | 'passivo';

    @ApiProperty({
        description: 'Party type',
        example: 'pessoa_fisica',
        nullable: true,
    })
    tipoParte: string | null;

    @ApiProperty({
        description: 'Representatives (limited to 5)',
        type: [RepresentativeDto],
    })
    representantes: RepresentativeDto[];
}

export class LastMovementDetailDto {
    @ApiProperty({
        description: 'Movement date',
        example: '2023-12-15T10:30:00Z',
    })
    data: string;

    @ApiProperty({
        description: 'Movement description',
        example: 'Julgamento realizado',
    })
    descricao: string;

    @ApiProperty({
        description: 'Judging court',
        example: '1ª Vara Cível',
        nullable: true,
    })
    orgaoJulgador: string | null;

    @ApiProperty({
        description: 'Movement code',
        example: '123',
        nullable: true,
    })
    codigo: string | null;
}

export class LawsuitDetailDto {
    @ApiProperty({
        description: 'Case number',
        example: '0000001-23.2023.8.26.0100',
    })
    numeroProcesso: string;

    @ApiProperty({
        description: 'Court acronym',
        example: 'TJSP',
    })
    siglaTribunal: string;

    @ApiProperty({
        description: 'Confidentiality level',
        example: 0,
    })
    nivelSigilo: number;

    @ApiProperty({
        description: 'Current proceeding of the case',
        type: CurrentProceedingDto,
    })
    tramitacaoAtual: CurrentProceedingDto;

    @ApiProperty({
        description: 'Case parties',
        type: [PartyDetailDto],
    })
    partes: PartyDetailDto[];

    @ApiProperty({
        description: 'Last movement of the case',
        type: LastMovementDetailDto,
        nullable: true,
    })
    ultimoMovimento: LastMovementDetailDto | null;
}