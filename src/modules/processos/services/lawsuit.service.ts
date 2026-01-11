import { Injectable } from '@nestjs/common';
import { LawsuitRepository } from '../repositories/lawsuit.repository';
import { LawsuitMapper } from '../mappers/lawsuit.mapper';
import { LawsuitSummaryDto } from '../dto/lawsuit-summary.dto';
import { LawsuitDetailDto } from '../dto/lawsuit-detail.dto';
import { NotFoundError } from 'src/shared/errors/api-error';
import { CursorPaginatedResponseDto } from 'src/shared/pagination/cursor-paginated-response.dto';
import { GetLawsuitsQueryDto } from '../dto/get-lawsuits-query.dto';

@Injectable()
export class LawsuitService {
    constructor(private readonly lawsuitRepository: LawsuitRepository) { }

    async findAll(query: GetLawsuitsQueryDto): Promise<CursorPaginatedResponseDto<LawsuitSummaryDto>> {
        const { q, tribunal, grau, cursor, limit = 20 } = query;

        // Search lawsuits
        const lawsuitsRaw = this.lawsuitRepository.search(q, tribunal, grau);

        // Paginate
        const { items, nextCursor } = this.lawsuitRepository.paginate(
            lawsuitsRaw,
            cursor,
            limit,
        );

        // Map to DTOs
        const itemsDto = items.map((l) => LawsuitMapper.toSummary(l));

        return new CursorPaginatedResponseDto(itemsDto, nextCursor);
    }

    async findByCaseNumber(numeroProcesso: string): Promise<LawsuitDetailDto> {
        const lawsuit = this.lawsuitRepository.findByCaseNumber(numeroProcesso);

        if (!lawsuit) {
            throw new NotFoundError(`Lawsuit with number ${numeroProcesso} not found`);
        }

        return LawsuitMapper.toDetail(lawsuit);
    }
}