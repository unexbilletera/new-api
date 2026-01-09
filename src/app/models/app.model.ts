import { Injectable } from '@nestjs/common';

@Injectable()
export class AppModel {
  getGreeting(): string {
    return 'Hello World!';
  }
}
