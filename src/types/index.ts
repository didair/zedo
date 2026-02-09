import {
  ExportNameSchema,
  ZedoPackageManifestSchema,
  ZedoProjectDependencySchema,
  ZedoProjectManifestSchema
} from "../core/schema";
import {z} from "zod";

/**
 * Inferred types
 */
export type ExportName = z.infer<typeof ExportNameSchema>;
export type ZedoPackageManifest = z.infer<typeof ZedoPackageManifestSchema>;
export type ZedoProjectManifest = z.infer<typeof ZedoProjectManifestSchema>;
export type ZedoProjectDependency = z.infer<typeof ZedoProjectDependencySchema>;

/**
 * Explicit interfaces
 */
export interface PackageExport {
  source: string;
  description?: string;
};

export interface ResolvedMount {
  exportName: ExportName;
  sourcePath: string;
  targetPath: string;
};

export interface InstalledMeta {
  repo: string;
  tag: string;
  version: string;
  installedAt: string;
};
