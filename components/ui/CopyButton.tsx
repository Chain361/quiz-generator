"use client";

import { useState } from "react";
import { Badge } from "./badge";

export function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Badge variant={copied ? "default" : "secondary"} onClick={copy} className="cursor-pointer">
      {copied ? "Copied!" : "Copy"}
    </Badge>
  );
}
