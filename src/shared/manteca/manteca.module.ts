import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '../config/config.module';
import { MantecaService } from './manteca.service';

@Global()
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [MantecaService],
  exports: [MantecaService],
})
export class MantecaModule {}
