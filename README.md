# cli-table-modern

Modern CLI table library for Node.js. Type-safe, zero-dependency, ESM-native revival of cli-table2.

## Features

- **TypeScript First** - Full type safety with strict TypeScript support
- **Zero Dependencies** - No lodash, no bloat
- **ESM Native** - Modern ES modules support
- **Colors** - ANSI colors, hex support, bold/underline styles
- **Colspan/Rowsspan** - Rich cells with spanning support
- **Custom Styling** - Preset styles (ASCII, Markdown, Rounded, Double)
- **Unicode Support** - Cross-platform box drawing characters

## Installation

```bash
npm install cli-table-modern
# or
pnpm add cli-table-modern
# or
yarn add cli-table-modern
```

## Quick Start

```typescript
import { createTable } from 'cli-table-modern'

const table = createTable(
  [
    ['Name', 'Age', 'City'],
    ['John', '28', 'New York'],
    ['Jane', '32', 'London'],
    ['Bob', '45', 'Tokyo']
  ],
  {
    head: ['Name', 'Age', 'City']
  }
)

console.log(table)
```

**Output:**
```
┌──────┬─────┬──────────┐
│ Name │ Age │ City     │
├──────┼─────┼──────────┤
│ John │ 28  │ New York │
│ Jane │ 32  │ London   │
│ Bob  │ 45  │ Tokyo    │
└──────┴─────┴──────────┘
```

## Colors

Built-in ANSI colors and hex color support:

```typescript
import { createTable, ANSI } from 'cli-table-modern'

const table = createTable(
  [['Name', 'Status', 'Score']],
  {
    head: ['Name', 'Status', 'Score'],
    style: {
      head: ['cyan', 'bold'],
      border: ['gray']
    }
  }
)
```

**Available ANSI colors:**
- Foreground: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`
- Background: `bgBlack`, `bgRed`, `bgGreen`, `bgYellow`, `bgBlue`, `bgMagenta`, `bgCyan`, `bgWhite`
- Styles: `bold`, `dim`, `italic`, `underline`, `inverse`, `hidden`

**Hex colors:** Use any hex code (e.g., `'#ff6b6b'`, `'#4ecdc4'`)

**Per-cell colors:** Apply colors to individual cells:

```typescript
import { createTable } from 'cli-table-modern'

const table = createTable(
  [
    [
      'Item',
      { content: 'Price', style: { color: 'green' } },
      { content: '$99.00', style: { color: '#ff6b6b' } }
    ]
  ]
)
```

## Colspan and Rowspan

Create advanced layouts with spanning cells:

```typescript
import { createTable } from 'cli-table-modern'

const table = createTable(
  [
    [
      { content: 'Header spans 3 columns', colSpan: 3 }
    ],
    ['Col1', 'Col2', 'Col3'],
    [
      { content: 'Spans 2 rows', rowSpan: 2 },
      'Cell 2',
      'Cell 3'
    ],
    ['', 'Cell 5', 'Cell 6']
  ],
  {
    head: ['Feature A', 'Feature B', 'Feature C']
  }
)
```

## Preset Styles

Choose from built-in border styles:

```typescript
import { createTable, STYLES } from 'cli-table-modern'

// ASCII style
const asciiTable = createTable(data, { chars: STYLES.ascii })

// Markdown-compatible
const markdownTable = createTable(data, { chars: STYLES.markdown })

// Rounded corners
const roundedTable = createTable(data, { chars: STYLES.rounded })

// Double lines
const doubleTable = createTable(data, { chars: STYLES.double })
```

**Style previews:**

```
ASCII:    +----+------+-------+       MARKDOWN: |----|----|----|
          | ID | Name | Value |                | ID | Name | Value |
          +----+------+-------+                |----|----|----|
          | 1  | Foo  | 100   |                | 1  | Foo  | 100   |
          +----+------+-------+                +----+----+-------+

ROUNDED:  ╭────┬─────┬──────╮       DOUBLE:   ╔════╦═════╦══════╗
          │ ID │ Name│ Value│                ║ ID ║ Name║ Value║
          ├────┼─────┼──────┤                ╠════╬═════╬══════╣
          │ 1  │ Foo │ 100  │                ║ 1  ║ Foo ║ 100  ║
          ╰────┴─────┴──────╯                ╚════╩═════╩══════╝
```

## Custom Borders

Override individual border characters:

```typescript
import { createTable, DEFAULT_CHARS } from 'cli-table-modern'

const table = createTable(
  [['Name', 'Value']],
  {
    chars: {
      ...DEFAULT_CHARS,
      top: '═',
      mid: '─',
      left: '║',
      right: '║'
    }
  }
)
```

## API Reference

### `createTable(data, options)`

Creates a formatted table from data.

```typescript
import { createTable, TableData, TableOptions } from 'cli-table-modern'

const table = createTable(data, options)
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `head` | `string[]` | Header row values |
| `colWidths` | `number[]` | Column widths in characters |
| `colAligns` | `('left'\|'center'\|'right')[]` | Column alignment |
| `chars` | `UnicodeChars` | Custom border characters |
| `style` | `TableStyle` | Styling options |

### TableStyle

```typescript
interface TableStyle {
  head?: Color[]           // Header colors/styles
  border?: Color[] | false // Border colors (false = no borders)
  compact?: boolean        // Compact mode
  padding?: number         // Cell padding
}
```

### CellStyle

```typescript
interface CellStyle {
  color?: Color        // Text color (ANSI name or hex)
  background?: Color   // Background color (ANSI name or hex)
}
```

### RichCell

```typescript
interface RichCell {
  content: string | number | boolean | null | undefined
  colSpan?: number     // Number of columns to span
  rowSpan?: number     // Number of rows to span
  style?: CellStyle    // Per-cell styling
}
```

### UnicodeChars

```typescript
interface UnicodeChars {
  top?: string         // Top border
  topMid?: string      // Top-mid junction
  topLeft?: string     // Top-left corner
  topRight?: string    // Top-right corner
  bottom?: string      // Bottom border
  bottomMid?: string   // Bottom-mid junction
  bottomLeft?: string  // Bottom-left corner
  bottomRight?: string // Bottom-right corner
  left?: string        // Left border
  leftMid?: string     // Left-mid junction
  mid?: string         // Mid horizontal
  midMid?: string      // Cross junction
  right?: string       // Right border
  rightMid?: string    // Right-mid junction
  cross?: string       // Center cross
}
```

## TypeScript

Full TypeScript support:

```typescript
import { createTable, TableOptions, TableData, RichCell } from 'cli-table-modern'

const options: TableOptions = {
  head: ['Name', 'Value'],
  colAligns: ['left', 'right'],
  style: {
    head: ['cyan', 'bold'],
    border: ['gray']
  }
}

const data: TableData = [
  ['Item 1', '100'],
  ['Item 2', '200']
]

const table = createTable(data, options)

// Rich cell with colspan
const richCell: RichCell = {
  content: 'Spanned Cell',
  colSpan: 2,
  style: { color: 'green' }
}
```

## Comparison

| Feature | cli-table3 | table | **cli-table-modern** |
|---------|------------|-------|----------------------|
| TypeScript | Partial | Yes | **Full** |
| ESM | Yes | Yes | **Native** |
| Dependencies | 1 | 0 | **0** |
| Size | 15KB | 8KB | **~3KB** |
| Colors | Limited | No | **ANSI + Hex** |
| Colspan/Rowsspan | Yes | No | **Yes** |

## License

MIT
