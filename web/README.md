# Web App

React + Vite 기반 로컬 annotator 앱입니다.

## 주요 동작

- `data/input` CSV 자동 로드
- dataset별 annotation 진행
- `Save Annotation`으로 `localStorage` 저장
- `Export CSV`로 결과 병합/다운로드

## 개발 실행

```bash
cd /Users/anjun-yeong/work/KMMMU/web
npm install
npm run dev
```

## 핵심 소스

- `src/App.jsx`: UI/상태/저장/탐색 로직
- `src/lib/csvLoader.js`: CSV 로드/검증/정규화
- `src/lib/mergeExport.js`: merge/export 유틸
