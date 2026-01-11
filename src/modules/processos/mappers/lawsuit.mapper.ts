import { LawsuitRaw, ProceedingRaw, PartyRaw } from '../interfaces/lawsuit-raw.interface';
import { LawsuitSummaryDto } from '../dto/lawsuit-summary.dto';
import { LawsuitDetailDto } from '../dto/lawsuit-detail.dto';
import { ProceedingSelector } from '../rules/proceeding-selector';

export class LawsuitMapper {
    static toSummary(lawsuit: LawsuitRaw): LawsuitSummaryDto {
        const currentProceeding = ProceedingSelector.selectCurrentProceeding(
            lawsuit.tramitacoes,
        );

        // Collect parties from all proceedings
        const allParties = lawsuit.tramitacoes.flatMap((p) => p.partes || []);

        // If there are no parties in proceedings, use parties from current proceeding
        const parties = allParties.length > 0 ? allParties : currentProceeding.partes || [];

        const activeParties = parties
            .filter((p) => p.polo === 'ATIVO')
            .map((p) => p.nome);

        const passiveParties = parties
            .filter((p) => p.polo === 'PASSIVO')
            .map((p) => p.nome);

        // Extract degree (can be object or string)
        const currentDegree = typeof currentProceeding.grau === 'object'
            ? currentProceeding.grau.sigla
            : currentProceeding.grau;

        // Extract main class
        const mainClass = currentProceeding.classe && currentProceeding.classe.length > 0
            ? currentProceeding.classe[0].descricao
            : '';

        // Extract main subject
        const mainSubject = currentProceeding.assunto && currentProceeding.assunto.length > 0
            ? currentProceeding.assunto[0].descricao
            : '';

        // Extract court from last movement
        const movementCourt = currentProceeding.ultimoMovimento?.orgaoJulgador
            ? currentProceeding.ultimoMovimento.orgaoJulgador[0]?.nome || ''
            : '';

        // Use proceeding court as fallback
        const finalCourt = movementCourt || (currentProceeding.orgaoJulgador?.nome || '');

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
                    orgaoJulgador: finalCourt,
                }
                : null,
            partesResumo: {
                ativo: activeParties,
                passivo: passiveParties,
            },
        };
    }

    static toDetail(lawsuit: LawsuitRaw): LawsuitDetailDto {
        const currentProceeding = ProceedingSelector.selectCurrentProceeding(
            lawsuit.tramitacoes,
        );

        // Collect parties from all proceedings
        const allParties = lawsuit.tramitacoes.flatMap((p) => p.partes || []);

        // If there are no parties in proceedings, use parties from current proceeding
        const parties = allParties.length > 0 ? allParties : currentProceeding.partes || [];

        const mappedParties = parties.map((party) => ({
            nome: party.nome,
            polo: party.polo.toLowerCase() as 'ativo' | 'passivo',
            tipoParte: party.tipoParte || party.tipoPessoa || '',
            representantes: (party.representantes || []).slice(0, 5).map((rep) => ({
                nome: rep.nome,
                tipo: rep.tipoRepresentacao || '',
            })),
        }));

        // Extract degree (can be object or string)
        const currentDegree = typeof currentProceeding.grau === 'object'
            ? currentProceeding.grau.sigla
            : currentProceeding.grau;

        // Extract classes as string array
        const classes = currentProceeding.classe
            ? currentProceeding.classe.map((c) => c.descricao)
            : [];

        // Extract subjects as string array
        const subjects = currentProceeding.assunto
            ? currentProceeding.assunto.map((a) => a.descricao)
            : [];

        // Extract court
        const proceedingCourt = currentProceeding.orgaoJulgador?.nome || '';

        // Extract court from last movement
        const movementCourt = currentProceeding.ultimoMovimento?.orgaoJulgador
            ? currentProceeding.ultimoMovimento.orgaoJulgador[0]?.nome || ''
            : '';

        // Use movement court as priority, otherwise proceeding court
        const finalCourt = movementCourt || proceedingCourt;

        // Extract last movement code (can be number or string)
        const movementCode = currentProceeding.ultimoMovimento?.codigo
            ? String(currentProceeding.ultimoMovimento.codigo)
            : undefined;

        return {
            numeroProcesso: lawsuit.numeroProcesso,
            siglaTribunal: lawsuit.siglaTribunal,
            nivelSigilo: lawsuit.nivelSigilo,
            tramitacaoAtual: {
                grau: currentDegree,
                orgaoJulgador: finalCourt,
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
                    orgaoJulgador: movementCourt || finalCourt,
                    codigo: movementCode,
                }
                : null,
        };
    }
}