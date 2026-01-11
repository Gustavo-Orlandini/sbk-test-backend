import { ProceedingSelector } from './proceeding-selector';
import { ProceedingRaw } from '../interfaces/lawsuit-raw.interface';

describe('ProceedingSelector', () => {
    describe('selectCurrentProceeding', () => {
        it('should select active proceeding when there is only one', () => {
            const proceedings: ProceedingRaw[] = [
                {
                    grau: { sigla: 'G1', nome: '1° Grau', numero: 1 },
                    orgaoJulgador: { id: 1, nome: '1ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 1, descricao: 'Classe 1' }],
                    assunto: [{ codigo: 1, descricao: 'Assunto 1' }],
                    dataHoraUltimaDistribuicao: '2023-01-01T10:00:00Z',
                },
                {
                    grau: { sigla: 'G2', nome: '2° Grau', numero: 2 },
                    orgaoJulgador: { id: 2, nome: '2ª Vara' },
                    ativo: false,
                    classe: [{ codigo: 2, descricao: 'Classe 2' }],
                    assunto: [{ codigo: 2, descricao: 'Assunto 2' }],
                },
            ];

            const result = ProceedingSelector.selectCurrentProceeding(proceedings);

            expect(result.ativo).toBe(true);
            expect(result.grau.sigla).toBe('G1');
        });

        it('should prioritize proceeding with highest dataHoraUltimaDistribuicao when there are multiple active', () => {
            const proceedings: ProceedingRaw[] = [
                {
                    grau: { sigla: 'G1', nome: '1° Grau', numero: 1 },
                    orgaoJulgador: { id: 1, nome: '1ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 1, descricao: 'Classe 1' }],
                    assunto: [{ codigo: 1, descricao: 'Assunto 1' }],
                    dataHoraUltimaDistribuicao: '2023-01-01T10:00:00Z',
                },
                {
                    grau: { sigla: 'G2', nome: '2° Grau', numero: 2 },
                    orgaoJulgador: { id: 2, nome: '2ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 2, descricao: 'Classe 2' }],
                    assunto: [{ codigo: 2, descricao: 'Assunto 2' }],
                    dataHoraUltimaDistribuicao: '2023-12-01T10:00:00Z',
                },
            ];

            const result = ProceedingSelector.selectCurrentProceeding(proceedings);

            expect(result.ativo).toBe(true);
            expect(result.grau.sigla).toBe('G2');
            expect(result.dataHoraUltimaDistribuicao).toBe('2023-12-01T10:00:00Z');
        });

        it('should prioritize higher degree (grau.numero) in case of dataHoraUltimaDistribuicao tie', () => {
            const proceedings: ProceedingRaw[] = [
                {
                    grau: { sigla: 'G1', nome: '1° Grau', numero: 1 },
                    orgaoJulgador: { id: 1, nome: '1ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 1, descricao: 'Classe 1' }],
                    assunto: [{ codigo: 1, descricao: 'Assunto 1' }],
                    dataHoraUltimaDistribuicao: '2023-12-01T10:00:00Z',
                },
                {
                    grau: { sigla: 'G2', nome: '2° Grau', numero: 2 },
                    orgaoJulgador: { id: 2, nome: '2ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 2, descricao: 'Classe 2' }],
                    assunto: [{ codigo: 2, descricao: 'Assunto 2' }],
                    dataHoraUltimaDistribuicao: '2023-12-01T10:00:00Z',
                },
            ];

            const result = ProceedingSelector.selectCurrentProceeding(proceedings);

            expect(result.grau.sigla).toBe('G2');
            expect(result.grau.numero).toBe(2);
        });

        it('should return first proceeding when there are no active proceedings', () => {
            const proceedings: ProceedingRaw[] = [
                {
                    grau: { sigla: 'G1', nome: '1° Grau', numero: 1 },
                    orgaoJulgador: { id: 1, nome: '1ª Vara' },
                    ativo: false,
                    classe: [{ codigo: 1, descricao: 'Classe 1' }],
                    assunto: [{ codigo: 1, descricao: 'Assunto 1' }],
                },
                {
                    grau: { sigla: 'G2', nome: '2° Grau', numero: 2 },
                    orgaoJulgador: { id: 2, nome: '2ª Vara' },
                    ativo: false,
                    classe: [{ codigo: 2, descricao: 'Classe 2' }],
                    assunto: [{ codigo: 2, descricao: 'Assunto 2' }],
                },
            ];

            const result = ProceedingSelector.selectCurrentProceeding(proceedings);

            expect(result.grau.sigla).toBe('G1');
        });

        it('should prioritize proceeding with dataHoraUltimaDistribuicao over one without it', () => {
            const proceedings: ProceedingRaw[] = [
                {
                    grau: { sigla: 'G1', nome: '1° Grau', numero: 1 },
                    orgaoJulgador: { id: 1, nome: '1ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 1, descricao: 'Classe 1' }],
                    assunto: [{ codigo: 1, descricao: 'Assunto 1' }],
                    // No dataHoraUltimaDistribuicao
                },
                {
                    grau: { sigla: 'G2', nome: '2° Grau', numero: 2 },
                    orgaoJulgador: { id: 2, nome: '2ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 2, descricao: 'Classe 2' }],
                    assunto: [{ codigo: 2, descricao: 'Assunto 2' }],
                    dataHoraUltimaDistribuicao: '2023-12-01T10:00:00Z',
                },
            ];

            const result = ProceedingSelector.selectCurrentProceeding(proceedings);

            expect(result.grau.sigla).toBe('G2');
            expect(result.dataHoraUltimaDistribuicao).toBe('2023-12-01T10:00:00Z');
        });

        it('should handle multiple active proceedings with different dates correctly', () => {
            const proceedings: ProceedingRaw[] = [
                {
                    grau: { sigla: 'G1', nome: '1° Grau', numero: 1 },
                    orgaoJulgador: { id: 1, nome: '1ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 1, descricao: 'Classe 1' }],
                    assunto: [{ codigo: 1, descricao: 'Assunto 1' }],
                    dataHoraUltimaDistribuicao: '2023-06-01T10:00:00Z',
                },
                {
                    grau: { sigla: 'G2', nome: '2° Grau', numero: 2 },
                    orgaoJulgador: { id: 2, nome: '2ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 2, descricao: 'Classe 2' }],
                    assunto: [{ codigo: 2, descricao: 'Assunto 2' }],
                    dataHoraUltimaDistribuicao: '2023-12-01T10:00:00Z',
                },
                {
                    grau: { sigla: 'G3', nome: '3° Grau', numero: 3 },
                    orgaoJulgador: { id: 3, nome: '3ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 3, descricao: 'Classe 3' }],
                    assunto: [{ codigo: 3, descricao: 'Assunto 3' }],
                    dataHoraUltimaDistribuicao: '2023-09-01T10:00:00Z',
                },
            ];

            const result = ProceedingSelector.selectCurrentProceeding(proceedings);

            // Should select G2 (most recent dataHoraUltimaDistribuicao)
            expect(result.grau.sigla).toBe('G2');
            expect(result.dataHoraUltimaDistribuicao).toBe('2023-12-01T10:00:00Z');
        });

        it('should throw error when proceedings array is empty', () => {
            const proceedings: ProceedingRaw[] = [];

            expect(() => {
                ProceedingSelector.selectCurrentProceeding(proceedings);
            }).toThrow('Empty proceedings list');
        });

        it('should throw error when proceedings is null', () => {
            expect(() => {
                ProceedingSelector.selectCurrentProceeding(null as any);
            }).toThrow('Empty proceedings list');
        });

        it('should throw error when proceedings is undefined', () => {
            expect(() => {
                ProceedingSelector.selectCurrentProceeding(undefined as any);
            }).toThrow('Empty proceedings list');
        });

        it('should handle grau as string format (backward compatibility)', () => {
            const proceedings: ProceedingRaw[] = [
                {
                    grau: 'G1' as any,
                    orgaoJulgador: { id: 1, nome: '1ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 1, descricao: 'Classe 1' }],
                    assunto: [{ codigo: 1, descricao: 'Assunto 1' }],
                    dataHoraUltimaDistribuicao: '2023-01-01T10:00:00Z',
                },
                {
                    grau: 'G2' as any,
                    orgaoJulgador: { id: 2, nome: '2ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 2, descricao: 'Classe 2' }],
                    assunto: [{ codigo: 2, descricao: 'Assunto 2' }],
                    dataHoraUltimaDistribuicao: '2023-12-01T10:00:00Z',
                },
            ];

            const result = ProceedingSelector.selectCurrentProceeding(proceedings);

            expect(result.grau).toBe('G2');
        });
    });
});
