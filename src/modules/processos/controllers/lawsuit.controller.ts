import { Controller, Get, Param, Query } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    getSchemaPath,
} from '@nestjs/swagger';
import { LawsuitService } from '../services/lawsuit.service';
import { GetLawsuitsQueryDto } from '../dto/get-lawsuits-query.dto';
import { LawsuitSummaryDto } from '../dto/lawsuit-summary.dto';
import { LawsuitDetailDto } from '../dto/lawsuit-detail.dto';
import { CursorPaginatedResponseDto } from 'src/shared/pagination/cursor-paginated-response.dto';

@ApiTags('lawsuits')
@Controller('lawsuits')
export class LawsuitController {
    constructor(private readonly lawsuitService: LawsuitService) { }

    @Get()
    @ApiOperation({ summary: 'List lawsuits' })
    @ApiResponse({
        status: 200,
        description: 'Paginated list of lawsuits',
        schema: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(LawsuitSummaryDto) },
                },
                nextCursor: {
                    type: 'string',
                    nullable: true,
                    example: 'eyJpZCI6IjAwMDAwMDEtMjMuMjAyMy44LjI2LjAxMDAifQ==',
                },
            },
            required: ['items', 'nextCursor'],
        },
    })
    @ApiQuery({ name: 'q', required: false, type: String })
    @ApiQuery({ name: 'tribunal', required: false, type: String })
    @ApiQuery({ name: 'grau', required: false, type: String })
    @ApiQuery({ name: 'cursor', required: false, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findAll(
        @Query() query: GetLawsuitsQueryDto,
    ): Promise<CursorPaginatedResponseDto<LawsuitSummaryDto>> {
        return this.lawsuitService.findAll(query);
    }

    @Get(':caseNumber')
    @ApiOperation({ summary: 'Get lawsuit details' })
    @ApiParam({
        name: 'caseNumber',
        description: 'Case number',
        example: '0000001-23.2023.8.26.0100',
    })
    @ApiResponse({
        status: 200,
        description: 'Lawsuit details',
        type: LawsuitDetailDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Lawsuit not found',
    })
    async findByCaseNumber(
        @Param('caseNumber') caseNumber: string,
    ): Promise<LawsuitDetailDto> {
        return this.lawsuitService.findByCaseNumber(caseNumber);
    }
}