// app/components/ui/form-actions.tsx
"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "./button";
import { Save, Trash2, ArrowLeft } from "lucide-react";

export function FormActions({
  mode,
  saving,
  onSave,
  onDelete,
  showBack = false,
  backText = "Back",
  deleteText = "Delete",
  saveTextCreate = "Create",
  saveTextEdit = "Save Changes",
}: {
  mode: "create" | "edit";
  saving?: boolean;
  onSave?: () => void;       // เมื่อใช้ type="submit" สามารถไม่ส่งก็ได้
  onDelete?: () => void;
  showBack?: boolean;
  backText?: string;
  deleteText?: string;
  saveTextCreate?: string;
  saveTextEdit?: string;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between">
      {mode === "edit" ? (
        <IconButton type="button" variant="dark-outline" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          <span className="ml-2">{deleteText}</span>
        </IconButton>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-2">
        {showBack && (
          <IconButton type="button" variant="dark-outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="ml-2">{backText}</span>
          </IconButton>
        )}
        <IconButton
          type={onSave ? "button" : "submit"}
          onClick={onSave}
          variant="dark"
          aria-busy={saving ? true : undefined}
          disabled={!!saving}
        >
          <Save className="h-4 w-4" />
          <span className="ml-2">{mode === "edit" ? saveTextEdit : saveTextCreate}</span>
        </IconButton>
      </div>
    </div>
  );
}
