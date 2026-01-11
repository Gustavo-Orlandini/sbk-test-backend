import { ApiProperty, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

@ApiExtraModels()
export class CursorPaginatedResponseDto<T> {
    @ApiProperty({
        description: 'Lista de itens',
        isArray: true,
    })
    items: T[];

    @ApiProperty({
        description: 'Token de paginação para próxima página',
        nullable: true,
        example: 'eyJpZCI6IjAwMDAwMDEtMjMuMjAyMy44LjI2LjAxMDAifQ==',
    })
    nextCursor: string | null;

    constructor(items: T[], nextCursor: string | null) {
        this.items = items;
        this.nextCursor = nextCursor;
    }
}