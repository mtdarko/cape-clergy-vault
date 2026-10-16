import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SIGNED_URL_SECONDS } from "@/lib/reviewer-rules";
import { Badge } from "@/components/ui/badge";

const LABELS: Record<string, string> = { submitted: "Submitted", under_review: "Under review", accepted: "Accepted", returned: "Returned" };

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={status === "accepted" ? "default" : status === "returned" ? "destructive" : "secondary"}>{LABELS[status] ?? status}</Badge>;
}

export async function openFile(path: string) {
  const { data, error } = await supabase.storage.from("submissions").createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error || !data) { toast.error("Could not open file"); return; }
  window.open(data.signedUrl, "_blank", "noopener");
}
