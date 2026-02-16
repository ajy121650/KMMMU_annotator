# web

React annotator UI (frontend-only).

## Planned Scope

- CSV input loader
- Annotation workspace (question, gold answer, label fields)
- Local autosave (browser storage)
- Merged CSV export

## Source Layout

- `src/components/`: 화면 컴포넌트
- `src/pages/`: 페이지 단위 화면
- `src/store/`: annotation/session 상태
- `src/lib/`: CSV 파싱, merge, validation
- `src/hooks/`: 단축키/타이머 훅
- `src/types/`: 타입 정의
- `src/styles/`: 스타일
