<div align="center">

# Faltas Cebanc ✨

<img width="1920" height="1080" alt="843_1x_shots_so" src="https://github.com/user-attachments/assets/84b39ebd-6561-4787-8932-dcfaa3784b5e" />

Aplicación de escritorio (Tauri + Next.js) para consultar, sincronizar y visualizar faltas de CEBANC de forma rápida y segura.

[![Repo](https://img.shields.io/badge/GitHub-Faltas--Cebanc-181717?logo=github)](https://github.com/andiricum2/Faltas-Cebanc)
![Built with Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Tauri](https://img.shields.io/badge/Tauri-2.0-orange?logo=tauri)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=222)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

### 🌟 ¿Qué es?

Faltas Cebanc es un cliente de escritorio ligero que empaqueta un frontend Next.js dentro de Tauri. La app permite iniciar sesión contra el sistema de faltas, realizar sincronizaciones, generar snapshots y visualizar métricas con un UI moderno.

### 🎯 ¿Para qué sirve?

- Consultar faltas y snapshots sin depender del navegador.
- Sincronizar datos bajo demanda con un clic.
- Visualizar gráficos y métricas de asistencia.
- Ejecutar como app nativa en Windows (MSI) y portable.

### 🧠 ¿Cómo funciona?

- El frontend es Next.js (output `standalone`) con rutas API en `app/api/*`.
- Tauri 2.0 crea la ventana nativa y empaqueta recursos (`next/`, `bin/`).
- En desarrollo: Next corre en `http://localhost:3000` y Tauri abre esa URL.
- En producción: se incluye el `standalone` de Next y un Node sidecar para servirlo.

---

### 📦 Tech Stack

| Capa | Tecnología |
|------|------------|
| UI   | React 19, Next.js 15, Tailwind CSS 4 |
| Desktop | Tauri 2.0 (Rust) |
| Utils | Cheerio, Pino, Framer Motion, Recharts |

---

### 🚀 Instalación

Requisitos previos:

```bash
Node.js 18+
Rust y Cargo (stable)
@tauri-apps/cli (global): npm i -g @tauri-apps/cli
Windows: Microsoft Visual Studio Build Tools (o Desktop Dev C++)
```

Clona e instala dependencias:

```bash
git clone https://github.com/andiricum2/Faltas-Cebanc
cd Faltas-Cebanc
npm install
```

Variables de entorno (opcional): crea un `.env` en la raíz con valores por defecto razonables:

```bash
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
NEXT_PUBLIC_FALTAS_BASE_URL=https://faltas.cebanc.com
FALTAS_TIMEOUT_MS=15000
# APP_DATA_DIR=C:\\faltas-data
```

---

### 🧪 Desarrollo

Lanza Next.js y Tauri en paralelo:

```bash
npm run dev
```

Scripts útiles (desde `package.json`):

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Arranca Next (Turbopack) y Tauri dev cuando `:3000` esté listo |
| `npm run build` | Construye Next (output `standalone`) |
| `npm run dist` | Empaqueta app Tauri (MSI) |
| `npm run release` | Build Next + build Tauri en un paso |

---

### 🛠️ Build y empaquetado (Tauri)

Requisitos extra para producción: incluir Node sidecar para servir el `standalone` de Next.

1) Construye el frontend

```bash
npm run build
```

2) Asegura el sidecar de Node:

- Windows: coloca `src-tauri/bin/node.exe` (portátil)
- macOS/Linux: `src-tauri/bin/node`

3) Empaqueta MSI

```bash
npm run dist
```

Configuración relevante:

- `src-tauri/tauri.conf.json` incluye `resources: ["next/", "bin/"]` e `icon`.
- `next.config.ts` usa `output: "standalone"` para que las rutas API funcionen empaquetadas.

---

### 🧩 Estructura del proyecto

```
app/                 # Next.js (App Router) + rutas API
components/          # UI components (shadcn-inspired)
lib/                 # HTTP client, scraper, tipos, utils
src-tauri/           # Config y fuente de Tauri (Rust)
```

Rutas API destacadas:

- `app/api/faltas/login/route.ts`
- `app/api/faltas/sync/route.ts`
- `app/api/faltas/snapshot/route.ts`

---

### 🤝 Cómo contribuir

1. Haz un fork del repo.
2. Crea una rama: `feat/tu-feature` o `fix/tu-fix`.
3. `npm run dev` para entorno local; añade tests si aplica.
4. Asegura formateo consistente y sin lints rotos.
5. Abre un Pull Request describiendo el cambio y capturas si es UI.

Sugerencias de contribución:

- Issues con etiquetas `good first issue` o `help wanted`.
- Mejora de DX (scripts, logs) y UX (accesibilidad, animaciones, estados vacíos).

---

### 📊 Estadísticas del repositorio

![Stars](https://img.shields.io/github/stars/andiricum2/Faltas-Cebanc?style=social)
![Forks](https://img.shields.io/github/forks/andiricum2/Faltas-Cebanc?style=social)
![Issues](https://img.shields.io/github/issues/andiricum2/Faltas-Cebanc)
![PRs](https://img.shields.io/github/issues-pr/andiricum2/Faltas-Cebanc)
![Last Commit](https://img.shields.io/github/last-commit/andiricum2/Faltas-Cebanc)

![Commits Graph](https://repobeats.axiom.co/api/embed/136165b1e8320ae9eb24936b2f7dd194e06e629f.svg "Repobeats analytics image")

---

### 👥 Colaboradores

Gracias a todas las personas que han colaborado:

<a href="https://github.com/andiricum2/Faltas-Cebanc/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=andiricum2/Faltas-Cebanc" />
</a>

---

### 🐞 Problemas comunes

- Icono `.ico` no encontrado: revisa `src-tauri/icons/icon.ico` y `tauri.conf.json`.
- Sidecar bloqueado por antivirus: firma o excluye temporalmente durante pruebas.

---

### 📄 Licencia

MIT — ver el archivo `LICENSE`.
