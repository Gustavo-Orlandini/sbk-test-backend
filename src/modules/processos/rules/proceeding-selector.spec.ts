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
                    ultimoMovimento: {
                        dataHora: '2023-01-01T10:00:00Z',
                        descricao: 'Movimento 1',
                        orgaoJulgador: [{ id: 1, nome: '1ª Vara' }],
                    },
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

        it('should prioritize proceeding with most recent date when there are multiple active', () => {
            const proceedings: ProceedingRaw[] = [
                {
                    grau: { sigla: 'G1', nome: '1° Grau', numero: 1 },
                    orgaoJulgador: { id: 1, nome: '1ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 1, descricao: 'Classe 1' }],
                    assunto: [{ codigo: 1, descricao: 'Assunto 1' }],
                    ultimoMovimento: {
                        dataHora: '2023-01-01T10:00:00Z',
                        descricao: 'Movimento 1',
                        orgaoJulgador: [{ id: 1, nome: '1ª Vara' }],
                    },
                },
                {
                    grau: { sigla: 'G2', nome: '2° Grau', numero: 2 },
                    orgaoJulgador: { id: 2, nome: '2ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 2, descricao: 'Classe 2' }],
                    assunto: [{ codigo: 2, descricao: 'Assunto 2' }],
                    ultimoMovimento: {
                        dataHora: '2023-12-01T10:00:00Z',
                        descricao: 'Movimento 2',
                        orgaoJulgador: [{ id: 2, nome: '2ª Vara' }],
                    },
                },
            ];

            const result = ProceedingSelector.selectCurrentProceeding(proceedings);

            expect(result.ativo).toBe(true);
            expect(result.grau.sigla).toBe('G2');
            expect(result.ultimoMovimento?.dataHora).toBe('2023-12-01T10:00:00Z');
        });

        it('should prioritize higher degree in case of date tie', () => {
            const proceedings: ProceedingRaw[] = [
                {
                    grau: { sigla: 'G1', nome: '1° Grau', numero: 1 },
                    orgaoJulgador: { id: 1, nome: '1ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 1, descricao: 'Classe 1' }],
                    assunto: [{ codigo: 1, descricao: 'Assunto 1' }],
                    ultimoMovimento: {
                        dataHora: '2023-12-01T10:00:00Z',
                        descricao: 'Movimento 1',
                        orgaoJulgador: [{ id: 1, nome: '1ª Vara' }],
                    },
                },
                {
                    grau: { sigla: 'G2', nome: '2° Grau', numero: 2 },
                    orgaoJulgador: { id: 2, nome: '2ª Vara' },
                    ativo: true,
                    classe: [{ codigo: 2, descricao: 'Classe 2' }],
                    assunto: [{ codigo: 2, descricao: 'Assunto 2' }],
                    ultimoMovimento: {
                        dataHora: '2023-12-01T10:00:00Z',
                        descricao: 'Movimento 2',
                        orgaoJulgador: [{ id: 2, nome: '2ª Vara' }],
                    },
                },
            ];

            const result = ProceedingSelector.selectCurrentProceeding(proceedings);

            expect(result.grau.sigla).toBe('G2');
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
    });
});