/**
 * @tayfa/shared — the cross-monorepo contract.
 *
 * Re-exports the full public surface: constants (pricing, SLAs, caps, geo, AI),
 * types (branded ids, enums, domain shapes, Result), the typed analytics
 * taxonomy, Zod boundary schemas, pure domain logic, and provider adapters.
 *
 * Import from the root for convenience, or from a subpath
 * (`@tayfa/shared/domain`, `@tayfa/shared/schemas`, …) to keep bundles tight.
 */
export * from './constants/index.js';
export * from './types/index.js';
export * from './events/index.js';
export * from './schemas/index.js';
export * from './domain/index.js';
export * from './adapters/index.js';
