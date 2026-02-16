import Papa from 'papaparse'

const INPUT_REQUIRED_COLUMNS = ['item_id', 'question', 'answer', 'response']

function readFileAsText(file) {
  return file.text()
}

function parseCsvText(text) {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0]
    throw new Error(`CSV parse error at row ${first.row ?? 'unknown'}: ${first.message}`)
  }

  return parsed.data
}

function normalizeItemIdColumn(rawRow) {
  const row = { ...rawRow }

  // Source dataset uses an empty-header first column. Normalize it to item_id.
  if ((row.item_id === undefined || row.item_id === null || row.item_id === '') && row[''] !== undefined) {
    row.item_id = row['']
  }

  delete row['']

  return row
}

function assertRequiredColumns(rows, requiredColumns, csvName) {
  if (rows.length === 0) {
    throw new Error(`${csvName} is empty.`)
  }

  const keys = new Set(Object.keys(rows[0]))
  const missing = requiredColumns.filter((column) => !keys.has(column))

  if (missing.length > 0) {
    throw new Error(`${csvName} is missing required columns: ${missing.join(', ')}`)
  }
}

function assertItemId(rows, csvName) {
  rows.forEach((row, idx) => {
    if (!row.item_id || String(row.item_id).trim() === '') {
      throw new Error(`${csvName} has empty item_id at row index ${idx}`)
    }
  })
}

function assertUniqueItemId(rows, csvName) {
  const seen = new Set()

  rows.forEach((row) => {
    const key = String(row.item_id).trim()
    if (seen.has(key)) {
      throw new Error(`${csvName} has duplicated item_id: ${key}`)
    }
    seen.add(key)
  })
}

export async function loadInputCsv(file) {
  const text = await readFileAsText(file)
  const parsedRows = parseCsvText(text).map(normalizeItemIdColumn)

  assertRequiredColumns(parsedRows, INPUT_REQUIRED_COLUMNS, 'Input CSV')
  assertItemId(parsedRows, 'Input CSV')
  assertUniqueItemId(parsedRows, 'Input CSV')

  return parsedRows
}

export async function loadExistingOutputCsv(file) {
  if (!file) {
    return []
  }

  const text = await readFileAsText(file)
  const parsedRows = parseCsvText(text).map(normalizeItemIdColumn)

  if (parsedRows.length === 0) {
    return []
  }

  assertRequiredColumns(parsedRows, ['item_id'], 'Existing output CSV')
  assertItemId(parsedRows, 'Existing output CSV')

  return parsedRows
}

export { parseCsvText }
