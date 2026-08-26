export * from "./generated/api";
// NOTE: do not add a bare `export type { ... } from "./generated/types"` here —
// explicit type-only re-exports shadow the zod schema values of the same names
// from "./generated/api". Codegen tends to re-add that line; remove it after
// each codegen run (see replit.md). Types are re-exported with a suffix instead.
export type {
  AuthUser as AuthUserType,
  ChakraAssessment as ChakraAssessmentType,
  DailyCheckin as DailyCheckinType,
  DailyGuidance as DailyGuidanceType,
  DashboardSummary as DashboardSummaryType,
  Goal as GoalType,
  LibraryEntry as LibraryEntryType,
  LocationProfile as LocationProfileType,
  Profile as ProfileType,
  RelationshipProfile as RelationshipProfileType,
} from "./generated/types";
