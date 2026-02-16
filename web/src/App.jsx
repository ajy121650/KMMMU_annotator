import { useMemo, useState } from 'react'
import './App.css'
import { loadExistingOutputCsv, loadInputCsv } from './lib/csvLoader'
import { downloadCsv, mergeRowsByItemId, upsertAnnotation } from './lib/mergeExport'

function App() {
  const [inputRows, setInputRows] = useState([])
  const [existingRows, setExistingRows] = useState([])
  const [currentRows, setCurrentRows] = useState([])
  const [annotatorId, setAnnotatorId] = useState('annotator-1')
  const [status, setStatus] = useState('')

  const mergedRows = useMemo(() => mergeRowsByItemId(existingRows, currentRows), [existingRows, currentRows])

  const onLoadInput = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const rows = await loadInputCsv(file)
      setInputRows(rows)
      setStatus(`Input loaded: ${rows.length} rows`)
    } catch (error) {
      setStatus(error.message)
    }
  }

  const onLoadExisting = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setExistingRows([])
      return
    }

    try {
      const rows = await loadExistingOutputCsv(file)
      setExistingRows(rows)
      setStatus(`Existing output loaded: ${rows.length} rows`)
    } catch (error) {
      setStatus(error.message)
    }
  }

  const addDemoAnnotation = () => {
    if (inputRows.length === 0) {
      setStatus('Load input CSV first.')
      return
    }

    const firstItem = inputRows[0]

    const annotation = {
      item_id: String(firstItem.item_id),
      annotator_id: annotatorId,
      human_judgement: 'correct',
      question_type_match: 'match',
      time_spent_sec: 15,
      comment: 'demo row',
      updated_at: new Date().toISOString(),
    }

    setCurrentRows((prev) => upsertAnnotation(prev, annotation))
    setStatus(`Demo annotation upserted for item_id=${annotation.item_id}`)
  }

  const exportMergedCsv = () => {
    if (mergedRows.length === 0) {
      setStatus('Nothing to export.')
      return
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const fileName = `merged_output_${annotatorId}_${timestamp}.csv`
    downloadCsv(mergedRows, fileName)
    setStatus(`Exported ${mergedRows.length} rows: ${fileName}`)
  }

  return (
    <main className="app">
      <h1>CSV Loader + Merge Export</h1>

      <section className="panel">
        <label>
          Input dataset CSV
          <input type="file" accept=".csv,text/csv" onChange={onLoadInput} />
        </label>

        <label>
          Existing output CSV (optional)
          <input type="file" accept=".csv,text/csv" onChange={onLoadExisting} />
        </label>

        <label>
          Annotator ID
          <input value={annotatorId} onChange={(e) => setAnnotatorId(e.target.value)} />
        </label>
      </section>

      <section className="panel actions">
        <button type="button" onClick={addDemoAnnotation}>
          Add Demo Annotation (first row)
        </button>
        <button type="button" onClick={exportMergedCsv}>
          Export Merged CSV
        </button>
      </section>

      <section className="panel stats">
        <p>Input rows: {inputRows.length}</p>
        <p>Existing output rows: {existingRows.length}</p>
        <p>Current session rows: {currentRows.length}</p>
        <p>Merged rows: {mergedRows.length}</p>
      </section>

      {status && <p className="status">{status}</p>}
    </main>
  )
}

export default App
