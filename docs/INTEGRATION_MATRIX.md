# Integration Matrix

| Capability | Adapter seam | Current provider | Planned |
| --- | --- | --- | --- |
| Ephemeris | `bodyPosition(body, jd)` in astro-engine | Built-in Keplerian/Meeus | Swiss Ephemeris (ADR-0001) |
| Timezone lookup | iOS: CoreLocation placemark; server: stored utcOffset | Manual/store | IANA historical tz service |
| Geocoding | iOS CLGeocoder → PUT /profile/birth-location | Apple on-device | Server-side geocoder for web |
| Map tiles | iOS MapKit | Apple | Web map library for frontend |
| AI synthesis | `ai-engine.ts` (`AI_INTEGRATIONS_OPENAI_BASE_URL`) | None wired (fallback content) | User-added connection |
| Report rendering | — | In-app JSON | PDF/Markdown export (Phase 11) |
| Email | — | None | Phase 11 |
| Analytics | Pino logs | Logs only | Phase 12 |
| Payments | — | None | Phase 11 entitlements |

Rule: provider-specific code stays behind these seams; swapping a provider
must not touch calculation or interpretation logic.
