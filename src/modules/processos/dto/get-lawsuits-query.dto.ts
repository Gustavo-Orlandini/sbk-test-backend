import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CursorPaginationQueryDto } from 'src/shared/pagination/cursor-pagination.dto';

export class GetLawsuitsQueryDto extends CursorPaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Simple text search (case number, tribunal acronym, party names, class or subject). If query matches a degree pattern (e.g., "G1", "G2"), filters by grauAtual.',
        example: 'João Silva',
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    q?: string;

    @ApiPropertyOptional({
        description: 'Court acronym',
        example: 'TJSP',
    })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    tribunal?: string;

    @ApiPropertyOptional({
        description: 'Case degree',
        example: 'G1',
    })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    grau?: string;
}