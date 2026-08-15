"use client";

import { Play } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui";

export function ImportQueueButton({
  importId,
}: Readonly<{ importId: string }>) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function retry() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/imports/${importId}/queue`, {
        method: "POST",
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "Planification impossible.");
      }
      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Planification impossible.",
      );
      setPending(false);
    }
  }

  return (
    <Button
      iconLeading={<Play aria-hidden size={15} />}
      loading={pending}
      onClick={retry}
      title={message ?? undefined}
      type="button"
      variant="secondary"
    >
      Relancer
    </Button>
  );
}
