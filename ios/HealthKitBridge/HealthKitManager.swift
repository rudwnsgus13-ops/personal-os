import Foundation
import HealthKit

struct DailyHealthSummary: Codable {
    let date: String
    let steps: Double?
    let energy: Double?
    let exercise: Double?
    let sleep: Double?
    let weight: Double?
    let fat: Double?
    let muscle: Double?
}

final class HealthKitManager {
    private let store = HKHealthStore()
    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        [
            HKQuantityType.quantityType(forIdentifier: .stepCount),
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned),
            HKQuantityType.quantityType(forIdentifier: .appleExerciseTime),
            HKQuantityType.quantityType(forIdentifier: .bodyMass),
            HKQuantityType.quantityType(forIdentifier: .bodyFatPercentage),
            HKQuantityType.quantityType(forIdentifier: .leanBodyMass),
            HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)
        ].compactMap { $0 }.forEach { types.insert($0) }
        return types
    }

    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else { throw HealthError.unavailable }
        try await store.requestAuthorization(toShare: [], read: readTypes)
    }

    func summary(for day: Date = Date()) async throws -> DailyHealthSummary {
        let cal = Calendar(identifier: .gregorian)
        let start = cal.startOfDay(for: day)
        let end = cal.date(byAdding: .day, value: 1, to: start)!
        async let steps = cumulative(.stepCount, unit: .count(), start: start, end: end)
        async let energy = cumulative(.activeEnergyBurned, unit: .kilocalorie(), start: start, end: end)
        async let exercise = cumulative(.appleExerciseTime, unit: .minute(), start: start, end: end)
        async let weight = latest(.bodyMass, unit: .gramUnit(with: .kilo), end: end)
        async let fat = latest(.bodyFatPercentage, unit: .percent(), end: end, multiplier: 100)
        async let muscle = latest(.leanBodyMass, unit: .gramUnit(with: .kilo), end: end)
        async let sleep = sleepHours(start: start, end: end)
        let f = DateFormatter(); f.calendar = cal; f.locale = Locale(identifier:"en_US_POSIX"); f.dateFormat = "yyyy-MM-dd"
        return try await DailyHealthSummary(date:f.string(from:start),steps:steps,energy:energy,exercise:exercise,sleep:sleep,weight:weight,fat:fat,muscle:muscle)
    }

    private func cumulative(_ id: HKQuantityTypeIdentifier, unit: HKUnit, start: Date, end: Date) async throws -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier:id) else { return nil }
        let pred = HKQuery.predicateForSamples(withStart:start,end:end,options:.strictStartDate)
        return try await withCheckedThrowingContinuation { c in
            let q = HKStatisticsQuery(quantityType:type,quantitySamplePredicate:pred,options:.cumulativeSum) { _,r,e in
                if let e { c.resume(throwing:e) } else { c.resume(returning:r?.sumQuantity()?.doubleValue(for:unit)) }
            }; store.execute(q)
        }
    }

    private func latest(_ id: HKQuantityTypeIdentifier, unit: HKUnit, end: Date, multiplier: Double = 1) async throws -> Double? {
        guard let type = HKQuantityType.quantityType(forIdentifier:id) else { return nil }
        let pred = HKQuery.predicateForSamples(withStart:nil,end:end,options:.strictEndDate)
        return try await withCheckedThrowingContinuation { c in
            let q = HKSampleQuery(sampleType:type,predicate:pred,limit:1,sortDescriptors:[NSSortDescriptor(key:HKSampleSortIdentifierEndDate,ascending:false)]) { _,s,e in
                if let e { c.resume(throwing:e) } else { let v=(s?.first as? HKQuantitySample)?.quantity.doubleValue(for:unit); c.resume(returning:v.map{$0*multiplier}) }
            }; store.execute(q)
        }
    }

    private func sleepHours(start: Date, end: Date) async throws -> Double? {
        guard let type = HKCategoryType.categoryType(forIdentifier:.sleepAnalysis) else { return nil }
        let pred = HKQuery.predicateForSamples(withStart:start.addingTimeInterval(-12*3600),end:end,options:[])
        return try await withCheckedThrowingContinuation { c in
            let q = HKSampleQuery(sampleType:type,predicate:pred,limit:HKObjectQueryNoLimit,sortDescriptors:nil) { _,samples,e in
                if let e { c.resume(throwing:e); return }
                let asleep = (samples as? [HKCategorySample] ?? []).filter { $0.value != HKCategoryValueSleepAnalysis.inBed.rawValue }
                let seconds = asleep.reduce(0.0) { $0 + $1.endDate.timeIntervalSince($1.startDate) }
                c.resume(returning: seconds > 0 ? seconds/3600 : nil)
            }; store.execute(q)
        }
    }
}
enum HealthError: Error { case unavailable }
