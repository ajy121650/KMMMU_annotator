# Local LLM-as-Judge Annotator

로컬 환경에서 실행하는 React 기반 annotator 프로젝트입니다.

## Folder Structure

- `web/`: React annotator app (CSV 로딩, 라벨링, export)
- `data/input/`: annotator가 로딩할 원본 CSV 위치
- `data/output/`: export된 merged CSV 저장 위치(수동 이동)
- `data/sessions/`: 임시 세션/백업 파일 위치
- `data/archive/`: 작업 완료본 아카이브
- `llm-as-judge-dataset/`: 제공받은 원본 데이터셋 보관
- `scripts/merge/`: 여러 output CSV 최종 병합 스크립트
- `scripts/utils/`: 데이터 검증/정규화 유틸
- `docs/`: 스키마/운영 가이드

## Local Workflow (Target)

1. `web` 앱 실행
2. `input dataset CSV` + `existing output CSV(optional)` 로드
3. 지정 구간 annotation 진행
4. `Export`로 merged output CSV 다운로드
5. 결과 파일을 `data/output/`에 보관
