# Zedo

Zedo is a **deterministic**, Git-native package manager for composing multi-repository projects.
It installs versioned modules from Git repositories and mounts only the parts your project needs.

Zedo is language-agnostic and works equally well for frontend, backend, WordPress plugins, shared libraries, and more.

## Quick start
```bash
npm install -g zedo
zedo init package
zedo install
```

## Zedo Dev Lifecycle (Multi-Repo Development Workflow)
Zedo supports a clean development workflow for working across multiple repositories without changing your project’s version contract `(zedo.yaml)`. This lets you iterate locally and then return to deterministic, versioned installs.

Below is the recommended step-by-step lifecycle.

### 1. Register a local module (one-time per module)
From inside the module’s repository:
```bash
zedo dev register
```
**What this does:**
Registers the absolute path of the module in Zedo’s local dev registry.
This allows projects to link to the module by name later, without remembering paths.

### 2. Install project dependencies (baseline)
From inside your project:
```bash
zedo install
```
**What this does:**
Installs all dependencies declared in zedo.yaml at their pinned versions.
This establishes the deterministic baseline state of your project.

### 3. Link a module for local development
```bash
zedo dev link user/moduleA
```
**What this does:**
Replaces the installed package with a live symlink to your local working copy.
Edits in the module repository immediately reflect in the project (hot reload, no publishing required).

Zedo records this override in `.zedo/dev.json` and marks the project as being in dev mode.

### 4. (If using Docker) Mount dev links into containers
```bash
zedo docker-compose mount-links
```
**What this does:**
Automatically updates docker-compose.override.yml to mount all dev-linked module paths into the container at the same absolute paths.

This ensures symlinks resolve correctly inside Docker and hot reloading works as expected.

Restart containers after running.

### 5. Verify dev environment
```bash
zedo doctor dev
```
**What this does:**
Checks that all dev-linked paths are visible inside the current runtime environment (e.g., Docker).
If something is misconfigured, Zedo prints the exact volume mounts you need to add.

### 6. Develop normally
At this point:

Your project uses live code from the local module.
No version tags or publishing is required,
your zedo.yaml remains unchanged and deterministic

Make changes in the module repo and see them immediately reflected in the project.

### 7. Restore project to contract state
When you’re done developing locally:
```bash
zedo dev restore
```
**What this does:**
Removes all dev overrides and restores the project to the exact versions declared in zedo.yaml.

Your project is now back in a clean, deterministic state.

### 8. (Optional) Remove Docker dev mounts
```bash
zedo docker-compose unmount-links
```
**What this does:**
Removes dev-linked volume mounts from docker-compose.override.yml.
Use this if you no longer want dev paths mounted into containers.

Restart containers after running.
