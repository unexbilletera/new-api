import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { ContactsController } from './controllers/contacts.controller';
import { ContactsService } from './services/contacts.service';

@Module({
  imports: [PrismaModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
