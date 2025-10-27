# Sistema de Temas - Arquitectura y Documentación

Este directorio contiene la lógica central del sistema de temas de la aplicación.

## 📁 Estructura de Archivos

```
lib/
├── theme/
│   ├── constants.ts      # Definiciones de constantes (claves de color, categorías)
│   ├── utils.ts          # Funciones utilitarias para temas
│   └── index.ts          # Exportaciones barrel
├── hooks/
│   ├── useTheme.ts       # Hook principal para acceder al contexto de tema
│   ├── usePresetManager.ts  # Hook para gestión de presets
│   └── useColorEditor.ts    # Hook para edición de colores
├── services/
│   ├── themeContext.tsx  # Context provider para estado global de tema
│   └── themeRepository.ts # Persistencia de configuración de tema
├── types/
│   └── theme.ts          # Definiciones de tipos TypeScript
└── utils/
    └── themeUtils.ts     # Utilidades de validación de colores

components/
└── theme/
    ├── ThemeModeSelector.tsx  # Selector de modo (light/dark/system)
    ├── PresetSelector.tsx     # Selector y gestor de presets
    ├── PresetCard.tsx         # Tarjeta individual de preset
    ├── PresetCreateForm.tsx   # Formulario de creación de preset
    ├── ColorEditor.tsx        # Editor principal de colores
    ├── ColorInput.tsx         # Input individual para color OKLCH
    ├── ThemePreview.tsx       # Vista previa de componentes
    ├── ThemeActions.tsx       # Acciones (reset, etc.)
    └── index.ts               # Exportaciones barrel
```

## 🎨 Características Principales

### 1. Gestión de Modos de Tema
- **Light**: Tema claro
- **Dark**: Tema oscuro  
- **System**: Se adapta a la preferencia del sistema operativo

### 2. Presets de Colores
- **Presets predefinidos**: Temas listos para usar (Default, Blue, Green, Purple, Orange)
- **Presets personalizados**: Los usuarios pueden crear y guardar sus propios temas
- **Gestión completa**: Crear, editar, eliminar y seleccionar presets

### 3. Edición de Colores
- Soporte para formato **OKLCH** (perceptualmente uniforme)
- Validación en tiempo real de colores
- Vista previa instantánea
- Descripciones automáticas de colores
- **Organización por categorías**: Colores agrupados lógicamente
  - Colores base
  - Superficies
  - Elementos interactivos
  - Estados y acentos
  - Bordes
  - Gráficos
  - **Tipos de ausencia** (F, J, C, E, R, H)
  - **Colores de módulos** (10 colores para variedad)

### 4. Colores Personalizables para Módulos y Ausencias
- **Tipos de Ausencia**: Cada código tiene su color personalizable
  - **F** (Falta): Color de fondo y texto
  - **J** (Justificada): Color de fondo y texto
  - **C** (Compensada): Color de fondo y texto
  - **E** (Expulsión): Color de fondo y texto
  - **R** (Retraso): Color de fondo y texto
  - **H** (Huelga): Color de fondo y texto
- **Módulos**: 10 colores en la paleta
  - Los módulos se asignan automáticamente a un color basado en hash
  - Consistente para el mismo módulo en toda la aplicación

### 5. Persistencia
- Almacenamiento local (localStorage) para carga rápida
- Sincronización con servidor para respaldo
- Carga optimizada sin FOUC (Flash of Unstyled Content)

## 🔧 Hooks Personalizados

### `useTheme`
Hook principal para acceder a la configuración del tema y sus métodos.

```typescript
const { 
  config,                    // Configuración actual
  updateThemeMode,          // Actualizar modo (light/dark/system)
  updatePreset,             // Cambiar preset activo
  updateCustomColors,       // Modificar colores personalizados
  getActiveColors,          // Obtener colores activos
  getAllPresets,            // Obtener todos los presets
  createCustomPreset,       // Crear preset personalizado
  deleteCustomPreset,       // Eliminar preset personalizado
  saveCurrentAsPreset,      // Guardar configuración actual como preset
  resetToDefaults,          // Restaurar valores predeterminados
} = useTheme();
```

### `usePresetManager`
Hook especializado para la gestión de presets en la UI.

```typescript
const {
  allPresets,              // Lista completa de presets
  showCreateForm,          // Estado del formulario
  formData,                // Datos del formulario
  activePresetId,          // ID del preset activo
  handleCreatePreset,      // Crear nuevo preset
  handleDeletePreset,      // Eliminar preset
  handleSelectPreset,      // Seleccionar preset
  updateFormField,         // Actualizar campo del formulario
  toggleCreateForm,        // Mostrar/ocultar formulario
} = usePresetManager();
```

### `useColorEditor`
Hook para la edición de colores con validación.

```typescript
const {
  editMode,                // Modo de edición actual (light/dark)
  activeColors,            // Colores del modo activo
  handleColorChange,       // Cambiar un color
  switchEditMode,          // Cambiar modo de edición
  getColorError,           // Obtener si un color tiene error
  clearErrors,             // Limpiar errores de validación
} = useColorEditor();
```

## 🧩 Componentes Modulares

### `ThemeModeSelector`
Permite seleccionar entre modo claro, oscuro o sistema.

### `PresetSelector`
Gestiona la selección y creación de presets de colores.

### `ColorEditor`
Editor completo de colores con validación y vista previa.

### `ThemePreview`
Muestra una vista previa de cómo se verán los componentes con el tema actual.

### `ThemeActions`
Acciones relacionadas con el tema (restaurar defaults, etc.).

## 🎯 Constantes Importantes

### `COLOR_KEYS`
Array con todas las claves de colores disponibles para personalización.

### `ESSENTIAL_COLOR_KEYS`
Claves de colores más importantes (subset de COLOR_KEYS).

### `COLOR_CATEGORIES`
Organización de colores por categorías para mejor UI.

## 🔄 Flujo de Datos

```
┌─────────────────┐
│   Usuario UI    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Hook (useTheme)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ThemeContext    │
└────────┬────────┘
         │
         ├──────────────┐
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│ localStorage │  │  API Server  │
└──────────────┘  └──────────────┘
         │              │
         └──────┬───────┘
                ▼
         ┌──────────────┐
         │ ThemeProvider│
         └──────┬───────┘
                ▼
         ┌──────────────┐
         │  CSS Variables│
         └──────────────┘
```

## 🎨 Formato de Color OKLCH

El sistema usa el formato OKLCH para colores:

```
oklch(lightness chroma hue)
oklch(lightness chroma hue / alpha)
```

**Ventajas:**
- Perceptualmente uniforme
- Gamut más amplio que RGB
- Manipulación intuitiva de colores

**Ejemplo:**
```typescript
primary: 'oklch(0.5 0.17 250)'
// lightness: 0.5 (0-1)
// chroma: 0.17 (0-0.4 típicamente)
// hue: 250 (0-360)
```

## 🔐 Validación

El sistema incluye validación robusta:

- **Formato**: Valida sintaxis OKLCH correcta
- **Rangos**: Verifica que los valores estén en rangos válidos
- **Tiempo real**: Feedback instantáneo en la UI
- **Nombres de presets**: Longitud mínima/máxima

## 📊 Performance

- **Carga inicial**: Sincrónica desde localStorage (< 1ms)
- **Transiciones**: Optimizadas con View Transition API
- **Re-renders**: Minimizados con useCallback y useMemo
- **Persistencia**: Debounced para reducir escrituras

## 🧪 Extensibilidad

Para agregar nuevos colores:

1. Actualizar `ThemeColors` en `lib/types/theme.ts`
2. Agregar valores default en `DEFAULT_LIGHT_COLORS` y `DEFAULT_DARK_COLORS`
3. Actualizar `COLOR_KEYS` en `lib/theme/constants.ts`
4. Agregar a la categoría apropiada en `COLOR_CATEGORIES`

### Uso de Colores Personalizados en Componentes

Para usar los colores de ausencias y módulos en tus componentes:

```typescript
import { absenceColorStyle, moduleColorStyle } from "@/lib/utils/ui";

// Para ausencias
const style = absenceColorStyle("F"); // Retorna { backgroundColor, color, borderColor }
<div style={style}>Falta</div>

// Para módulos
const moduleStyle = moduleColorStyle("Matemáticas"); // Retorna { backgroundColor }
<span style={moduleStyle}>Matemáticas</span>
```

Las CSS variables se aplican automáticamente desde el tema activo.

## 📝 Mejores Prácticas

1. **Usa hooks en lugar de contexto directo**: `useTheme()` en lugar de `useContext(ThemeContext)`
2. **Componentes pequeños y enfocados**: Cada componente hace una cosa bien
3. **Validación temprana**: Valida en el hook antes de persistir
4. **Tipos estrictos**: Aprovecha TypeScript para prevenir errores
5. **Documentación**: Comenta las funciones públicas y casos edge

## 🔮 Futuras Mejoras Posibles

- [ ] Import/Export de temas como JSON
- [ ] Compartir temas entre usuarios
- [ ] Galería de temas comunitarios
- [ ] Generador automático de paletas
- [ ] Modo de alto contraste
- [ ] Soporte para más formatos de color (HSL, RGB con conversión)


