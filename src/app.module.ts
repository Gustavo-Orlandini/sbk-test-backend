import { Module } from '@nestjs/common';
import { LawsuitsModule } from './modules/processos/processos.module';

@Module({
    imports: [LawsuitsModule],
})
export class AppModule { }