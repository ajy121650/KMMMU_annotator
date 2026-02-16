# Folder Structure (Frontend-only)

## Principles

- 브라우저에서 로딩/라벨링/export 수행
- 데이터 원본(input)과 결과물(output)을 폴더로 분리
- 최종 통합은 스크립트로 별도 수행

## Directories

- `web/`: React 앱
- `data/input/`: 작업 대상 CSV
- `data/output/`: annotator별 결과 CSV
- `data/sessions/`: 중간 저장본
- `data/archive/`: 마감본
- `scripts/merge/`: 통합 스크립트
- `scripts/utils/`: 검증 스크립트
