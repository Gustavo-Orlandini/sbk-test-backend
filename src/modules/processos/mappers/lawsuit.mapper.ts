import { LawsuitRaw, ProceedingRaw, PartyRaw } from '../interfaces/lawsuit-raw.interface';
import { LawsuitSummaryDto } from '../dto/lawsuit-summary.dto';
import { LawsuitDetailDto } from '../dto/lawsuit-detail.dto';
import { ProceedingSelector } from '../rules/proceeding-selector';

/**
 * Mapper responsible for transforming raw lawsuit data (from JSON) into DTOs
 * for API responses. Handles normalization, data extraction, and edge cases.
 */
export class LawsuitMapper {
    private static readonly MAX_REPRESENTATIVES_PER_PARTY = 5;

    /**
     * Maps a raw lawsuit to a summary DTO
     */
    static toSummary(lawsuit: LawsuitRaw): LawsuitSummaryDto {
        const currentProceeding = ProceedingSelector.selectCurrentProceeding(
            lawsuit.tramitacoes,
        );

        const parties = this.collectParties(lawsuit.tramitacoes, currentProceeding);
        const { activeParties, passiveParties } = this.separatePartiesByRole(parties);

        const currentDegree = this.extractDegree(currentProceeding.grau);
        const mainClass = this.extractMainClass(currentProceeding);
        const mainSubject = this.extractMainSubject(currentProceeding);
        const lastMovementCourt = this.extractLastMovementCourt(currentProceeding);

        return {
            numeroProcesso: lawsuit.numeroProcesso,
            siglaTribunal: lawsuit.siglaTribunal,
            grauAtual: currentDegree,
            classePrincipal: mainClass,
            assuntoPrincipal: mainSubject,
            ultimoMovimento: currentProceeding.ultimoMovimento
                ? {
                    dataHora: currentProceeding.ultimoMovimento.dataHora,
                    descricao: currentProceeding.ultimoMovimento.descricao,
                    orgaoJulgador: lastMovementCourt,
                }
                : null,
            partesResumo: {
                ativo: activeParties,
                passivo: passiveParties,
            },
        };
    }

    /**
     * Maps a raw lawsuit to a detail DTO
     */
    static toDetail(lawsuit: LawsuitRaw): LawsuitDetailDto {
        const currentProceeding = ProceedingSelector.selectCurrentProceeding(
            lawsuit.tramitacoes,
        );

        const parties = this.collectParties(lawsuit.tramitacoes, currentProceeding);
        const mappedParties = this.mapPartiesToDto(parties);

        const currentDegree = this.extractDegree(currentProceeding.grau);
        const classes = this.extractClasses(currentProceeding);
        const subjects = this.extractSubjects(currentProceeding);
        const proceedingCourt = this.extractCourt(currentProceeding.orgaoJulgador);
        const movementCourt = this.extractLastMovementCourt(currentProceeding);

        return {
            numeroProcesso: lawsuit.numeroProcesso,
            siglaTribunal: lawsuit.siglaTribunal,
            nivelSigilo: lawsuit.nivelSigilo,
            tramitacaoAtual: {
                grau: currentDegree,
                orgaoJulgador: movementCourt || proceedingCourt,
                classes,
                assuntos: subjects,
                dataDistribuicao: currentProceeding.dataHoraUltimaDistribuicao || null,
                dataAutuacao: currentProceeding.dataHoraAjuizamento || null,
            },
            partes: mappedParties,
            ultimoMovimento: currentProceeding.ultimoMovimento
                ? {
                    data: currentProceeding.ultimoMovimento.dataHora,
                    descricao: currentProceeding.ultimoMovimento.descricao,
                    orgaoJulgador: movementCourt || proceedingCourt,
                    codigo: this.extractMovementCode(currentProceeding.ultimoMovimento.codigo),
                }
                : null,
        };
    }

    /**
     * Collects parties from all proceedings, with fallback to current proceeding
     */
    private static collectParties(
        proceedings: ProceedingRaw[],
        currentProceeding: ProceedingRaw,
    ): PartyRaw[] {
        const allParties = proceedings.flatMap((p) => p.partes || []);
        return allParties.length > 0 ? allParties : currentProceeding.partes || [];
    }

    /**
     * Separates parties by role (active/passive) and returns only names
     */
    private static separatePartiesByRole(parties: PartyRaw[]): {
        activeParties: string[];
        passiveParties: string[];
    } {
        const activeParties = parties
            .filter((p) => p.polo === 'ATIVO')
            .map((p) => p.nome)
            .filter((nome) => nome && nome.trim().length > 0);

        const passiveParties = parties
            .filter((p) => p.polo === 'PASSIVO')
            .map((p) => p.nome)
            .filter((nome) => nome && nome.trim().length > 0);

        return { activeParties, passiveParties };
    }

    /**
     * Maps parties to DTO format with limited representatives
     */
    private static mapPartiesToDto(parties: PartyRaw[]) {
        return parties.map((party) => ({
            nome: party.nome,
            polo: this.normalizePolo(party.polo),
            tipoParte: party.tipoParte || party.tipoPessoa || null,
            representantes: (party.representantes || [])
                .slice(0, this.MAX_REPRESENTATIVES_PER_PARTY)
                .map((rep) => ({
                    nome: rep.nome,
                    tipo: rep.tipoRepresentacao || null,
                })),
        }));
    }

    /**
     * Normalizes polo from uppercase to lowercase enum
     */
    private static normalizePolo(polo: string): 'ativo' | 'passivo' {
        const normalized = polo.toLowerCase();
        return normalized === 'ativo' || normalized === 'passivo'
            ? (normalized as 'ativo' | 'passivo')
            : 'ativo'; // Default fallback
    }

    /**
     * Extracts degree from grau (can be object or string)
     */
    private static extractDegree(
        grau: string | { sigla?: string; numero?: number },
    ): string {
        if (typeof grau === 'object' && grau !== null) {
            return grau.sigla || '';
        }
        return typeof grau === 'string' ? grau : '';
    }

    /**
     * Extracts main class description, returns null if not available
     */
    private static extractMainClass(proceeding: ProceedingRaw): string | null {
        if (!proceeding.classe || proceeding.classe.length === 0) {
            return null;
        }
        const firstClass = proceeding.classe[0];
        return firstClass?.descricao?.trim() || null;
    }

    /**
     * Extracts main subject description, returns null if not available
     */
    private static extractMainSubject(proceeding: ProceedingRaw): string | null {
        if (!proceeding.assunto || proceeding.assunto.length === 0) {
            return null;
        }
        const firstSubject = proceeding.assunto[0];
        return firstSubject?.descricao?.trim() || null;
    }

    /**
     * Extracts all classes as string array
     */
    private static extractClasses(proceeding: ProceedingRaw): string[] {
        if (!proceeding.classe || proceeding.classe.length === 0) {
            return [];
        }
        return proceeding.classe
            .map((c) => c.descricao?.trim())
            .filter((desc): desc is string => Boolean(desc));
    }

    /**
     * Extracts all subjects as string array
     */
    private static extractSubjects(proceeding: ProceedingRaw): string[] {
        if (!proceeding.assunto || proceeding.assunto.length === 0) {
            return [];
        }
        return proceeding.assunto
            .map((a) => a.descricao?.trim())
            .filter((desc): desc is string => Boolean(desc));
    }

    /**
     * Extracts court name from court object
     */
    private static extractCourt(
        court?: { id?: number; nome?: string } | null,
    ): string | null {
        if (!court?.nome) {
            return null;
        }
        const trimmed = court.nome.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    /**
     * Extracts court from last movement
     */
    private static extractLastMovementCourt(proceeding: ProceedingRaw): string | null {
        if (!proceeding.ultimoMovimento?.orgaoJulgador) {
            return null;
        }
        const firstCourt = proceeding.ultimoMovimento.orgaoJulgador[0];
        return this.extractCourt(firstCourt);
    }

    /**
     * Extracts movement code and converts to string
     */
    private static extractMovementCode(
        code?: number | string | null,
    ): string | null {
        if (code === null || code === undefined) {
            return null;
        }
        return String(code);
    }
}