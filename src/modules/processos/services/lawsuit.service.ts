import { Injectable } from '@nestjs/common';
import { LawsuitRepository } from '../repositories/lawsuit.repository';
import { LawsuitMapper } from '../mappers/lawsuit.mapper';
import { LawsuitSummaryDto } from '../dto/lawsuit-summary.dto';
import { LawsuitDetailDto } from '../dto/lawsuit-detail.dto';
import { NotFoundError } from 'src/shared/errors/api-error';
import { CursorPaginatedResponseDto } from 'src/shared/pagination/cursor-paginated-response.dto';
import { GetLawsuitsQueryDto } from '../dto/get-lawsuits-query.dto';

/**
 * Service responsible for business logic related to lawsuits.
 * Orchestrates repository access and DTO mapping.
 */
@Injectable()
export class LawsuitService {
    constructor(private readonly lawsuitRepository: LawsuitRepository) { }

    /**
     * Returns a paginated list of lawsuits with optional filters
     */
    async findAll(
        query: GetLawsuitsQueryDto,
    ): Promise<CursorPaginatedResponseDto<LawsuitSummaryDto>> {
        const { q, tribunal, grau, cursor, limit = 20 } = query;

        // Search lawsuits using repository
        const lawsuitsRaw = this.lawsuitRepository.search(q, tribunal, grau);

        // Paginate results
        const { items, nextCursor } = this.lawsuitRepository.paginate(
            lawsuitsRaw,
            cursor,
            limit,
        );

        // Map raw data to DTOs
        const itemsDto = items.map((l) => LawsuitMapper.toSummary(l));

        return new CursorPaginatedResponseDto(itemsDto, nextCursor);
    }

    /**
     * Returns detailed information about a specific lawsuit
     * @throws NotFoundError if lawsuit not found
     */
    async findByCaseNumber(numeroProcesso: string): Promise<LawsuitDetailDto> {
        const lawsuit = this.lawsuitRepository.findByCaseNumber(numeroProcesso);

        if (!lawsuit) {
            throw new NotFoundError(
                `Lawsuit with number ${numeroProcesso} not found`,
            );
        }

        return LawsuitMapper.toDetail(lawsuit);
    }
}