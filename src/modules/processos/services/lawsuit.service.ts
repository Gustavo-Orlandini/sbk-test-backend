import { Injectable } from '@nestjs/common';
import { LawsuitRepository } from '../repositories/lawsuit.repository';
import { LawsuitMapper } from '../mappers/lawsuit.mapper';
import { LawsuitSummaryDto } from '../dto/lawsuit-summary.dto';
import { LawsuitDetailDto } from '../dto/lawsuit-detail.dto';
import { NotFoundError } from 'src/shared/errors/api-error';
import { CursorPaginatedResponseDto } from 'src/shared/pagination/cursor-paginated-response.dto';
import { GetLawsuitsQueryDto } from '../dto/get-lawsuits-query.dto';
import { CursorEncoder } from 'src/shared/pagination/cursor-encoder';

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

        // Check if query text matches a degree pattern (G1, G2, G3, etc)
        const degreeFromQuery = this.extractDegreeFromQuery(q);
        const effectiveDegree = grau || degreeFromQuery;

        // If query is a degree pattern, don't use it in text search (will filter by grauAtual instead)
        // This is because text search no longer searches in grau to avoid confusion
        const textQuery = degreeFromQuery ? undefined : q;

        // Search lawsuits using repository (without degree filter - will be applied after mapping)
        const lawsuitsRaw = this.lawsuitRepository.search(textQuery, tribunal, undefined);

        // Map raw data to DTOs first (to get grauAtual)
        let itemsDto = lawsuitsRaw.map((l) => LawsuitMapper.toSummary(l));

        // Apply degree filter on DTOs (filters by grauAtual, not raw tramitacoes)
        // This ensures that if user searches for "g3", only processes with grauAtual="G3" are returned
        if (effectiveDegree) {
            const degreeUpper = effectiveDegree.trim().toUpperCase();
            itemsDto = itemsDto.filter((dto) => {
                return dto.grauAtual?.toUpperCase() === degreeUpper;
            });
        }

        // Paginate results
        const { items, nextCursor } = this.paginateDtos(itemsDto, cursor, limit);

        return new CursorPaginatedResponseDto(items, nextCursor);
    }

    /**
     * Extracts degree pattern from query string (e.g., "g3" -> "G3", "G1" -> "G1")
     * Returns null if query doesn't match a degree pattern
     */
    private extractDegreeFromQuery(query?: string): string | null {
        if (!query) {
            return null;
        }

        const trimmed = query.trim();
        // Match patterns like: g1, G1, g2, G2, g3, G3, etc. (case insensitive)
        const degreeMatch = trimmed.match(/^g(\d+)$/i);
        if (degreeMatch) {
            // Normalize to uppercase (G1, G2, G3, etc)
            return `G${degreeMatch[1]}`;
        }

        return null;
    }

    /**
     * Paginates DTOs using cursor-based pagination
     */
    private paginateDtos<T extends { numeroProcesso: string }>(
        dtos: T[],
        cursor: string | undefined,
        limit: number,
    ): { items: T[]; nextCursor: string | null } {
        const validLimit = Math.max(1, Math.min(limit, 100));
        let startIndex = 0;

        if (cursor) {
            try {
                const decodedCursor = CursorEncoder.decode(cursor);
                const cursorIndex = dtos.findIndex(
                    (dto) => dto.numeroProcesso === decodedCursor,
                );
                startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
            } catch (error) {
                startIndex = 0;
            }
        }

        const endIndex = startIndex + validLimit;
        const items = dtos.slice(startIndex, endIndex);
        const hasNext = endIndex < dtos.length;
        const nextCursor =
            hasNext && items.length > 0
                ? CursorEncoder.encode(items[items.length - 1].numeroProcesso)
                : null;

        return { items, nextCursor };
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