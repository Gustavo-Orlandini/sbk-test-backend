import { ApiProperty } from '@nestjs/swagger';

export class LastMovementSummaryDto {
    @ApiProperty({
        description: 'Date and time of last movement',
        example: '2023-12-15T10:30:00Z',
    })
    dataHora: string;

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
}

export class PartiesSummaryDto {
    @ApiProperty({
        description: 'Active party names',
        type: [String],
        example: ['João Silva', 'Maria Santos'],
    })
    ativo: string[];

    @ApiProperty({
        description: 'Passive party names',
        type: [String],
        example: ['Empresa XYZ Ltda'],
    })
    passivo: string[];
}

export class LawsuitSummaryDto {
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
        description: 'Current case degree',
        example: 'G1',
    })
    grauAtual: string;

    @ApiProperty({
        description: 'Main case class',
        example: 'Procedimento Comum Cível',
        nullable: true,
    })
    classePrincipal: string | null;

    @ApiProperty({
        description: 'Main case subject',
        example: 'Cobrança',
        nullable: true,
    })
    assuntoPrincipal: string | null;

    @ApiProperty({
        description: 'Last movement of the case',
        type: LastMovementSummaryDto,
        nullable: true,
    })
    ultimoMovimento: LastMovementSummaryDto | null;

    @ApiProperty({
        description: 'Parties summary',
        type: PartiesSummaryDto,
    })
    partesResumo: PartiesSummaryDto;
}