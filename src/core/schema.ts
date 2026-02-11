import { z } from "zod"

/**
 * Shared primitives
 */
export const RepoRefSchema = z.string().min(1);

export const VersionRangeSchema = z.string().min(1);

export const ExportNameSchema = z.string().min(1);

/**
 * Package-side manifest (provider)
 */
export const PackageExportSchema = z.object({
  source: z.string().min(1),
  description: z.string().optional()
});

export const ZedoPackageManifestSchema = z.object({
  $schema: z.url().optional(),
  name: z.string().min(1),
  exports: z.record(ExportNameSchema, PackageExportSchema),
  dependencies: z
    .array(
      z.object({
        repo: RepoRefSchema,
        version: VersionRangeSchema
      })
    )
    .optional()
});

/**
 * Project-side manifest (consumer)
 */
export const ZedoProjectDependencySchema = z.object({
  repo: RepoRefSchema,
  version: VersionRangeSchema,
  mounts: z.record(ExportNameSchema, z.string().min(1)).optional()
});

export const ZedoProjectManifestSchema = z.object({
  $schema: z.url().optional(),
  modulesDir: z.string().min(1).optional(),
  packagePrefix: z.string().min(1).optional(),
  dependencies: z.array(ZedoProjectDependencySchema)
});
