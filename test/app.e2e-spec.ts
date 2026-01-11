import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '../src/shared/errors/http-exception.filter';

describe('AppController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalFilters(new HttpExceptionFilter());
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /lawsuits', () => {
        it('should return a paginated list of lawsuits', () => {
            return request(app.getHttpServer())
                .get('/lawsuits')
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('items');
                    expect(res.body).toHaveProperty('nextCursor');
                    expect(Array.isArray(res.body.items)).toBe(true);
                    expect(res.body.items.length).toBeGreaterThan(0);
                });
        });

        it('should return correct structure for lawsuit summary', () => {
            return request(app.getHttpServer())
                .get('/lawsuits?limit=1')
                .expect(200)
                .expect((res) => {
                    if (res.body.items.length > 0) {
                        const item = res.body.items[0];
                        expect(item).toHaveProperty('numeroProcesso');
                        expect(item).toHaveProperty('siglaTribunal');
                        expect(item).toHaveProperty('grauAtual');
                        expect(item).toHaveProperty('classePrincipal');
                        expect(item).toHaveProperty('assuntoPrincipal');
                        expect(item).toHaveProperty('ultimoMovimento');
                        expect(item).toHaveProperty('partesResumo');
                        expect(item.partesResumo).toHaveProperty('ativo');
                        expect(item.partesResumo).toHaveProperty('passivo');
                        expect(Array.isArray(item.partesResumo.ativo)).toBe(true);
                        expect(Array.isArray(item.partesResumo.passivo)).toBe(true);
                    }
                });
        });

        it('should accept pagination query params', () => {
            return request(app.getHttpServer())
                .get('/lawsuits?limit=2')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items.length).toBeLessThanOrEqual(2);
                });
        });

        it('should enforce maximum limit of 100 (validation error)', () => {
            return request(app.getHttpServer())
                .get('/lawsuits?limit=200')
                .expect(400)
                .expect((res) => {
                    expect(res.body).toHaveProperty('code');
                    expect(res.body).toHaveProperty('message');
                });
        });

        it('should filter by tribunal', () => {
            return request(app.getHttpServer())
                .get('/lawsuits?tribunal=TJSP&limit=10')
                .expect(200)
                .expect((res) => {
                    if (res.body.items.length > 0) {
                        res.body.items.forEach((item: any) => {
                            expect(item.siglaTribunal).toBe('TJSP');
                        });
                    }
                });
        });

        it('should filter by grau (degree)', () => {
            return request(app.getHttpServer())
                .get('/lawsuits?grau=G1&limit=10')
                .expect(200)
                .expect((res) => {
                    if (res.body.items.length > 0) {
                        res.body.items.forEach((item: any) => {
                            expect(item.grauAtual).toBe('G1');
                        });
                    }
                });
        });

        it('should perform text search', () => {
            return request(app.getHttpServer())
                .get('/lawsuits?q=João&limit=10')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items.length).toBeGreaterThanOrEqual(0);
                });
        });

        it('should filter by degree when query text matches degree pattern (q=g3)', () => {
            return request(app.getHttpServer())
                .get('/lawsuits?q=g3&limit=10')
                .expect(200)
                .expect((res) => {
                    if (res.body.items.length > 0) {
                        res.body.items.forEach((item: any) => {
                            expect(item.grauAtual).toBe('G3');
                        });
                    }
                });
        });

        it('should handle cursor pagination', () => {
            return request(app.getHttpServer())
                .get('/lawsuits?limit=2')
                .expect(200)
                .expect((res) => {
                    if (res.body.nextCursor) {
                        return request(app.getHttpServer())
                            .get(`/lawsuits?limit=2&cursor=${res.body.nextCursor}`)
                            .expect(200)
                            .expect((nextRes) => {
                                expect(nextRes.body).toHaveProperty('items');
                                expect(nextRes.body).toHaveProperty('nextCursor');
                            });
                    }
                });
        });

        it('should return empty items array when no results found', () => {
            return request(app.getHttpServer())
                .get('/lawsuits?tribunal=INVALID&limit=10')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items).toEqual([]);
                    expect(res.body.nextCursor).toBeNull();
                });
        });

        it('should validate query parameters', () => {
            return request(app.getHttpServer())
                .get('/lawsuits?limit=invalid')
                .expect(400);
        });
    });

    describe('GET /lawsuits/:caseNumber', () => {
        it('should return details of a specific lawsuit', () => {
            // First, get a lawsuit number from the list
            return request(app.getHttpServer())
                .get('/lawsuits?limit=1')
                .expect(200)
                .expect((listRes) => {
                    if (listRes.body.items.length > 0) {
                        const caseNumber = listRes.body.items[0].numeroProcesso;

                        return request(app.getHttpServer())
                            .get(`/lawsuits/${caseNumber}`)
                            .expect(200)
                            .expect((res) => {
                                expect(res.body).toHaveProperty('numeroProcesso');
                                expect(res.body).toHaveProperty('siglaTribunal');
                                expect(res.body).toHaveProperty('nivelSigilo');
                                expect(res.body).toHaveProperty('tramitacaoAtual');
                                expect(res.body).toHaveProperty('partes');
                                expect(res.body.numeroProcesso).toBe(caseNumber);

                                // Validate tramitacaoAtual structure
                                expect(res.body.tramitacaoAtual).toHaveProperty('grau');
                                expect(res.body.tramitacaoAtual).toHaveProperty('orgaoJulgador');
                                expect(res.body.tramitacaoAtual).toHaveProperty('classes');
                                expect(res.body.tramitacaoAtual).toHaveProperty('assuntos');
                                expect(res.body.tramitacaoAtual).toHaveProperty('dataDistribuicao');
                                expect(res.body.tramitacaoAtual).toHaveProperty('dataAutuacao');
                                expect(Array.isArray(res.body.tramitacaoAtual.classes)).toBe(true);
                                expect(Array.isArray(res.body.tramitacaoAtual.assuntos)).toBe(true);

                                // Validate partes structure
                                expect(Array.isArray(res.body.partes)).toBe(true);
                                if (res.body.partes.length > 0) {
                                    const party = res.body.partes[0];
                                    expect(party).toHaveProperty('nome');
                                    expect(party).toHaveProperty('polo');
                                    expect(party).toHaveProperty('tipoParte');
                                    expect(party).toHaveProperty('representantes');
                                    expect(['ativo', 'passivo']).toContain(party.polo);
                                    expect(Array.isArray(party.representantes)).toBe(true);
                                }

                                // Validate ultimoMovimento structure (if present)
                                if (res.body.ultimoMovimento) {
                                    expect(res.body.ultimoMovimento).toHaveProperty('data');
                                    expect(res.body.ultimoMovimento).toHaveProperty('descricao');
                                    expect(res.body.ultimoMovimento).toHaveProperty('orgaoJulgador');
                                    expect(res.body.ultimoMovimento).toHaveProperty('codigo');
                                }
                            });
                    }
                });
        });

        it('should return 404 for non-existent lawsuit', () => {
            return request(app.getHttpServer())
                .get('/lawsuits/0000000-00.0000.0.00.0000')
                .expect(404)
                .expect((res) => {
                    expect(res.body).toHaveProperty('code');
                    expect(res.body).toHaveProperty('message');
                    expect(res.body.code).toBe('NOT_FOUND');
                });
        });

        it('should return error with correct format for invalid case number', () => {
            return request(app.getHttpServer())
                .get('/lawsuits/invalid-case-number')
                .expect(404)
                .expect((res) => {
                    expect(res.body).toHaveProperty('code');
                    expect(res.body).toHaveProperty('message');
                });
        });
    });

    describe('Error handling', () => {
        it('should return standardized error format', () => {
            return request(app.getHttpServer())
                .get('/lawsuits/0000000-00.0000.0.00.0000')
                .expect(404)
                .expect((res) => {
                    expect(res.body).toHaveProperty('code');
                    expect(res.body).toHaveProperty('message');
                    expect(typeof res.body.code).toBe('string');
                    expect(typeof res.body.message).toBe('string');
                });
        });
    });
});
