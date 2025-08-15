// app/components/ui/form-actions.tsx
"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
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
        <Button
          type="button"
          variant="outlineZspell"
          iconLeft={Trash2}
          onClick={onDelete}
        >
          {deleteText}
        </Button>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-2">
        {showBack && (
          <Button
            type="button"
            variant="ghost"
            iconLeft={ArrowLeft}
            onClick={() => router.back()}
          >
            {backText}
          </Button>
        )}
        <Button
          type={onSave ? "button" : "submit"}
          onClick={onSave}
          variant="zspell"
          iconLeft={Save}
          loading={!!saving}
        >
          {mode === "edit" ? saveTextEdit : saveTextCreate}
        </Button>
      </div>
    </div>
  );
}
