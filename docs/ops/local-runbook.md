# Local Runbook

## 실행

1. `cd /Users/anjun-yeong/work/KMMMU/web`
2. `npm install`
3. `npm run dev`
4. 브라우저에서 `http://localhost:5173` 접속

## 작업

1. 데이터셋 카드 선택
2. 인덱스 이동 (`Go`, `<`, `>`)
3. 라벨 입력
   - 정답/오답 판정
   - 문제 유형 검사
   - 이미지 타입 검사
4. `Save Annotation` 클릭
5. 필요 시 `Export CSV` 실행

## 저장 위치

- 임시 저장: 브라우저 `localStorage`
- export: 브라우저 다운로드 파일

## 초기화

- 개발자도구 `Application -> Local Storage -> http://localhost:5173`
- 아래 키 삭제
  - `annotations:gpt-5-mini`
  - `annotations:qwen3-2b`
  - `annotations:qwen3-30b`
  - `annotations:varco2-14b`
