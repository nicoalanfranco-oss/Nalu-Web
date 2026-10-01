# Reglas de Repositorio y Versionado (Nalu Web)

## 1. Política Estricta de Subida a Git (Solo lo Estrictamente Necesario)
- **Archivos Permitidos en Commits**:
  - Código fuente de la web (`src/`, `public/`).
  - Configuraciones imprescindibles (`package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`).
  - Assets optimizados de la web.

- **Prohibido Subir a Git**:
  - **Archivos temporales y de prueba**: Scripts sueltos, carpetas `scratch/`, dumps o pruebas locales.
  - **Credenciales y Secretos**: Archivos `.env`, `.env.local`, claves o tokens.
  - **Artefactos de compilación**: Carpetas `dist/`, `.cache/`, `node_modules/`.
  - **Archivos de sistema y editor**: `.DS_Store`, `Thumbs.db`, `.vscode/`, `.idea/`.

## 2. Verificación Pre-Commit
Antes de realizar cualquier commit o push:
1. Ejecutar `git status` para comprobar los cambios.
2. Asegurarse de que no existan archivos de prueba ni variables privadas.
