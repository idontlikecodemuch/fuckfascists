import ExpoModulesCore
import MapKit

/**
 * Expo native module — iOS only.
 *
 * Exposes MKLocalPointsOfInterestRequest to JavaScript as `MapKitSearch.searchNearby()`.
 *
 * Integration (after `expo prebuild --platform ios`):
 *   1. Copy this file into the Xcode project target (drag into Xcode or add via
 *      File > Add Files to "AppName").
 *   2. Build with `expo run:ios` or EAS Build.
 *   3. ExpoModulesCore auto-discovers modules that conform to the Module protocol.
 *
 * This module does NOT instantiate CLLocationManager and does NOT require location
 * permission. The coordinate is derived from a MapView tap event in JavaScript —
 * it is never read from the device GPS.
 */
public class MapKitSearchModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MapKitSearch")

    // Returns an array of POI names within radiusMeters of the given coordinate.
    //
    // Uses MKLocalPointsOfInterestRequest, NOT MKLocalSearch.Request.
    // MKLocalSearch.Request without a naturalLanguageQuery throws MKErrorDomain
    // error 4 (placemarkNotFound). MKLocalPointsOfInterestRequest is the correct
    // API for coordinate-only POI lookup with no query string.
    //
    // On MKLocalSearch error: resolves with [] and logs to console.
    // The caller (useTapSearch.ts) treats an empty result as a silent no-match.
    AsyncFunction("searchNearby") { (latitude: Double, longitude: Double, radiusMeters: Double, promise: Promise) in
      let center = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
      let request = MKLocalPointsOfInterestRequest(center: center, radius: radiusMeters)
      // No pointOfInterestFilter — return all nearby POI types.

      let search = MKLocalSearch(request: request)
      search.start { response, error in
        if let error = error {
          // Fail silently from the user's perspective — log only.
          print("[MapKitSearch] MKLocalPointsOfInterestRequest error: \(error.localizedDescription)")
          promise.resolve([String]())
          return
        }
        let names = response?.mapItems.compactMap { $0.name } ?? []
        promise.resolve(names)
      }
    }
  }
}
