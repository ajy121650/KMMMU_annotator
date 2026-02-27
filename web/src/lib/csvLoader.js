import Papa from 'papaparse'

const INPUT_REQUIRED_COLUMNS = ['question', 'answer', 'response', 'model_answer']

function parseCsvText(text) {
  const parsed = Papa.parse(text, {
    header: true,
    delimiter: ',',
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0]
    throw new Error(`CSV parse error at row ${first.row ?? 'unknown'}: ${first.message}`)
  }

  return parsed.data
}

function normalizeItemIdColumn(rawRow, index) {
  const row = { ...rawRow }

  if ((row.item_id === undefined || row.item_id === null || row.item_id === '') && row[''] !== undefined) {
    row.item_id = row['']
  }

  // New CSVs may not include an explicit item_id column.
  if (row.item_id === undefined || row.item_id === null || row.item_id === '') {
    row.item_id = String(index)
  }

  delete row['']
  return row
}

function normalizeRows(rows) {
  return rows.map((row, index) => normalizeItemIdColumn(row, index))
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

function looksLikeHtml(text) {
  const head = text.trimStart().slice(0, 200).toLowerCase()
  return head.startsWith('<!doctype html') || head.startsWith('<html')
}

async function fetchCsvText(path, options = {}) {
  const { optional = false } = options
  const response = await fetch(path)

  if (!response.ok) {
    if (optional && response.status === 404) {
      return null
    }
    throw new Error(`Failed to fetch ${path} (HTTP ${response.status})`)
  }

  const text = await response.text()

  // In dev mode, missing static files may resolve to index.html (status 200).
  if (looksLikeHtml(text)) {
    if (optional) {
      return null
    }
    throw new Error(`Expected CSV but received HTML at ${path}. Check file path/publicDir.`)
  }

  return text
}

export async function loadInputCsvFromPath(path, csvName = 'Input CSV') {
  const text = await fetchCsvText(path, { optional: false })
  const parsedRows = normalizeRows(parseCsvText(text))

  assertRequiredColumns(parsedRows, INPUT_REQUIRED_COLUMNS, csvName)
  assertItemId(parsedRows, csvName)
  assertUniqueItemId(parsedRows, csvName)

  return parsedRows
}

export async function loadExistingOutputCsvFromPath(path, csvName = 'Existing output CSV') {
  const text = await fetchCsvText(path, { optional: true })

  if (text === null) {
    return []
  }

  const parsedRows = normalizeRows(parseCsvText(text))

  if (parsedRows.length === 0) {
    return []
  }

  assertRequiredColumns(parsedRows, ['item_id'], csvName)
  assertItemId(parsedRows, csvName)

  return parsedRows
}

export { parseCsvText, normalizeRows }
