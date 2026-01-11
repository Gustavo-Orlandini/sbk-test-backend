import { ProceedingRaw } from '../interfaces/lawsuit-raw.interface';

/**
 * Class responsible for selecting the current proceeding of a lawsuit
 * following a deterministic rule.
 *
 * SELECTION RULE:
 * 1. Prioritize proceedings with active === true
 * 2. Among them, select the one with the most recent lastMovement.dataHora
 * 3. In case of a tie, prioritize the highest degree (G2 > G1)
 * 4. As fallback, use the first available proceeding
 */
export class ProceedingSelector {
    static selectCurrentProceeding(proceedings: ProceedingRaw[]): ProceedingRaw {
        if (!proceedings || proceedings.length === 0) {
            throw new Error('Empty proceedings list');
        }

        // Filter only active proceedings
        const activeProceedings = proceedings.filter((p) => p.ativo === true);

        // If there are no active proceedings, use fallback
        if (activeProceedings.length === 0) {
            return proceedings[0];
        }

        // Sort active proceedings
        const sorted = [...activeProceedings].sort((a, b) => {
            // Compare last movement date (most recent first)
            const dateA = this.getLastMovementDate(a);
            const dateB = this.getLastMovementDate(b);

            if (dateA && dateB) {
                const diff = new Date(dateB).getTime() - new Date(dateA).getTime();
                if (diff !== 0) {
                    return diff;
                }
            } else if (dateA && !dateB) {
                return -1; // A has date, B doesn't - A comes first
            } else if (!dateA && dateB) {
                return 1; // B has date, A doesn't - B comes first
            }

            // In case of tie on date, compare degree (G2 > G1)
            const degreeA = this.extractDegree(a.grau);
            const degreeB = this.extractDegree(b.grau);
            return degreeB - degreeA;
        });

        return sorted[0];
    }

    private static getLastMovementDate(proceeding: ProceedingRaw): string | null {
        return proceeding.ultimoMovimento?.dataHora || null;
    }

    private static extractDegree(grau: string | { sigla?: string; numero?: number }): number {
        // If grau is an object (real JSON structure)
        if (typeof grau === 'object' && grau !== null) {
            if (grau.numero !== undefined) {
                return grau.numero;
            }
            if (grau.sigla) {
                const match = grau.sigla.match(/G(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            }
            return 0;
        }
        // If grau is a string (test compatibility)
        if (typeof grau === 'string') {
            const match = grau.match(/G(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        }
        return 0;
    }
}