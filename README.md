# Local LLM-as-Judge Annotator

로컬 환경에서 실행하는 React 기반 LLM-as-judge 검수(annotator) 도구입니다.

## 구현된 기능

- 앱 시작 시 `data/input`의 4개 CSV 자동 로드
  - `gpt-5-mini-llm-judge.csv`
  - `qwen3-VL-2b-it-llm-judge.csv`
  - `qwen3-VL-30b-it-llm-judge.csv`
  - `varco2-14b-llm-judge.csv`
- 데이터셋 버전 선택 UI
  - 각 버전별 `records`, `annotated`, `status` 표시
- 문제 탐색
  - 인덱스 입력 후 `Go` 이동
  - `<`, `>` 버튼으로 이전/다음 이동
- 좌측 정보 패널
  - `Question`
  - `Question Type` (Question 바로 아래)
  - `Images` (썸네일 + 클릭 확대 모달 + 실패 플레이스홀더)
  - `image type(첫번째 사진 기준)` (`visual_type` 값 표시)
  - `Model Response` (`response`)
  - `Model Answer` (`model_answer`)
- 우측 annotation 폼
  - 정답/오답 판정: `correct | incorrect | no_answer`
  - 문제 유형 검사: `match | mismatch | unsure`
  - 이미지 타입 검사: `match | mismatch | unsure`
  - `Comment`
  - 판정 시간(`MM:SS`) 표시 및 저장
- 저장/집계
  - `Save Annotation` 클릭 시 dataset별 `localStorage`에 저장
  - `annotated`는 해당 dataset의 저장된 annotation 개수
- Export/병합
  - 현재 세션 annotation + 기존 output CSV(있을 경우)를 `item_id` 기준 merge
  - 파일명: `<datasetKey>-annotations-<timestamp>.csv`

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

3. 브라우저에서 앱 접속

- `http://localhost:5173`

## 사용 방법

1. 앱 시작 후 데이터셋 카드에서 작업할 버전 선택
2. 인덱스 탐색(`Go`, `<`, `>`)으로 문제 이동
3. 라벨 3개(정답/오답, 문제 유형, 이미지 타입)와 코멘트 입력
4. `Save Annotation` 클릭
5. 필요 시 `Export CSV`로 병합 결과 저장

## 데이터/저장 관련 참고

- 입력 CSV는 `response`와 `model_answer`를 모두 포함해야 합니다.
- `item_id` 컬럼이 없으면 로더가 행 인덱스를 `item_id`로 자동 생성합니다.
- `localStorage` 초기화 방법
  - `annotations:gpt-5-mini`
  - `annotations:qwen3-2b`
  - `annotations:qwen3-30b`
  - `annotations:varco2-14b`
