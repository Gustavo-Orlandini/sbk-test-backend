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

        it('should filter by tribunal', () => {
            return request(app.getHttpServer())
                .get('/lawsuits?tribunal=TJSP')
                .expect(200)
                .expect((res) => {
                    res.body.items.forEach((item: any) => {
                        expect(item.siglaTribunal).toBe('TJSP');
                    });
                });
        });

        it('should perform text search', () => {
            return request(app.getHttpServer())
                .get('/lawsuits?q=João')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items.length).toBeGreaterThan(0);
                });
        });
    });

    describe('GET /lawsuits/:caseNumber', () => {
        it('should return details of a specific lawsuit', () => {
            return request(app.getHttpServer())
                .get('/lawsuits/0000001-23.2023.8.26.0100')
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('numeroProcesso');
                    expect(res.body).toHaveProperty('tramitacaoAtual');
                    expect(res.body).toHaveProperty('partes');
                    expect(res.body.numeroProcesso).toBe('0000001-23.2023.8.26.0100');
                });
        });

        it('should return 404 for non-existent lawsuit', () => {
            return request(app.getHttpServer())
                .get('/lawsuits/0000000-00.0000.0.00.0000')
                .expect(404)
                .expect((res) => {
                    expect(res.body).toHaveProperty('code');
                    expect(res.body).toHaveProperty('message');
                });
        });
    });
});