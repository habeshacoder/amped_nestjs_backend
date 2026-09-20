import { Global, Module } from '@nestjs/common';
import { FileStorageService } from './services/file-storage.service';
import { SentryService } from './services/sentry.service';

@Global()
@Module({
  providers: [FileStorageService, SentryService],
  exports: [FileStorageService, SentryService],
})
export class CommonModule {}
