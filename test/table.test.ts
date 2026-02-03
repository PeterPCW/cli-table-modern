import { describe, it, expect } from 'vitest'
import { createTable, STYLES, ANSI, hexToAnsi, hexToAnsiBg, TableData, RichCell } from '../src'

describe('createTable', () => {
  it('creates a basic table', () => {
    const table = createTable([
      ['Name', 'Age'],
      ['John', '28'],
      ['Jane', '32']
    ])

    expect(table).toContain('John')
    expect(table).toContain('Jane')
    expect(table).toContain('│')
  })

  it('creates a table with header', () => {
    const table = createTable(
      [
        ['John', '28'],
        ['Jane', '32']
      ],
      {
        head: ['Name', 'Age']
      }
    )

    expect(table).toContain('Name')
    expect(table).toContain('Age')
    expect(table).toContain('John')
  })

  it('creates a table with custom style', () => {
    const table = createTable(
      [['Name', 'Age']],
      {
        chars: STYLES.ascii,
        style: { border: true }
      }
    )

    expect(table).toContain('|')
    expect(table).toContain('-')
    expect(table).toContain('+')
  })

  it('creates a table with markdown style', () => {
    const table = createTable(
      [['Name', 'Age']],
      {
        chars: STYLES.markdown,
        style: { border: false }
      }
    )

    expect(table).toContain('|')
  })

  it('handles empty data', () => {
    const table = createTable([])
    // Empty table should return empty string or just borders
    expect(table.length).toBeLessThan(20) // Should be minimal
  })

  it('handles numbers and booleans', () => {
    const table = createTable([
      ['Name', 'Active', 'Count'],
      ['John', true, 42],
      ['Jane', false, 99]
    ])

    expect(table).toContain('true')
    expect(table).toContain('false')
    expect(table).toContain('42')
    expect(table).toContain('99')
  })

  it('handles null and undefined', () => {
    const table = createTable([
      ['Name', 'Optional'],
      ['John', 'value'],
      ['Jane', null],
      ['Bob', undefined]
    ])

    expect(table).toContain('John')
    expect(table).toContain('Jane')
    expect(table).toContain('Bob')
  })

  it('aligns columns correctly', () => {
    const table = createTable(
      [['Name', 'Value']],
      {
        colAligns: ['left', 'right']
      }
    )

    // Just verify it doesn't throw
    expect(table.length).toBeGreaterThan(0)
  })

  it('creates table with colSpan', () => {
    const table = createTable([
      [{ content: 'Spanned', colSpan: 2 }, 'Col3'],
      ['A', 'B', 'C']
    ])

    expect(table).toContain('Spanned')
    expect(table).toContain('Col3')
  })

  it('creates table with rowSpan', () => {
    const table = createTable([
      [{ content: 'Vertical', rowSpan: 2 }, 'B'],
      ['A', 'C']
    ])

    expect(table).toContain('Vertical')
    expect(table).toContain('A')
  })

  it('creates table with rich cell styling', () => {
    const table = createTable([
      [{ content: 'Styled', style: { color: '#FF0000' } }, 'Normal']
    ])

    expect(table).toContain('Styled')
    // Should contain ANSI escape code
    expect(table).toContain('\x1b[38;5;')
  })
})

describe('ANSI colors', () => {
  it('hexToAnsi converts hex to ANSI 256 code', () => {
    const result = hexToAnsi('#FF0000')
    expect(result).toBe('\x1b[38;5;196m') // Red in 256-color
  })

  it('hexToAnsi handles 6-digit hex', () => {
    const result = hexToAnsi('#00FF00')
    expect(result).toContain('\x1b[38;5;')
  })

  it('hexToAnsi throws on invalid hex', () => {
    expect(() => hexToAnsi('invalid')).toThrow('Invalid hex color')
    expect(() => hexToAnsi('#GG0000')).toThrow('Invalid hex color')
    expect(() => hexToAnsi('#FF00')).toThrow('Invalid hex color')
    expect(() => hexToAnsi('')).toThrow('Invalid hex color')
  })

  it('hexToAnsiBg converts hex to ANSI 256 background code', () => {
    const result = hexToAnsiBg('#FF0000')
    expect(result).toBe('\x1b[48;5;196m') // Red background in 256-color
  })

  it('hexToAnsiBg throws on invalid hex', () => {
    expect(() => hexToAnsiBg('invalid')).toThrow('Invalid hex color')
    expect(() => hexToAnsiBg('#GG0000')).toThrow('Invalid hex color')
  })

  it('ANSI constants are defined', () => {
    expect(ANSI.reset).toBe('\x1b[0m')
    expect(ANSI.bold).toBe('\x1b[1m')
    expect(ANSI.cyan).toBe('\x1b[36m')
    expect(ANSI.red).toBe('\x1b[31m')
    expect(ANSI.bgGreen).toBe('\x1b[42m')
  })
})

describe('STYLES', () => {
  it('has ascii style', () => {
    expect(STYLES.ascii.left).toBe('|')
    expect(STYLES.ascii.top).toBe('-')
  })

  it('has markdown style', () => {
    expect(STYLES.markdown.left).toBe('|')
    expect(STYLES.markdown.top).toBe('-')
  })

  it('has rounded style', () => {
    expect(STYLES.rounded.left).toBe('│')
    expect(STYLES.rounded.top).toBe('─')
  })

  it('has double style', () => {
    expect(STYLES.double.left).toBe('║')
    expect(STYLES.double.top).toBe('═')
  })

  it('styles do not have cross property', () => {
    expect(STYLES.ascii.cross).toBeUndefined()
    expect(STYLES.markdown.cross).toBeUndefined()
    expect(STYLES.rounded.cross).toBeUndefined()
    expect(STYLES.double.cross).toBeUndefined()
  })
})

describe('complex layouts', () => {
  it('handles colspan and rowspan together', () => {
    const table = createTable([
      [{ content: 'Header', colSpan: 2, rowSpan: 2 }, 'Col3'],
      ['A', 'B']
    ])

    expect(table).toContain('Header')
    expect(table).toContain('Col3')
  })

  it('creates visually correct colspan layout', () => {
    const table = createTable([
      [{ content: 'Full Width', colSpan: 3 }],
      ['A', 'B', 'C']
    ])

    const lines = table.split('\n')
    // First row should have the spanning cell
    expect(lines[1]).toContain('Full Width')
  })

  it('handles rowSpan with header', () => {
    const table = createTable(
      [
        [{ content: 'Spanned', rowSpan: 2 }, 'B', 'C'],
        ['A', 'D', 'E']
      ],
      {
        head: ['Col1', 'Col2', 'Col3']
      }
    )

    expect(table).toContain('Spanned')
    expect(table).toContain('Col1')
    expect(table).toContain('Col2')
    expect(table).toContain('Col3')
  })

  it('handles empty string cells', () => {
    const table = createTable([['', 'Value']])
    expect(table).toContain('Value')
  })
})

describe('background colors', () => {
  it('applies background color to cells', () => {
    const table = createTable([
      [{ content: 'Red BG', style: { background: '#FF0000' } }]
    ])

    expect(table).toContain('Red BG')
    expect(table).toContain('\x1b[48;5;')
  })

  it('applies both color and background', () => {
    const table = createTable([
      [{ content: 'Styled', style: { color: '#FFFFFF', background: '#000000' } }]
    ])

    expect(table).toContain('Styled')
    expect(table).toContain('\x1b[38;5;') // foreground
    expect(table).toContain('\x1b[48;5;') // background
  })
})

describe('compact mode', () => {
  it('compact mode reduces padding', () => {
    const normal = createTable([['A', 'B']])
    const compact = createTable(
      [['A', 'B']],
      { style: { compact: true } }
    )

    // Compact should have less whitespace
    expect(compact.length).toBeLessThan(normal.length)
  })

  it('compact mode works with custom padding', () => {
    const table = createTable(
      [['A', 'B']],
      { style: { compact: true, padding: 0 } }
    )

    expect(table.length).toBeGreaterThan(0)
  })
})

describe('alignment', () => {
  it('aligns left (default)', () => {
    const table = createTable([['Hi']], { colAligns: ['left'] })
    expect(table).toContain('Hi')
  })

  it('aligns right', () => {
    const table = createTable([['Hi']], { colAligns: ['right'] })
    expect(table).toContain('Hi')
  })

  it('aligns center', () => {
    const table = createTable([['Hi']], { colAligns: ['center'] })
    expect(table).toContain('Hi')
  })

  it('all left alignment', () => {
    const table = createTable([['A', 'B']], { colAligns: ['left', 'left'] })
    expect(table).toContain('A')
    expect(table).toContain('B')
  })

  it('all right alignment', () => {
    const table = createTable([['A', 'B']], { colAligns: ['right', 'right'] })
    expect(table).toContain('A')
    expect(table).toContain('B')
  })

  it('all center alignment', () => {
    const table = createTable([['A', 'B']], { colAligns: ['center', 'center'] })
    expect(table).toContain('A')
    expect(table).toContain('B')
  })
})

describe('border options', () => {
  it('border false removes top and bottom borders', () => {
    const table = createTable(
      [['A', 'B']],
      { style: { border: false } }
    )

    // Should not contain top/bottom border characters
    expect(table).not.toContain('─')
    expect(table).not.toContain('┌')
    expect(table).not.toContain('┐')
    expect(table).not.toContain('└')
    expect(table).not.toContain('┘')
    // Vertical separators should still be present
    expect(table).toContain('│')
  })

  it('border false with custom chars removes top/bottom only', () => {
    const table = createTable(
      [['A', 'B']],
      {
        chars: STYLES.ascii,
        style: { border: false }
      }
    )

    // Top/bottom border characters should not appear
    expect(table).not.toContain('+')
    expect(table).not.toContain('-')
    // Vertical separators should still be present
    expect(table).toContain('|')
  })
})

describe('custom column widths', () => {
  it('applies custom colWidths with colspan', () => {
    const table = createTable(
      [
        [{ content: 'Wide', colSpan: 2 }, 'C']
      ],
      {
        colWidths: [20, 20, 10]
      }
    )

    expect(table).toContain('Wide')
    expect(table).toContain('C')
  })
})

describe('TypeScript types', () => {
  it('TableData type is exported', () => {
    const data: TableData = [
      ['A', 'B'],
      ['C', 'D']
    ]
    const table = createTable(data)
    expect(table).toContain('A')
  })

  it('RichCell type is exported', () => {
    const cell: RichCell = {
      content: 'Test',
      colSpan: 2,
      rowSpan: 1,
      style: { color: 'red' }
    }
    const table = createTable([[cell]])
    expect(table).toContain('Test')
  })
})
