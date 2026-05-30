export interface TDraftInput {
  templateId: string;
  topic: string;
  tone: string;
  audience: string;
  documentId?: string;
}

export interface TDraftOutput {
  title: string;
  metaDescription: string;
  tags: string[];
  content: string;
}

export interface TRewriteInput {
  text: string;
  mode:
    | "shorten"
    | "expand"
    | "formal"
    | "casual"
    | "persuasive"
    | "fix_grammar";
}

export interface TRewriteOutput {
  rewrittenText: string;
}

export type TJobType = "DRAFT" | "REWRITE";

export interface TJobPayload {
  userId: string;
  type: TJobType;
  payload: TDraftInput | TRewriteInput;
}
