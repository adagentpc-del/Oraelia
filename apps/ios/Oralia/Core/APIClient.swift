import Foundation

/// Thin async client for the Oralia API server.
/// The base URL is user-configurable in Settings (defaults to local dev).
final class APIClient {
    static let shared = APIClient()

    var baseURL: URL {
        let stored = UserDefaults.standard.string(forKey: "apiBaseURL") ?? "http://localhost:5000"
        return URL(string: stored) ?? URL(string: "http://localhost:5000")!
    }

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    enum APIError: LocalizedError {
        case badStatus(Int, String)
        case invalidURL

        var errorDescription: String? {
            switch self {
            case .badStatus(let code, let message): return "Server error \(code): \(message)"
            case .invalidURL: return "Invalid server URL"
            }
        }
    }

    func get<T: Decodable>(_ path: String, query: [String: String] = [:]) async throws -> T {
        var components = URLComponents(url: baseURL.appending(path: "/api\(path)"), resolvingAgainstBaseURL: false)
        if !query.isEmpty {
            components?.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        guard let url = components?.url else { throw APIError.invalidURL }
        let (data, response) = try await URLSession.shared.data(from: url)
        try Self.check(response: response, data: data)
        return try decoder.decode(T.self, from: data)
    }

    func post<T: Decodable>(_ path: String, body: [String: Any]) async throws -> T {
        try await send(path, method: "POST", body: body)
    }

    func put<T: Decodable>(_ path: String, body: [String: Any]) async throws -> T {
        try await send(path, method: "PUT", body: body)
    }

    private func send<T: Decodable>(_ path: String, method: String, body: [String: Any]) async throws -> T {
        var request = URLRequest(url: baseURL.appending(path: "/api\(path)"))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        try Self.check(response: response, data: data)
        return try decoder.decode(T.self, from: data)
    }

    private static func check(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { return }
        guard (200..<300).contains(http.statusCode) else {
            let message = (try? JSONDecoder().decode([String: String].self, from: data))?["error"]
                ?? String(data: data.prefix(200), encoding: .utf8) ?? "unknown"
            throw APIError.badStatus(http.statusCode, message)
        }
    }
}

/// Simple observable loader wrapper used by all screens.
@MainActor
final class Loadable<T>: ObservableObject {
    @Published var value: T?
    @Published var isLoading = false
    @Published var error: String?

    func run(_ operation: @escaping () async throws -> T) {
        isLoading = true
        error = nil
        Task {
            do {
                let result = try await operation()
                self.value = result
            } catch {
                self.error = error.localizedDescription
            }
            self.isLoading = false
        }
    }
}
