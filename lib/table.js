const type = require('bare-type')

module.exports = function formatTable(tabularData, properties, format) {
  if (properties !== undefined && !Array.isArray(properties)) {
    throw new TypeError("The 'properties' argument must be an array")
  }

  if (tabularData === null || typeof tabularData !== 'object') return null

  const formatCell = (value) => format(value).replace(/\r\n|\r|\n/g, '\\n')

  const t = type(tabularData)

  if (t.isMap()) return renderMap(tabularData, formatCell)
  if (t.isSet()) return renderSet(tabularData, formatCell)

  const indices = Object.keys(tabularData)

  if (indices.length === 0) return render(['(index)'], [])

  const columns = properties !== undefined ? [...properties] : []
  let hasValues = false

  for (const index of indices) {
    const value = tabularData[index]

    if (value === null || typeof value !== 'object') {
      hasValues = true
      continue
    }

    if (properties === undefined) {
      for (const key of Object.keys(value)) {
        if (!columns.includes(key)) columns.push(key)
      }
    }
  }

  const header = ['(index)', ...columns]
  if (hasValues) header.push('values')

  const rows = indices.map((index) => {
    const value = tabularData[index]
    const row = new Array(header.length).fill('')

    row[0] = index

    if (value !== null && typeof value === 'object') {
      for (let i = 0; i < columns.length; i++) {
        if (Object.hasOwn(value, columns[i])) {
          row[i + 1] = formatCell(value[columns[i]])
        }
      }
    } else if (hasValues) {
      row[header.length - 1] = formatCell(value)
    }

    return row
  })

  return render(header, rows)
}

function renderMap(map, formatCell) {
  const header = ['(iteration index)', 'key', 'values']
  const rows = []

  let i = 0
  for (const [key, value] of map) {
    rows.push([String(i++), formatCell(key), formatCell(value)])
  }

  return render(header, rows)
}

function renderSet(set, formatCell) {
  const header = ['(iteration index)', 'values']
  const rows = []

  let i = 0
  for (const value of set) {
    rows.push([String(i++), formatCell(value)])
  }

  return render(header, rows)
}

function render(header, rows) {
  const widths = header.map((h, i) => {
    let max = stringWidth(h)
    for (const r of rows) max = Math.max(max, stringWidth(r[i]))
    return max
  })

  const border = (l, m, r) => l + widths.map((w) => '─'.repeat(w + 2)).join(m) + r

  const row = (cells) =>
    '│' + cells.map((c, i) => ` ${c}${' '.repeat(widths[i] - stringWidth(c))} `).join('│') + '│'

  return [
    border('┌', '┬', '┐'),
    row(header),
    border('├', '┼', '┤'),
    ...rows.map(row),
    border('└', '┴', '┘')
  ].join('\n')
}

const ansi = /\x1b\[[\d;?]*[a-zA-Z]/g

function stringWidth(str) {
  str = str.replace(ansi, '')

  let width = 0

  for (const char of str) {
    const code = char.codePointAt(0)

    if (isFullWidthCodePoint(code)) width += 2
    else if (!isZeroWidthCodePoint(code)) width += 1
  }

  return width
}

function isFullWidthCodePoint(code) {
  return (
    code >= 0x1100 &&
    (code <= 0x115f ||
      code === 0x2329 ||
      code === 0x232a ||
      (code >= 0x2e80 && code <= 0x3247 && code !== 0x303f) ||
      (code >= 0x3250 && code <= 0x4dbf) ||
      (code >= 0x4e00 && code <= 0xa4c6) ||
      (code >= 0xa960 && code <= 0xa97c) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe10 && code <= 0xfe19) ||
      (code >= 0xfe30 && code <= 0xfe6b) ||
      (code >= 0xff01 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x1b000 && code <= 0x1b001) ||
      (code >= 0x1f200 && code <= 0x1f251) ||
      (code >= 0x1f300 && code <= 0x1f64f) ||
      (code >= 0x1f680 && code <= 0x1f6ff) ||
      (code >= 0x1f900 && code <= 0x1f9ff) ||
      (code >= 0x1fa70 && code <= 0x1faff) ||
      (code >= 0x20000 && code <= 0x3fffd))
  )
}

function isZeroWidthCodePoint(code) {
  return (
    code <= 0x1f ||
    (code >= 0x7f && code <= 0x9f) ||
    (code >= 0x300 && code <= 0x36f) ||
    (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x20d0 && code <= 0x20ff) ||
    (code >= 0xfe00 && code <= 0xfe0f) ||
    (code >= 0xfe20 && code <= 0xfe2f) ||
    code === 0x200d ||
    (code >= 0xfff9 && code <= 0xfffb) ||
    (code >= 0xe0100 && code <= 0xe01ef)
  )
}
