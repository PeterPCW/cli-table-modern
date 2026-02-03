/**
 * Convert a hex color to ANSI 256-color escape code
 */
export function hexToAnsi(hex: string): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}. Expected format: #RRGGBB`)
  }

  const hexCode = hex.slice(1)
  const r = parseInt(hexCode.slice(0, 2), 16)
  const g = parseInt(hexCode.slice(2, 4), 16)
  const b = parseInt(hexCode.slice(4, 6), 16)

  // ANSI 256-color formula
  const ansi = 16 + (36 * Math.round(r / 51)) + (6 * Math.round(g / 51)) + Math.round(b / 51)
  return `\x1b[38;5;${ansi}m`
}

export const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m',
  hidden: '\x1b[8m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
}

export function hexToAnsiBg(hex: string): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}. Expected format: #RRGGBB`)
  }

  const hexCode = hex.slice(1)
  const r = parseInt(hexCode.slice(0, 2), 16)
  const g = parseInt(hexCode.slice(2, 4), 16)
  const b = parseInt(hexCode.slice(4, 6), 16)

  // ANSI 256-color formula for background (48;5)
  const ansi = 16 + (36 * Math.round(r / 51)) + (6 * Math.round(g / 51)) + Math.round(b / 51)
  return `\x1b[48;5;${ansi}m`
}

export type Color = string | [string, ...string[]]
export type CellStyle = {
  color?: Color
  background?: Color
}

/**
 * Unicode characters for table borders
 */
export interface UnicodeChars {
  top?: string
  topMid?: string
  topLeft?: string
  topRight?: string
  bottom?: string
  bottomMid?: string
  bottomLeft?: string
  bottomRight?: string
  left?: string
  leftMid?: string
  mid?: string
  midMid?: string
  right?: string
  rightMid?: string
}

export const DEFAULT_CHARS: UnicodeChars = {
  top: '─',
  topMid: '┬',
  topLeft: '┌',
  topRight: '┐',
  bottom: '─',
  bottomMid: '┴',
  bottomLeft: '└',
  bottomRight: '┘',
  left: '│',
  leftMid: '├',
  mid: '─',
  midMid: '┼',
  right: '│',
  rightMid: '┤'
}

/**
 * Style options for the table
 */
export interface TableStyle {
  head?: Color[]
  border?: Color[] | false
  compact?: boolean
  padding?: number
}

/**
 * Table cell data - supports simple values or rich objects with colspan/rowspan
 */
export type TableCell = string | number | boolean | null | undefined | RichCell

/**
 * Rich cell with colspan, rowspan, and styling
 */
export interface RichCell {
  content: string | number | boolean | null | undefined
  colSpan?: number
  rowSpan?: number
  style?: CellStyle
}

/**
 * Table row data
 */
export type TableRow = TableCell[]

/**
 * Alias for TableRow for backwards compatibility
 */
export type TableData = TableRow

/**
 * Table options
 */
export interface TableOptions {
  chars?: UnicodeChars
  style?: TableStyle
  head?: string[]
  colWidths?: number[]
  colAligns?: ('left' | 'center' | 'right')[]
}

/**
 * Internal cell with position info for rendering
 */
interface PositionedCell {
  row: number
  col: number
  colSpan: number
  rowSpan: number
  content: string
  style?: CellStyle
}

/**
 * Convert any TableCell to string content
 */
function cellToString(cell: TableCell): string {
  if (cell === null || cell === undefined) return ''
  if (typeof cell === 'object') return String(cell.content)
  return String(cell)
}

/**
 * Check if cell is a rich cell with colspan/rowspan
 */
function isRichCell(cell: TableCell): cell is RichCell {
  return typeof cell === 'object' && cell !== null && 'content' in cell
}

/**
 * Parse a table row into positioned cells, handling colspan/rowspan
 */
function parseRow(
  row: TableRow,
  rowIndex: number,
  occupied: Map<string, boolean>
): PositionedCell[] {
  const cells: PositionedCell[] = []
  let colIndex = 0

  for (const cell of row) {
    // Skip columns occupied by rowspan from previous rows
    while (occupied.has(`${rowIndex}:${colIndex}`)) {
      colIndex++
    }

    if (cell === null || cell === undefined) {
      colIndex++
      continue
    }

    const rich = isRichCell(cell)
    const posCell: PositionedCell = {
      row: rowIndex,
      col: colIndex,
      colSpan: rich ? (cell.colSpan || 1) : 1,
      rowSpan: rich ? (cell.rowSpan || 1) : 1,
      content: cellToString(cell),
      style: rich ? cell.style : undefined
    }

    cells.push(posCell)
    colIndex += posCell.colSpan
  }

  return cells
}

/**
 * Mark cells as occupied based on colspan/rowspan
 */
function markOccupied(
  cells: PositionedCell[],
  occupied: Map<string, boolean>
): void {
  for (const cell of cells) {
    for (let r = 0; r < cell.rowSpan; r++) {
      for (let c = 0; c < cell.colSpan; c++) {
        occupied.set(`${cell.row + r}:${cell.col + c}`, true)
      }
    }
  }
}

/**
 * Calculate the width of each column, accounting for colspan
 */
function calculateColumnWidths(
  head: string[] | undefined,
  rows: TableRow[],
  options: TableOptions
): number[] {
  const allRows: PositionedCell[][] = []
  const occupied = new Map<string, boolean>()

  // Parse header
  if (head) {
    const headCells: PositionedCell[] = head.map((content, col) => ({
      row: -1,
      col,
      colSpan: 1,
      rowSpan: 1,
      content
    }))
    allRows.push(headCells)
  }

  // Parse data rows
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const cells = parseRow(rows[rowIndex], rowIndex, occupied)
    allRows.push(cells)
    markOccupied(cells, occupied)
  }

  const widths: number[] = []

  // Get max width for each column
  const numCols = Math.max(...allRows.map(row => Math.max(...row.map(c => c.col + c.colSpan))))

  for (let col = 0; col < numCols; col++) {
    let maxWidth = 0

    for (const row of allRows) {
      const cell = row.find(c => c.col === col)
      if (cell) {
        // Calculate width of this cell across all its columns
        let cellWidth = cell.content.length
        for (let c = 1; c < cell.colSpan; c++) {
          const nextCell = row.find(r => r.col === col + c)
          if (!nextCell) {
            // This column is spanned, count it in the cell width
            const definedWidth = options.colWidths?.[col + c] ?? 10
            cellWidth += definedWidth
          }
        }
        if (cellWidth > maxWidth) {
          maxWidth = cellWidth
        }
      }
    }

    const padding = 2
    widths.push((options.colWidths?.[col] ?? maxWidth) + padding)
  }

  return widths
}

/**
 * Apply color to a string
 */
function applyColor(text: string, color?: Color, background?: Color): string {
  if (!color && !background) return text

  const codes: string[] = []

  const processColor = (c: string, isBg: boolean) => {
    if (c.startsWith('#')) {
      codes.push(isBg ? hexToAnsiBg(c) : hexToAnsi(c))
    } else {
      codes.push(c)
    }
  }

  if (color) {
    if (Array.isArray(color)) {
      for (const c of color) processColor(c, false)
    } else {
      processColor(color, false)
    }
  }

  if (background) {
    if (Array.isArray(background)) {
      for (const c of background) processColor(c, true)
    } else {
      processColor(background, true)
    }
  }

  return codes.join('') + text + ANSI.reset
}

/**
 * Pad a string to a specific width with alignment
 */
function padCell(
  content: string,
  width: number,
  align: 'left' | 'center' | 'right' = 'left'
): string {
  const actualWidth = width - 2 // Account for padding
  const str = content.slice(0, actualWidth)
  const padding = 1

  if (align === 'center') {
    const left = Math.ceil((actualWidth - str.length) / 2)
    const right = actualWidth - str.length - left
    return ' '.repeat(left) + str.padEnd(str.length + right, ' ') + ' '.repeat(right)
  } else if (align === 'right') {
    return ' '.repeat(padding) + str.padEnd(actualWidth, ' ') + ' '.repeat(padding)
  }

  return ' '.repeat(padding) + str.padEnd(actualWidth, ' ') + ' '.repeat(padding)
}

/**
 * Create a border line for the table
 */
function createBorder(
  widths: number[],
  chars: UnicodeChars,
  left: keyof UnicodeChars,
  mid: keyof UnicodeChars,
  right: keyof UnicodeChars,
  fill: keyof UnicodeChars
): string {
  const parts = [chars[left] ?? '']

  for (let i = 0; i < widths.length; i++) {
    parts.push((chars[fill] ?? '─').repeat(widths[i]))

    if (i < widths.length - 1) {
      parts.push(chars[mid] ?? '┼')
    }
  }

  parts.push(chars[right] ?? '')
  return parts.join('')
}

/**
 * Create a row line for the table with colspan support
 */
function createRow(
  row: PositionedCell[],
  widths: number[],
  chars: UnicodeChars,
  aligns: ('left' | 'center' | 'right')[],
  style: TableStyle
): string {
  const padding = style.compact ? 0 : (style.padding ?? 1)
  const parts: string[] = []
  let colIndex = 0

  parts.push(chars.left ?? '│')

  while (colIndex < widths.length) {
    // Check if this cell spans from a previous column
    const spanningCell = row.find(c => c.col < colIndex && c.col + c.colSpan > colIndex)

    if (spanningCell) {
      // This column is part of a spanning cell
      colIndex++
      continue
    }

    const cell = row.find(c => c.col === colIndex)

    if (cell) {
      // Calculate total width of this cell including spanned columns
      let cellWidth = widths[colIndex]
      for (let c = 1; c < cell.colSpan; c++) {
        if (widths[colIndex + c]) {
          cellWidth += widths[colIndex + c]
        }
      }

      const align = aligns[cell.col] ?? 'left'
      const padded = padCell(cell.content, cellWidth, align)
      const colored = applyColor(padded, cell.style?.color, cell.style?.background)

      parts.push(' '.repeat(padding))
      parts.push(colored)
      parts.push(' '.repeat(padding))

      colIndex += cell.colSpan

      // Add separator if there are more columns
      if (colIndex < widths.length) {
        parts.push(chars.left ?? '│')
      }
    } else {
      // Empty cell
      parts.push(' '.repeat(padding))
      parts.push(' '.repeat(widths[colIndex] - 2))
      parts.push(' '.repeat(padding))
      colIndex++

      if (colIndex < widths.length) {
        parts.push(chars.left ?? '│')
      }
    }
  }

  parts.push(chars.right ?? '│')
  return parts.join('')
}

/**
 * Create an ASCII table from data
 *
 * @example
 * ```ts
 * import { createTable } from 'cli-table-modern'
 *
 * const table = createTable([
 *   ['Name', 'Age', 'City'],
 *   ['John', '28', 'New York'],
 *   ['Jane', '32', 'London']
 * ])
 *
 * console.log(table)
 * ```
 */
export function createTable(
  data: TableRow[],
  options: TableOptions = {}
): string {
  const chars = { ...DEFAULT_CHARS, ...options.chars }
  const style: TableStyle = options.style || {}
  const aligns = options.colAligns || Array(data[0]?.length || 0).fill('left')

  // Calculate column widths
  const widths = calculateColumnWidths(options.head, data, options)

  const lines: string[] = []
  const occupied = new Map<string, boolean>()

  // Top border
  if (style.border !== false) {
    lines.push(createBorder(widths, chars, 'topLeft', 'topMid', 'topRight', 'top'))
  }

  // Header row
  if (options.head) {
    const headerCells: PositionedCell[] = options.head.map((content, col) => ({
      row: -1,
      col,
      colSpan: 1,
      rowSpan: 1,
      content
    }))
    // Mark header cells as occupied so rowspan from data rows doesn't overlap
    for (const cell of headerCells) {
      occupied.set(`-1:${cell.col}`, true)
    }
    const headerRow = createRow(headerCells, widths, chars, aligns, style)
    lines.push(applyColor(headerRow, style.head?.[0]))
    lines.push(createBorder(widths, chars, 'leftMid', 'midMid', 'rightMid', 'mid'))
  }

  // Data rows
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const cells = parseRow(data[rowIndex], rowIndex, occupied)
    lines.push(createRow(cells, widths, chars, aligns, style))
    markOccupied(cells, occupied)
  }

  // Bottom border
  if (style.border !== false) {
    lines.push(createBorder(widths, chars, 'bottomLeft', 'bottomMid', 'bottomRight', 'bottom'))
  }

  return lines.join('\n')
}

/**
 * Export character sets for different table styles
 */
export const STYLES = {
  ascii: {
    top: '-',
    topMid: '+',
    topLeft: '+',
    topRight: '+',
    bottom: '-',
    bottomMid: '+',
    bottomLeft: '+',
    bottomRight: '+',
    left: '|',
    leftMid: '+',
    mid: '-',
    midMid: '+',
    right: '|',
    rightMid: '+'
  },
  markdown: {
    top: '-',
    topMid: '-',
    topLeft: '|',
    topRight: '|',
    bottom: '-',
    bottomMid: '-',
    bottomLeft: '|',
    bottomRight: '|',
    left: '|',
    leftMid: '|',
    mid: '-',
    midMid: '|',
    right: '|',
    rightMid: '|'
  },
  rounded: {
    top: '─',
    topMid: '┬',
    topLeft: '╭',
    topRight: '╮',
    bottom: '─',
    bottomMid: '┴',
    bottomLeft: '╰',
    bottomRight: '╯',
    left: '│',
    leftMid: '├',
    mid: '─',
    midMid: '┼',
    right: '│',
    rightMid: '┤'
  },
  double: {
    top: '═',
    topMid: '╦',
    topLeft: '╔',
    topRight: '╗',
    bottom: '═',
    bottomMid: '╩',
    bottomLeft: '╚',
    bottomRight: '╝',
    left: '║',
    leftMid: '╠',
    mid: '═',
    midMid: '╬',
    right: '║',
    rightMid: '╣'
  }
}
