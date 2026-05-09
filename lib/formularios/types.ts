import type { FormFieldType } from "@/types/database";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[];
}

export interface FormTemplate {
  id: string;
  account_id: string;
  title: string;
  description: string | null;
  slug: string;
  fields: FormField[];
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  account_id: string;
  form_template_id: string | null;
  data: Record<string, string | string[]>;
  viewed: boolean;
  submitted_at: string;
  linked_contact_id: string | null;
  linked_job_id: string | null;
}

export interface SubmissionWithTemplate extends FormSubmission {
  form_templates: { title: string } | null;
}
