export const FEATURE_FLAGS = {
  // Legacy NextCRM features - disabled by default
  ENABLE_TASK_MANAGEMENT: process.env.NEXT_PUBLIC_ENABLE_TASKS === 'true',
  ENABLE_BOARD_MANAGEMENT: process.env.NEXT_PUBLIC_ENABLE_BOARDS === 'true',
  ENABLE_DOCUMENT_MANAGEMENT: process.env.NEXT_PUBLIC_ENABLE_DOCUMENTS === 'true',
  ENABLE_SECTION_MANAGEMENT: process.env.NEXT_PUBLIC_ENABLE_SECTIONS === 'true',
  
  // Kitchen Pantry CRM features - enabled
  ENABLE_ORGANIZATION_MANAGEMENT: true,
  ENABLE_CONTACT_MANAGEMENT: true,
  ENABLE_INTERACTION_TRACKING: true,
  ENABLE_PIPELINE_VISUALIZATION: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}
