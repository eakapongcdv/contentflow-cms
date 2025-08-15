"use client";

import * as React from "react";
import { Editor } from "@tinymce/tinymce-react";

/** ให้ TS อ้างอิงพร็อพจากคอมโพเนนต์จริง โดยไม่พึ่งชนิดภายในแพ็กเกจ */
export type TinyMCEEditorProps = React.ComponentProps<typeof Editor>;

export default function TinyMCEClient(props: TinyMCEEditorProps) {
  return <Editor {...props} />;
}
