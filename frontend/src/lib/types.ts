export interface User {
  id: number;
  username: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

// --- Litigation types ---

export interface Case {
  id: number;
  user_id: number;
  title: string;
  case_number: string | null;
  case_type: string;
  description: string | null;
  status: string;
  evidence_count: number;
  created_at: string;
  updated_at: string;
}

export interface CaseCreate {
  title: string;
  case_number?: string;
  case_type?: string;
  description?: string;
}

export interface Evidence {
  id: number;
  case_id: number;
  filename: string;
  file_path: string;
  mime_type: string;
  file_category: string;
  file_size: number;
  extracted_text: string | null;
  ai_summary: string | null;
  analysis_status: string;
  created_at: string;
  updated_at: string;
}

export interface EvidenceDetail extends Evidence {
  key_facts: KeyFact[];
}

export interface KeyFact {
  id: number;
  evidence_id: number;
  fact_text: string;
  fact_type: string;
  importance: string;
  extracted_date: string | null;
  created_at: string;
}

export interface TimelineEvent {
  id: number;
  case_id: number;
  evidence_id: number | null;
  event_date: string | null;
  date_precision: string;
  title: string;
  description: string | null;
  event_type: string;
  people_involved: string[] | null;
  relevance_score: number;
  is_critical: boolean;
  created_at: string;
  updated_at: string;
}

// --- Bundle types ---

export interface Bundle {
  id: number;
  case_id: number;
  title: string;
  version: number;
  status: string;
  file_path: string | null;
  file_size: number;
  total_pages: number;
  created_at: string;
  updated_at: string;
}

export interface BundlePage {
  id: number;
  bundle_id: number;
  evidence_id: number;
  source_page_number: number;
  bundle_page_number: number;
  content_hash: string;
  is_duplicate_of: number | null;
  section_title: string | null;
}

export interface BundleLink {
  id: number;
  bundle_id: number;
  source_page: number;
  target_page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string | null;
}

export interface BundleHighlight {
  id: number;
  bundle_id: number;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  note: string | null;
}

export interface BundleDetail extends Bundle {
  pages: BundlePage[];
  links: BundleLink[];
  highlights: BundleHighlight[];
}

export interface BundleCreate {
  title: string;
  evidence_ids: number[];
}

export interface BundleLinkCreate {
  source_page: number;
  target_page: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  label?: string;
}

export interface BundleHighlightCreate {
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  note?: string;
}

// --- Marketplace types ---

export interface SpecialistDocument {
  id: number;
  user_id: number;
  original_filename: string;
  category: string;
  description: string | null;
  created_at: string;
}

export interface SpecialistProfile {
  id: number;
  user_id: number;
  practice_areas: string[];
  sub_areas: string[];
  custom_areas: string[];
  linkedin_url: string | null;
  years_experience: number;
  bar_number: string | null;
  jurisdiction: string;
  bio: string;
  hourly_rate: number | null;
  availability: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  documents: SpecialistDocument[];
}

export interface SpecialistProfileCreate {
  practice_areas: string[];
  sub_areas?: string[];
  custom_areas?: string[];
  linkedin_url?: string;
  years_experience: number;
  bar_number?: string;
  jurisdiction: string;
  bio: string;
  hourly_rate?: number;
  availability?: string;
}

export interface MarketplaceListing {
  id: number;
  case_id: number;
  user_id: number;
  title: string;
  redacted_summary: string;
  case_category: string;
  estimated_amount: number | null;
  claim_or_defence: string;
  status: string;
  created_at: string;
  updated_at: string;
  matches_count?: number;
  bids_count?: number;
}

export interface CaseMatch {
  id: number;
  listing_id: number;
  specialist_id: number;
  relevance_score: number;
  rationale: string;
  matched_at: string;
  notified: boolean;
  listing?: MarketplaceListing;
}

export interface Bid {
  id: number;
  listing_id: number;
  specialist_id: number;
  message: string;
  price_structure: string;
  estimated_amount: number;
  estimated_hours: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  specialist_name: string;
  specialist_profile?: SpecialistProfile;
}

export interface BidCreate {
  message: string;
  price_structure: string;
  estimated_amount: number;
  estimated_hours?: number;
}

export interface AcceptedBidInfo {
  specialist_name: string;
  estimated_hours: number | null;
  estimated_amount: number;
}

export interface MarketplaceListingEnriched extends MarketplaceListing {
  accepted_bid?: AcceptedBidInfo;
  notes_count: number;
  documents_count: number;
}

// --- Legal Analysis & Collaboration types ---

export interface CaseLawReference {
  citation: string;
  relevance: string;
  summary: string;
}

export interface LegislationReference {
  statute: string;
  section: string;
  relevance: string;
}

export interface CaseLegalAnalysis {
  id: number;
  case_id: number;
  legal_positioning: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  relevant_case_law: CaseLawReference[] | null;
  relevant_legislation: LegislationReference[] | null;
  open_questions: string[] | null;
  generated_at: string;
}

export interface EvidenceAnalysisGap {
  id: number;
  evidence_id: number;
  gap_text: string;
  gap_type: string;
  resolved: boolean;
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
}

export interface CaseCollaborator {
  id: number;
  case_id: number;
  user_id: number;
  role: string;
  bid_id: number | null;
  joined_at: string;
  user_name: string;
}

export interface CaseNote {
  id: number;
  case_id: number;
  user_id: number;
  evidence_id: number | null;
  content: string;
  note_type: string;
  created_at: string;
  updated_at: string;
  author_name: string;
}

export interface CaseNoteCreate {
  content: string;
  evidence_id?: number | null;
  note_type?: string;
}

export interface CaseDocument {
  id: number;
  case_id: number;
  user_id: number;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  description: string | null;
  created_at: string;
  uploader_name: string;
}

// --- Specialist Portal types ---

export interface SpecialistCase {
  id: number;
  title: string;
  case_type: string;
  status: string;
  role: string;
  joined_at: string;
}

export interface StatementOfClaim {
  id: number;
  case_id: number;
  content: string | null;
  generated_by: "ai" | "user";
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// --- Messaging types ---

export interface Conversation {
  id: number;
  participant_1_id: number;
  participant_2_id: number;
  case_id: number | null;
  listing_id: number | null;
  created_at: string;
  last_message_at: string | null;
  other_user_id: number;
  other_user_name: string;
  last_message_text: string;
  unread_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageCreate {
  content: string;
}

export interface ConversationCreate {
  recipient_id: number;
  case_id?: number | null;
  listing_id?: number | null;
}
