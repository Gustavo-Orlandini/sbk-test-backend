import { Injectable, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import { LawsuitRaw, LawsuitsDataRaw } from '../interfaces/lawsuit-raw.interface';
import { JsonLoader } from 'src/shared/utils/json-loader';
import { CursorEncoder } from 'src/shared/pagination/cursor-encoder';

/**
 * Repository responsible for data access layer.
 * Isolates the data source (JSON file) from business logic.
 * Loads data once on module initialization.
 */
@Injectable()
export class LawsuitRepository implements OnModuleInit {
    private lawsuits: LawsuitRaw[] = [];

    onModuleInit() {
        // Load JSON file ONLY ONCE on initialization
        const filePath = path.join(process.cwd(), 'data', 'itau.json');
        const data = JsonLoader.load<LawsuitsDataRaw>(filePath);
        this.lawsuits = data.content || [];
    }

    /**
     * Returns all lawsuits (no filtering)
     */
    findAll(): LawsuitRaw[] {
        return this.lawsuits;
    }

    /**
     * Finds a lawsuit by case number
     */
    findByCaseNumber(numeroProcesso: string): LawsuitRaw | undefined {
        return this.lawsuits.find((l) => l.numeroProcesso === numeroProcesso);
    }

    /**
     * Searches lawsuits with text query and optional filters
     */
    search(query?: string, tribunal?: string, degree?: string): LawsuitRaw[] {
        let filtered = this.lawsuits;

        if (query) {
            filtered = this.applyTextSearch(filtered, query);
        }

        if (tribunal) {
            filtered = this.filterByTribunal(filtered, tribunal);
        }

        if (degree) {
            filtered = this.filterByDegree(filtered, degree);
        }

        return filtered;
    }

    /**
     * Applies text search across case number, party names, classes, and subjects
     */
    private applyTextSearch(lawsuits: LawsuitRaw[], query: string): LawsuitRaw[] {
        const queryLower = query.trim().toLowerCase();
        if (queryLower.length === 0) {
            return lawsuits;
        }

        return lawsuits.filter((lawsuit) => {
            // Search in case number
            if (lawsuit.numeroProcesso.toLowerCase().includes(queryLower)) {
                return true;
            }

            // Search in party names (parties are in proceedings)
            const allParties = lawsuit.tramitacoes.flatMap((p) => p.partes || []);
            const partyNames = allParties.map((party) => party.nome.toLowerCase());
            if (partyNames.some((name) => name.includes(queryLower))) {
                return true;
            }

            // Search in classes and subjects of all proceedings
            const allClasses = this.extractAllClasses(lawsuit.tramitacoes);
            const allSubjects = this.extractAllSubjects(lawsuit.tramitacoes);

            return (
                allClasses.some((c) => c.toLowerCase().includes(queryLower)) ||
                allSubjects.some((s) => s.toLowerCase().includes(queryLower))
            );
        });
    }

    /**
     * Filters lawsuits by tribunal acronym
     */
    private filterByTribunal(lawsuits: LawsuitRaw[], tribunal: string): LawsuitRaw[] {
        const tribunalUpper = tribunal.trim().toUpperCase();
        return lawsuits.filter((l) => l.siglaTribunal.toUpperCase() === tribunalUpper);
    }

    /**
     * Filters lawsuits by degree
     */
    private filterByDegree(lawsuits: LawsuitRaw[], degree: string): LawsuitRaw[] {
        const degreeUpper = degree.trim().toUpperCase();
        return lawsuits.filter((lawsuit) => {
            return lawsuit.tramitacoes.some((p) => {
                const degreeSigla =
                    typeof p.grau === 'object' && p.grau !== null
                        ? p.grau.sigla
                        : p.grau;
                return degreeSigla?.toUpperCase().includes(degreeUpper) || false;
            });
        });
    }

    /**
     * Extracts all class descriptions from proceedings
     */
    private extractAllClasses(proceedings: LawsuitRaw['tramitacoes']): string[] {
        return proceedings.flatMap((p) =>
            (p.classe || []).map((c) => c.descricao).filter(Boolean),
        );
    }

    /**
     * Extracts all subject descriptions from proceedings
     */
    private extractAllSubjects(proceedings: LawsuitRaw['tramitacoes']): string[] {
        return proceedings.flatMap((p) =>
            (p.assunto || []).map((a) => a.descricao).filter(Boolean),
        );
    }

    /**
     * Paginates lawsuits using cursor-based pagination
     */
    paginate(
        lawsuits: LawsuitRaw[],
        cursor: string | undefined,
        limit: number,
    ): { items: LawsuitRaw[]; nextCursor: string | null } {
        const validLimit = Math.max(1, Math.min(limit, 100)); // Enforce limits
        let startIndex = 0;

        if (cursor) {
            try {
                const decodedCursor = CursorEncoder.decode(cursor);
                const cursorIndex = lawsuits.findIndex(
                    (l) => l.numeroProcesso === decodedCursor,
                );
                startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
            } catch (error) {
                // Invalid cursor, start from beginning
                startIndex = 0;
            }
        }

        const endIndex = startIndex + validLimit;
        const items = lawsuits.slice(startIndex, endIndex);
        const hasNext = endIndex < lawsuits.length;
        const nextCursor =
            hasNext && items.length > 0
                ? CursorEncoder.encode(items[items.length - 1].numeroProcesso)
                : null;

        return { items, nextCursor };
    }
}