import { z } from "zod";

export const POPIA_VERSION = "2026-10-17";

export const POPIA_POINTS = [
  "Theological Education Formation and Training (TEFT) (Anglican Diocese of Cape Town) is the responsible party for the personal information you provide.",
  "We collect your name, clerical title, parish, contact details and the documents and ideas you submit, solely to manage theological contributions, review and private clergy–TEFT conversations.",
  "Your submissions are visible only to you and the Dean's review team until the Dean accepts them for wider sharing within the repository.",
  "Chat messages are private between you and currently authorised TEFT reviewers. Do not include sensitive pastoral details or third-party personal information without their consent.",
  "Your information will not be sold or shared with third parties without your consent, and is stored securely.",
  "You may request access to, correction of, or deletion of your personal information at any time by contacting TEFT.",
  "You confirm you have the right to submit any document you upload and that it contains no third-party personal information without their consent.",
];

export const registerSchema = z.object({
  title: z.string().trim().min(1, "Choose a title").max(40),
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  parish: z.string().trim().min(2, "Enter your parish").max(120),
  phone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  popia: z.literal(true, { message: "You must acknowledge the POPIA notice" }),
});

export const submissionSchema = z.object({
  kind: z.enum(["document", "idea"]),
  title: z.string().trim().min(3, "Title is too short").max(200),
  category: z.string().trim().min(1).max(80),
  abstract: z.string().trim().min(10, "Please describe your submission").max(5000),
  keywords: z.string().trim().max(300).optional().default(""),
});

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const ALLOWED_EXT = ["pdf", "doc", "docx", "odt", "txt", "rtf"];

export function fileAllowed(name: string, size: number) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXT.includes(ext) && size <= MAX_FILE_BYTES;
}
