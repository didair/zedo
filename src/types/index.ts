export type ExportName = string

export interface PackageExport {
  source: string
  description?: string
}

export interface ZedoPackageManifest {
  name: string
  version: string
  exports: Record<ExportName, PackageExport>
  dependencies?: {
    repo: string
    version: string
  }[]
}

export interface ZedoProjectDependency {
  repo: string
  version: string
  mounts?: Record<ExportName, string>
}

export interface ZedoProjectManifest {
  modulesDir?: string
  dependencies: ZedoProjectDependency[]
}

export interface ResolvedMount {
  exportName: ExportName
  sourcePath: string
  targetPath: string
}
