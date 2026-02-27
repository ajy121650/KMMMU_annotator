# Annotation Guideline

## 1) 정답/오답 판정 (`human_judgement`)

- `correct`: 모델 답변이 정답 기준에 부합
- `incorrect`: 모델 답변이 정답 기준에 부합하지 않음
- `no_answer`: 답변이 실질적으로 비어 있거나 판정 불가

## 2) 문제 유형 검사 (`question_type_match`)

- `match`: 문제 유형 표기가 문항과 일치
- `mismatch`: 문제 유형 표기가 문항과 불일치
- `unsure`: 판단 불가

## 3) 이미지 타입 검사 (`visual_type_check`)

- `match`: 이미지 타입 표기가 실제 이미지와 일치
- `mismatch`: 이미지 타입 표기가 실제 이미지와 불일치
- `unsure`: 판단 불가

## 운영 규칙

- `Save Annotation` 시점에만 저장됨
- 라벨 3개(`human_judgement`, `question_type_match`, `visual_type_check`)를 모두 선택해야 저장됨
- `time_spent_sec`는 문제가 화면에 로드된 시점부터 Save 시점까지의 경과 시간
