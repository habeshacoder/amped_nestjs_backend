import { Global, Module } from '@nestjs/common';
import { FileStorageService } from './services/file-storage.service';
import { SentryService } from './services/sentry.service';
import { EntityFileManagerService } from './services/entity-file-manager.service';

@Global()
@Module({
  providers: [FileStorageService, SentryService, EntityFileManagerService],
  exports: [FileStorageService, SentryService, EntityFileManagerService],
})
export class CommonModule {}
