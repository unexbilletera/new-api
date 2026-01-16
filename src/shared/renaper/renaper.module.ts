import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '../config/config.module';
import { RenaperService } from './renaper.service';
import { Pdf417ParserService } from './pdf417-parser.service';

@Global()
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [RenaperService, Pdf417ParserService],
  exports: [RenaperService, Pdf417ParserService],
})
export class RenaperModule {}
