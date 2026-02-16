# Local LLM-as-Judge Annotator

로컬 환경에서 실행하는 React 기반 LLM-as-judge 검수(annotator) 도구입니다.

## 구현된 기능

- 앱 시작 시 `data/input`의 4개 CSV 자동 로드
  - `gpt-5-mini-1-llm-judge.csv`
  - `qwen3-VL-2b-it-1-llm-judge.csv`
  - `qwen3-VL-30b-it-1-llm-judge.csv`
  - `varco2-14b-1-llm-judge.csv`

- 데이터셋 버전 선택 UI
  - 각 버전별 `records`, `annotated`, `status` 표시

- 문제 탐색
  - 인덱스 입력 후 `Go` 이동
  - `<`, `>` 버튼으로 이전/다음 이동

- 실제 annotator 폼
  - `human_judgement`: `correct | incorrect | no_answer`
  - `question_type_match`: `match | mismatch | unsure`
  - `comment`

- 판정 시간 측정
  - 문제가 화면에 나타난 시점부터 타이머 시작
  - `Save Annotation` 시 `time_spent_sec`와 함께 저장
  - 화면에 `MM:SS`로 실시간 표시

- 이미지 표시/확대
  - 이미지 링크를 썸네일로 렌더
  - 클릭 시 확대 모달
  - 로드 실패 시 `이미지 로드 실패` 플레이스홀더 표시

- 로컬 저장
  - `Save Annotation` 클릭 시 브라우저 `localStorage`에 데이터셋별 저장

- Export/병합
  - 현재 세션 annotation + 기존 output CSV(있을 경우)를 `item_id` 기준 merge

## 폴더 구조

- `web/`: React 앱
- `data/input/`: annotator 입력 CSV
- `data/output/`: export 결과 CSV 저장 권장 폴더
- `data/sessions/`: 세션/백업 용도
- `data/archive/`: 완료본 보관
- `llm-as-judge-dataset/`: 원본 데이터셋 보관
- `scripts/merge/`: 추가 병합 스크립트 용도
- `scripts/utils/`: 데이터 검증 유틸 용도
- `docs/`: 문서

## 실행 방법

1. 의존성 설치

```bash
cd /Users/anjun-yeong/work/KMMMU/web
npm install
```

2. 개발 서버 실행

```bash
npm run dev
```

3. 브라우저에서 앱 접속 (Vite 기본: `http://localhost:5173`)

## 사용 방법

1. 앱이 시작되면 `data/input`의 4개 파일이 자동 로드됩니다.
2. 상단에서 `Annotator ID`를 입력합니다.
3. 데이터셋 카드를 클릭해 작업할 모델 버전을 선택합니다.
4. 인덱스 탐색(`Go`, `<`, `>`)으로 원하는 문제로 이동합니다.
5. 판정 라벨/문제유형/코멘트를 입력합니다.
6. `Save Annotation`을 눌러 저장합니다.
7. `Export CSV`를 누르면 merge 결과 CSV가 저장됩니다.
8. `Export CSV`를 누를 때 이전에 작업한 CSV가 있을 경우 수동으로 data/output 폴더에 이동시켜야만 합니다.

## Export 파일명 규칙

- `<datasetKey>-annotations-<timestamp>.csv`
- 예: `gpt-5-mini-annotations-2026-02-16T09-12-10.csv`

## 참고 사항

- `localStorage`는 임시 작업 저장소입니다. 최종 결과는 반드시 `Export CSV`로 파일 저장하세요.
- 브라우저 보안 정책상 앱이 경로를 강제로 지정해 쓰는 것은 불가합니다.
- 간단한 MVP 형태라 백엔드를 따로 구현하지 않고 프론트에서 모두 처리되도록 하였습니다.
