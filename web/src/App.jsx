import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  loadExistingOutputCsvFromPath,
  loadInputCsvFromPath,
} from "./lib/csvLoader";
import { downloadCsv, mergeRowsByItemId } from "./lib/mergeExport";

const DATASETS = [
  {
    key: "gpt-5-mini",
    label: "gpt-5-mini",
    inputPath: "/input/gpt-5-mini-llm-judge.csv",
    outputPath: "/output/gpt-5-mini-annotations.csv",
  },
  {
    key: "qwen3-2b",
    label: "qwen3-2b",
    inputPath: "/input/qwen3-VL-2b-it-llm-judge.csv",
    outputPath: "/output/qwen3-2b-annotations.csv",
  },
  {
    key: "qwen3-30b",
    label: "qwen3-30b",
    inputPath: "/input/qwen3-VL-30b-it-llm-judge.csv",
    outputPath: "/output/qwen3-30b-annotations.csv",
  },
  {
    key: "varco2-14b",
    label: "varco2-14b",
    inputPath: "/input/varco2-14b-llm-judge.csv",
    outputPath: "/output/varco2-14b-annotations.csv",
  },
];

const EMPTY_FORM = {
  human_judgement: "",
  question_type_match: "",
  visual_type_check: "",
  comment: "",
};

function parseImageLinks(raw) {
  if (!raw) return [];

  const text = String(raw).trim();
  if (!text) return [];

  try {
    const normalized = text.replace(/'/g, '"');
    const parsed = JSON.parse(normalized);
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v));
    }
    return [];
  } catch {
    return [text];
  }
}

function getLocalStorageKey(datasetKey) {
  return `annotations:${datasetKey}`;
}

function loadSavedAnnotations(datasetKey) {
  const raw = localStorage.getItem(getLocalStorageKey(datasetKey));
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAnnotations(datasetKey, annotationMap) {
  localStorage.setItem(
    getLocalStorageKey(datasetKey),
    JSON.stringify(annotationMap),
  );
}

function getItemId(row) {
  return String(row?.item_id ?? "");
}

function formatElapsed(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function App() {
  const [datasets, setDatasets] = useState(() =>
    DATASETS.reduce((acc, dataset) => {
      acc[dataset.key] = {
        rows: [],
        existingOutputRows: [],
        status: "loading",
        error: "",
      };
      return acc;
    }, {}),
  );

  const [selectedDatasetKey, setSelectedDatasetKey] = useState(DATASETS[0].key);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jumpIndexInput, setJumpIndexInput] = useState("0");
  const [annotatorId, setAnnotatorId] = useState("annotator-1");
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusMessage, setStatusMessage] = useState("");
  const [zoomImageUrl, setZoomImageUrl] = useState("");
  const [failedImageUrls, setFailedImageUrls] = useState({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [annotationsByDataset, setAnnotationsByDataset] = useState(() =>
    DATASETS.reduce((acc, dataset) => {
      acc[dataset.key] = loadSavedAnnotations(dataset.key);
      return acc;
    }, {}),
  );

  const itemOpenedAtRef = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      for (const dataset of DATASETS) {
        try {
          const [rows, existingOutputRows] = await Promise.all([
            loadInputCsvFromPath(
              dataset.inputPath,
              `${dataset.label} input CSV`,
            ),
            loadExistingOutputCsvFromPath(
              dataset.outputPath,
              `${dataset.label} existing output CSV`,
            ),
          ]);

          if (cancelled) return;

          setDatasets((prev) => ({
            ...prev,
            [dataset.key]: {
              rows,
              existingOutputRows,
              status: "ready",
              error: "",
            },
          }));
        } catch (error) {
          if (cancelled) return;

          setDatasets((prev) => ({
            ...prev,
            [dataset.key]: {
              rows: [],
              existingOutputRows: [],
              status: "error",
              error: error.message,
            },
          }));
        }
      }
    }

    loadAll();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setZoomImageUrl("");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = Math.max(
        0,
        Math.floor((Date.now() - itemOpenedAtRef.current) / 1000),
      );
      setElapsedSeconds(next);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const selectedDataset = datasets[selectedDatasetKey];
  const selectedRows = selectedDataset?.rows ?? [];
  const maxIndex = Math.max(selectedRows.length - 1, 0);
  const safeCurrentIndex = Math.min(Math.max(currentIndex, 0), maxIndex);
  const currentRow = selectedRows[safeCurrentIndex] || null;
  const currentItemId = currentRow ? getItemId(currentRow) : "";
  const currentAnnotationMap = annotationsByDataset[selectedDatasetKey] ?? {};
  const currentAnnotation = currentItemId
    ? currentAnnotationMap[currentItemId]
    : null;

  useEffect(() => {
    setCurrentIndex(0);
    setJumpIndexInput("0");
    setZoomImageUrl("");
    setFailedImageUrls({});
  }, [selectedDatasetKey]);

  useEffect(() => {
    if (!currentRow) {
      setForm(EMPTY_FORM);
      return;
    }

    setForm({
      human_judgement: currentAnnotation?.human_judgement ?? "",
      question_type_match: currentAnnotation?.question_type_match ?? "",
      visual_type_check: currentAnnotation?.visual_type_check ?? "",
      comment: currentAnnotation?.comment ?? "",
    });

    itemOpenedAtRef.current = Date.now();
    setElapsedSeconds(0);
    setZoomImageUrl("");
    setFailedImageUrls({});
  }, [selectedDatasetKey, safeCurrentIndex, currentItemId]);

  const completedCount = useMemo(
    () => Object.keys(currentAnnotationMap).length,
    [currentAnnotationMap],
  );
  const recordCount = selectedRows.length;

  const moveIndex = (delta) => {
    if (recordCount === 0) return;

    const next = Math.min(Math.max(safeCurrentIndex + delta, 0), maxIndex);
    setCurrentIndex(next);
    setJumpIndexInput(String(next));
  };

  const onJumpToIndex = () => {
    if (recordCount === 0) return;

    const parsed = Number(jumpIndexInput);
    if (!Number.isInteger(parsed)) {
      setStatusMessage("인덱스는 정수여야 합니다.");
      return;
    }

    if (parsed < 0 || parsed > maxIndex) {
      setStatusMessage(`인덱스 범위 오류: 0 ~ ${maxIndex}`);
      return;
    }

    setCurrentIndex(parsed);
  };

  const onImageLoadError = (url) => {
    setFailedImageUrls((prev) => ({
      ...prev,
      [url]: true,
    }));
  };

  const saveCurrentAnnotation = () => {
    if (!currentRow) return;

    if (
      !form.human_judgement ||
      !form.question_type_match ||
      !form.visual_type_check
    ) {
      setStatusMessage(
        "판정, 문제유형 검사, 이미지 타입 검사를 모두 선택해주세요.",
      );
      return;
    }

    const elapsedSec = Math.max(
      1,
      Math.floor((Date.now() - itemOpenedAtRef.current) / 1000),
    );

    const next = {
      item_id: currentItemId,
      annotator_id: annotatorId,
      human_judgement: form.human_judgement,
      question_type_match: form.question_type_match,
      visual_type_check: form.visual_type_check,
      comment: form.comment,
      time_spent_sec: elapsedSec,
      updated_at: new Date().toISOString(),
    };

    setAnnotationsByDataset((prev) => {
      const previousMap = prev[selectedDatasetKey] ?? {};
      const nextMap = {
        ...previousMap,
        [currentItemId]: next,
      };

      saveAnnotations(selectedDatasetKey, nextMap);

      return {
        ...prev,
        [selectedDatasetKey]: nextMap,
      };
    });

    setStatusMessage(
      `저장 완료: ${selectedDatasetKey} / item_id=${currentItemId}`,
    );
    itemOpenedAtRef.current = Date.now();
    setElapsedSeconds(0);
  };

  const exportMerged = () => {
    const existingRows = selectedDataset?.existingOutputRows ?? [];
    const currentRows = Object.values(currentAnnotationMap);
    const mergedRows = mergeRowsByItemId(existingRows, currentRows);

    if (mergedRows.length === 0) {
      setStatusMessage("Export할 데이터가 없습니다.");
      return;
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const fileName = `${selectedDatasetKey}-annotations-${timestamp}.csv`;

    downloadCsv(mergedRows, fileName);
    setStatusMessage(`Export 완료: ${fileName} (${mergedRows.length} rows)`);
  };

  const imageLinks = parseImageLinks(currentRow?.image_link);

  return (
    <main className="app">
      <header className="topbar">
        <h1>LLM Judge Annotator</h1>
        <div className="inline-controls">
          <label>
            Annotator ID
            <input
              value={annotatorId}
              onChange={(e) => setAnnotatorId(e.target.value)}
            />
          </label>
          <button type="button" onClick={exportMerged}>
            Export CSV
          </button>
        </div>
      </header>

      <section className="dataset-selector">
        {DATASETS.map((dataset) => {
          const state = datasets[dataset.key];
          const loadedCount = state?.rows?.length ?? 0;
          const doneCount = Object.keys(
            annotationsByDataset[dataset.key] ?? {},
          ).length;
          const isSelected = selectedDatasetKey === dataset.key;

          return (
            <button
              key={dataset.key}
              type="button"
              className={`dataset-card ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedDatasetKey(dataset.key)}
            >
              <strong>{dataset.label}</strong>
              <span>records: {loadedCount}</span>
              <span>annotated: {doneCount}</span>
              <span>status: {state?.status}</span>
            </button>
          );
        })}
      </section>

      {selectedDataset?.status === "error" && (
        <p className="error">{selectedDataset.error}</p>
      )}

      <section className="navigator">
        <div>
          <strong>{selectedDatasetKey}</strong>
          <span>
            {" "}
            index {safeCurrentIndex} / {maxIndex} (total {recordCount})
          </span>
        </div>

        <div className="inline-controls">
          <button type="button" onClick={() => moveIndex(-1)}>
            {"<"}
          </button>
          <button type="button" onClick={() => moveIndex(1)}>
            {">"}
          </button>

          <input
            className="index-input"
            value={jumpIndexInput}
            onChange={(e) => setJumpIndexInput(e.target.value)}
            placeholder="index"
          />
          <button type="button" onClick={onJumpToIndex}>
            Go
          </button>
        </div>
      </section>

      {!currentRow ? (
        <p className="error">
          선택한 데이터셋에서 레코드를 불러오지 못했습니다.
        </p>
      ) : (
        <section className="workspace">
          <div className="left-panel">
            <h2>Question</h2>
            <pre>{currentRow.question}</pre>
            <p>
              <strong>Question Type:</strong> {currentRow.question_type || "-"}
            </p>

            {imageLinks.length > 0 && (
              <div>
                <h3>Images</h3>
                <div className="image-grid">
                  {imageLinks.map((link) => {
                    const failed = Boolean(failedImageUrls[link]);

                    return (
                      <button
                        key={link}
                        type="button"
                        className="image-thumb"
                        onClick={() => {
                          if (!failed) {
                            setZoomImageUrl(link);
                          }
                        }}
                        title={failed ? "이미지 로드 실패" : "클릭해서 확대"}
                      >
                        {failed ? (
                          <div className="image-fallback">이미지 로드 실패</div>
                        ) : (
                          <img
                            src={link}
                            alt="question"
                            loading="lazy"
                            onError={() => onImageLoadError(link)}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <p>
              <strong>image type(첫번째 사진 기준):</strong>{" "}
              {currentRow.visual_type || "-"}
            </p>

            <h3>Model Response</h3>
            <pre>{currentRow.response}</pre>

            <p>
              <strong>Model Answer:</strong> {currentRow.model_answer || "-"}
            </p>
          </div>

          <div className="right-panel">
            <section className="box">
              <h2>Gold Answer</h2>
              <pre>{currentRow.answer}</pre>
            </section>

            <section className="box">
              <h3>정답/오답 판정</h3>
              <div className="options">
                <label>
                  <input
                    type="radio"
                    name="human_judgement"
                    checked={form.human_judgement === "correct"}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        human_judgement: "correct",
                      }))
                    }
                  />
                  correct
                </label>
                <label>
                  <input
                    type="radio"
                    name="human_judgement"
                    checked={form.human_judgement === "incorrect"}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        human_judgement: "incorrect",
                      }))
                    }
                  />
                  incorrect
                </label>
                <label>
                  <input
                    type="radio"
                    name="human_judgement"
                    checked={form.human_judgement === "no_answer"}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        human_judgement: "no_answer",
                      }))
                    }
                  />
                  no_answer
                </label>
              </div>
            </section>

            <section className="box">
              <h3>문제 유형 검사</h3>
              <div className="options">
                <label>
                  <input
                    type="radio"
                    name="question_type_match"
                    checked={form.question_type_match === "match"}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        question_type_match: "match",
                      }))
                    }
                  />
                  match
                </label>
                <label>
                  <input
                    type="radio"
                    name="question_type_match"
                    checked={form.question_type_match === "mismatch"}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        question_type_match: "mismatch",
                      }))
                    }
                  />
                  mismatch
                </label>
                <label>
                  <input
                    type="radio"
                    name="question_type_match"
                    checked={form.question_type_match === "unsure"}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        question_type_match: "unsure",
                      }))
                    }
                  />
                  unsure
                </label>
              </div>
            </section>

            <section className="box">
              <h3>이미지 타입 검사</h3>
              <div className="options">
                <label>
                  <input
                    type="radio"
                    name="visual_type_check"
                    checked={form.visual_type_check === "match"}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        visual_type_check: "match",
                      }))
                    }
                  />
                  match
                </label>
                <label>
                  <input
                    type="radio"
                    name="visual_type_check"
                    checked={form.visual_type_check === "mismatch"}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        visual_type_check: "mismatch",
                      }))
                    }
                  />
                  mismatch
                </label>
                <label>
                  <input
                    type="radio"
                    name="visual_type_check"
                    checked={form.visual_type_check === "unsure"}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        visual_type_check: "unsure",
                      }))
                    }
                  />
                  unsure
                </label>
              </div>
            </section>

            <section className="box">
              <h3>Comment</h3>
              <textarea
                value={form.comment}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, comment: e.target.value }))
                }
                rows={4}
              />
            </section>

            <section className="time-box">
              <span>판정 시간</span>
              <strong>{formatElapsed(elapsedSeconds)}</strong>
            </section>

            <section className="actions">
              <button type="button" onClick={saveCurrentAnnotation}>
                Save Annotation
              </button>
              <button type="button" onClick={() => moveIndex(-1)}>
                Previous
              </button>
              <button type="button" onClick={() => moveIndex(1)}>
                Next
              </button>
              <span>
                completed: {completedCount}/{recordCount}
              </span>
            </section>
          </div>
        </section>
      )}

      {statusMessage && <p className="status">{statusMessage}</p>}

      {zoomImageUrl && (
        <div
          className="image-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomImageUrl("")}
        >
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="image-modal-close"
              onClick={() => setZoomImageUrl("")}
            >
              Close
            </button>
            {failedImageUrls[zoomImageUrl] ? (
              <div className="image-modal-fallback">이미지 로드 실패</div>
            ) : (
              <img
                src={zoomImageUrl}
                alt="zoomed"
                onError={() => onImageLoadError(zoomImageUrl)}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
