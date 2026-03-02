export type DesignStatus = "have" | "need_help" | null;
export type NameNumberStatus = "yes" | "no" | null;
export type MediaKind = "design" | "catalog";

export type LeadData = {
  sport: string | null;
  qty: number | null;
  deadline: string | null;
  city: string | null;
  design_status: DesignStatus;
  name_number: NameNumberStatus;
};

export type MediaGroup = {
  kind: MediaKind;
  title: string;
  images: string[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  media?: MediaGroup[];
};

export type AssistantResponse = {
  reply: string;
  extracted: LeadData;
  all_data_complete: boolean;
  media?: MediaGroup[];
};

export const EMPTY_LEAD: LeadData = {
  sport: null,
  qty: null,
  deadline: null,
  city: null,
  design_status: null,
  name_number: null,
};
