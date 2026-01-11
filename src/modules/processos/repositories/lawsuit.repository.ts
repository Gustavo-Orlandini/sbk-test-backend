import { Injectable, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import { LawsuitRaw, LawsuitsDataRaw } from '../interfaces/lawsuit-raw.interface';
import { JsonLoader } from 'src/shared/utils/json-loader';
import { CursorEncoder } from 'src/shared/pagination/cursor-encoder';

@Injectable()
export class LawsuitRepository implements OnModuleInit {
    private lawsuits: LawsuitRaw[] = [];

    onModuleInit() {
        // Load JSON file ONLY ONCE on initialization
        const filePath = path.join(process.cwd(), 'data', 'itau.json');
        const data = JsonLoader.load<LawsuitsDataRaw>(filePath);
        this.lawsuits = data.content || [];
    }

    findAll(): LawsuitRaw[] {
        return this.lawsuits;
    }

    findByCaseNumber(numeroProcesso: string): LawsuitRaw | undefined {
        return this.lawsuits.find((l) => l.numeroProcesso === numeroProcesso);
    }

    search(query?: string, tribunal?: string, degree?: string): LawsuitRaw[] {
        let filtered = this.lawsuits;

        // Text search filter
        if (query) {
            const queryLower = query.toLowerCase();
            filtered = filtered.filter((lawsuit) => {
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
                const allProceedings = lawsuit.tramitacoes || [];
                const allClasses = allProceedings.flatMap((p) =>
                    (p.classe || []).map((c) => c.descricao),
                );
                const allSubjects = allProceedings.flatMap((p) =>
                    (p.assunto || []).map((a) => a.descricao),
                );

                if (
                    allClasses.some((c) => c.toLowerCase().includes(queryLower)) ||
                    allSubjects.some((s) => s.toLowerCase().includes(queryLower))
                ) {
                    return true;
                }

                return false;
            });
        }

        // Filter by tribunal
        if (tribunal) {
            filtered = filtered.filter(
                (l) => l.siglaTribunal.toUpperCase() === tribunal.toUpperCase(),
            );
        }

        // Filter by degree
        if (degree) {
            filtered = filtered.filter((lawsuit) => {
                return lawsuit.tramitacoes.some((p) => {
                    const degreeSigla = typeof p.grau === 'object' ? p.grau.sigla : p.grau;
                    return degreeSigla.toUpperCase().includes(degree.toUpperCase());
                });
            });
        }

        return filtered;
    }

    paginate(
        lawsuits: LawsuitRaw[],
        cursor: string | undefined,
        limit: number,
    ): { items: LawsuitRaw[]; nextCursor: string | null } {
        let startIndex = 0;

        if (cursor) {
            try {
                const decodedCursor = CursorEncoder.decode(cursor);
                startIndex = lawsuits.findIndex((l) => l.numeroProcesso === decodedCursor);
                if (startIndex === -1) {
                    startIndex = 0;
                } else {
                    startIndex += 1; // Start after cursor
                }
            } catch (error) {
                startIndex = 0;
            }
        }

        const endIndex = startIndex + limit;
        const items = lawsuits.slice(startIndex, endIndex);
        const hasNext = endIndex < lawsuits.length;
        const nextCursor =
            hasNext && items.length > 0
                ? CursorEncoder.encode(items[items.length - 1].numeroProcesso)
                : null;

        return { items, nextCursor };
    }
}