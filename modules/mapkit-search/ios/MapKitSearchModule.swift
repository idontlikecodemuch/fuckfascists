import ExpoModulesCore
import MapKit

/**
 * Expo native module — iOS only.
 *
 * Exposes MKLocalPointsOfInterestRequest to JavaScript as `MapKitSearch.searchNearby()`.
 * Registered via expo-modules-autolinking using modules/mapkit-search/expo-module.config.json.
 *
 * This module does NOT instantiate CLLocationManager and does NOT require location
 * permission. The coordinate is derived from a MapView tap event in JavaScript —
 * it is never read from the device GPS.
 */
public class MapKitSearchModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MapKitSearch")

    // Returns an array of POI objects within radiusMeters of the given coordinate.
    // Each object contains: name (always), url (hostname if available), category
    // (MKPointOfInterestCategory rawValue if available).
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

      // MKLocalSearch must be created and started on the main thread.
      // AsyncFunction runs on a background queue — dispatch explicitly.
      DispatchQueue.main.async {
        let search = MKLocalSearch(request: request)
        search.start { response, error in
          if let error = error {
            // Fail silently from the user's perspective — log only.
            print("[MapKitSearch] MKLocalPointsOfInterestRequest error: \(error.localizedDescription)")
            promise.resolve([[String: Any]]())
            return
          }
          let pois: [[String: Any]] = response?.mapItems.compactMap { item -> [String: Any]? in
            guard let name = item.name else { return nil }
            var poi: [String: Any] = ["name": name]
            if let host = item.url?.host {
              poi["url"] = host
            }
            if let cat = item.pointOfInterestCategory?.rawValue {
              poi["category"] = cat
            }
            return poi
          } ?? []
          promise.resolve(pois)
        }
      }
    }
  }
}
