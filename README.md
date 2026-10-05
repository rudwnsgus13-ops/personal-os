# Personal OS v1.1 — Google Calendar

GitHub Pages 기반 Personal OS입니다.

## v1.1
- 기존 Tasks + Google Drive appDataFolder 동기화 유지
- Google Calendar API 연결
- 기본(primary) Calendar의 향후 14일 일정 조회
- Personal OS에서 일정 생성
- Personal OS에서 일정 삭제
- OAuth scopes: drive.appdata + calendar.events
- PWA 캐시 버전 갱신

## 데이터
Tasks 데이터는 GitHub가 아니라 Google Drive 앱 전용 appDataFolder에 저장됩니다. Calendar 일정은 Google Calendar에 저장됩니다.
