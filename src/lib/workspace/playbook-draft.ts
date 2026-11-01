import type { Playbook, PlaybookDraft } from "@/lib/workspace/types";

export function emptyDraft(categoryId: string): PlaybookDraft {
  return {
    name: "",
    description: "",
    prompt: "",
    icon: "message",
    active: true,
    autoSend: false,
    attachments: [],
    categoryId,
  };
}

export function fromPlaybook(
  playbook: Playbook,
  categoryId: string,
): PlaybookDraft {
  return {
    name: playbook.name,
    description: playbook.description,
    prompt: playbook.prompt,
    icon: playbook.icon,
    active: playbook.active,
    autoSend: playbook.autoSend,
    attachments: playbook.attachments,
    categoryId,
  };
}
