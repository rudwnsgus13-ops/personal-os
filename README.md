# Personal OS v1
GitHub Pages용 첫 실사용 빌드입니다.

## 기능
- PC/iPhone 반응형 Today UI
- Tasks 추가 / 완료 / 삭제
- 오프라인 로컬 저장
- Google OAuth Client ID 설정 완료
- Google Drive appDataFolder 동기화
- ChatGPT 바로가기
- PWA 기본 구성

## 업로드
ZIP을 푼 뒤 내부 파일들을 GitHub `personal-os` 저장소의 최상위(root)에 업로드하세요.
`index.html`이 저장소 첫 화면에서 보여야 합니다.

## 보안
Client Secret은 사용하지 않습니다.
Tasks 데이터는 GitHub가 아니라 Google Drive의 앱 전용 appDataFolder에 저장됩니다.
