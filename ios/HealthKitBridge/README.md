# Personal OS Apple Health bridge

This folder is the native iPhone bridge for Personal OS. It reads only the health types needed for the Personal OS daily summary: steps, active energy, exercise minutes, sleep, weight, body-fat percentage and lean body mass.

## Xcode setup
1. Create an iOS app target for Personal OS.
2. Add the HealthKit capability under Signing & Capabilities.
3. Add NSHealthShareUsageDescription: "Personal OS가 활동·수면·신체 측정값의 일별 요약을 보여주기 위해 Apple Health 데이터를 읽습니다."
4. Add HealthKitManager.swift to the target.
5. Call requestAuthorization() only after a clear user action.
6. Call summary(for:) and pass only DailyHealthSummary to the Personal OS data layer.

The bridge requests read access only. It does not write to Apple Health and does not request clinical health records.

## Privacy boundary
Do not upload raw HealthKit samples. Persist only DailyHealthSummary. The user can revoke Apple Health permission at any time.
