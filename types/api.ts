/**
 * TypeScript helper types for Next.js 15 route handlers
 * Provides type safety for async route parameters
 */

/**
 * Legacy route response types for handling deprecated endpoints
 */
export interface LegacyRouteResponse {
  error: string;
  message: string;
  deprecatedSince: string;
  alternativeEndpoint?: string;
  sunsetDate?: string;
  documentation: string;
}

export interface APIErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

/**
 * Base route context interface for Next.js 15 route handlers
 */
export interface RouteContext<T = Record<string, string>> {
  params: Promise<T>;
}

/**
 * Organization route parameters
 */
export interface OrgRouteParams {
  orgId: string;
}

/**
 * Contact route parameters
 */
export interface ContactRouteParams {
  contactId: string;
}

/**
 * User route parameters
 */
export interface UserRouteParams {
  userId: string;
}

/**
 * Invoice route parameters
 */
export interface InvoiceRouteParams {
  invoiceId: string;
}

/**
 * Project route parameters
 */
export interface ProjectRouteParams {
  projectId: string;
}

/**
 * Section route parameters
 */
export interface SectionRouteParams {
  sectionId: string;
}

/**
 * Board route parameters
 */
export interface BoardRouteParams {
  boardId: string;
}

/**
 * Notion route parameters
 */
export interface NotionRouteParams {
  notionId: string;
}

/**
 * Helper type for empty params (non-dynamic routes)
 */
export type EmptyParams = Record<string, never>;

/**
 * Example usage:
 * 
 * import { RouteContext, OrgRouteParams } from '@/types/api';
 * 
 * export async function GET(
 *   request: NextRequest,
 *   context: RouteContext<OrgRouteParams>
 * ) {
 *   const { orgId } = await context.params;
 *   // Type-safe implementation
 * }
 */