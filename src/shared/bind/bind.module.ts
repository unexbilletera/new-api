import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '../config/config.module';
import { BindService } from './bind.service';

@Global()
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [BindService],
  exports: [BindService],
})
export class BindModule {}
