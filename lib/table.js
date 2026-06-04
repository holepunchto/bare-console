module.exports = function formatTable(tabularData, properties, format) {
  if (properties !== undefined && !Array.isArray(properties)) {
    throw new TypeError("The 'properties' argument must be an array")
  }

  if (tabularData === null || typeof tabularData !== 'object') return null

  const indices = Object.keys(tabularData)

  if (indices.length === 0) return null

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
  if (hasValues) header.push('Values')

  const formatCell = (value) => format(value).replace(/\r?\n/g, '\\n')

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

const ansi = /\x1b\[[0-9;]*m/g

function visibleLength(str) {
  return str.replace(ansi, '').length
}

function render(header, rows) {
  const widths = header.map((h, i) => {
    let max = visibleLength(h)
    for (const r of rows) max = Math.max(max, visibleLength(r[i]))
    return max
  })

  const border = (l, m, r) => l + widths.map((w) => '─'.repeat(w + 2)).join(m) + r

  const row = (cells) =>
    '│' + cells.map((c, i) => ` ${c}${' '.repeat(widths[i] - visibleLength(c))} `).join('│') + '│'

  return [
    border('┌', '┬', '┐'),
    row(header),
    border('├', '┼', '┤'),
    ...rows.map(row),
    border('└', '┴', '┘')
  ].join('\n')
}
