import { Prisma } from '@prisma/client';
import { NamedFileRecord } from './file-storage.service';

/**
 * Minimal structural shape for a parent entity record as used internally by
 * EntityFileManagerService. Fields are accessed via bracket notation, so the
 * concrete type only needs to satisfy the structural minimum needed by
 * FileStorageService helpers. All Prisma-generated model records satisfy this.
 */
export interface ParentRecord {
  id: number;
  material?: string | null;
  [key: string]: unknown;
}

/**
 * A minimal structural type that captures the operations EntityFileManagerService
 * actually performs on a "parent" entity delegate (Material or ChannelMaterial).
 *
 * Prisma.MaterialDelegate and Prisma.ChannelMaterialDelegate are both structurally
 * compatible with this interface.
 */
export interface ParentDelegateSlim {
  findFirst(args?: {
    where?: Record<string, unknown>;
    include?: Record<string, unknown>;
  }): Promise<ParentRecord | null>;
  findUnique?: (args: {
    where: Record<string, unknown>;
  }) => Promise<ParentRecord | null>;
  update(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<ParentRecord>;
}

/**
 * A minimal structural type covering the operations performed on image delegates
 * (MaterialImage, ChannelMaterialImage).
 */
export interface ImageDelegateSlim {
  findFirst(args?: {
    where?: Record<string, unknown>;
  }): Promise<NamedFileRecord | null>;
  create(args: { data: Record<string, unknown> }): Promise<NamedFileRecord>;
  update(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<NamedFileRecord>;
}

/**
 * A minimal structural type covering the operations performed on preview delegates
 * (PreviewMaterial, ChannelPreviewMaterial).
 */
export interface PreviewDelegateSlim {
  findFirst(args?: {
    where?: Record<string, unknown>;
  }): Promise<NamedFileRecord | null>;
  findUnique?: (args: {
    where: Record<string, unknown>;
  }) => Promise<NamedFileRecord | null>;
  create(args: { data: Record<string, unknown> }): Promise<NamedFileRecord>;
  update(args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<NamedFileRecord>;
}

/**
 * Configuration bag passed to EntityFileManagerService. Delegates are typed with
 * structurally-minimal interfaces that every Prisma-generated delegate satisfies.
 */
export interface EntityFileManagerConfig {
  subDirectory: string;
  foreignKey: string;
  entityName?: string;
  notFoundErrorCode?: string;
  includeRelations?: Record<string, boolean>;
  /**
   * Delegate for the root entity (e.g. prisma.material, prisma.channelMaterial).
   */
  parentDelegate: ParentDelegateSlim;
  /**
   * Delegate for the associated image entity (e.g. prisma.materialImage, prisma.channelMaterialImage).
   */
  imageDelegate: ImageDelegateSlim;
  /**
   * Delegate for the associated preview entity (e.g. prisma.previewMaterial, prisma.channelPreviewMaterial).
   */
  previewDelegate: PreviewDelegateSlim;
}

export { Prisma };
