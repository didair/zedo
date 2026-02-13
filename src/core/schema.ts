import { z } from "zod"

/**
 * Shared primitives
 */
export const RepoRefSchema = z.string().min(1);

export const VersionRangeSchema = z.string().min(1);

export const ExportNameSchema = z.string().min(1);

/**
 * Package manifest
 */
export const PackageExportSchema = z.object({
  source: z.string().min(1),
  description: z.string().optional(),
});

export const PackageDependencySchema = z.object({
  repo: RepoRefSchema,
  version: VersionRangeSchema,
  mounts: z.record(ExportNameSchema, z.string().min(1)).optional(),
});

export const ZedoPackageManifestSchema = z.object({
  $schema: z.url().optional(),
  name: z.string().min(1),
  modulesDir: z.string().min(1).optional(),
  packagePrefix: z.string().min(1).optional(),
  exports: z.record(ExportNameSchema, PackageExportSchema).optional(),
  dependencies: z.array(PackageDependencySchema).optional(),
});

/**
 * Registries
 */
export const DevRegistryEntrySchema = z.object({
  path: z.string().min(1), // absolute path to local repo
  registeredAt: z.iso.datetime(),
});

export const DevRegistrySchema = z.record(
  z.string().min(1), // repo name
  DevRegistryEntrySchema
);
