import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class CursorPaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Token de paginação baseado em cursor',
        example: 'eyJpZCI6IjAwMDAwMDEtMjMuMjAyMy44LjI2LjAxMDAifQ==',
    })
    @IsOptional()
    cursor?: string;

    @ApiPropertyOptional({
        description: 'Número de itens por página',
        minimum: 1,
        maximum: 100,
        default: 20,
        example: 20,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}