import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SystemVersionService } from './system-version.service';

@Module({
  imports: [ConfigModule],
  providers: [SystemVersionService],
  exports: [SystemVersionService],
})
export class HelpersModule {}
