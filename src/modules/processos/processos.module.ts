import { Module } from '@nestjs/common';
import { LawsuitController } from './controllers/lawsuit.controller';
import { LawsuitService } from './services/lawsuit.service';
import { LawsuitRepository } from './repositories/lawsuit.repository';

@Module({
    controllers: [LawsuitController],
    providers: [LawsuitService, LawsuitRepository],
    exports: [LawsuitService],
})
export class LawsuitsModule { }