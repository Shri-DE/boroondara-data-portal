import React from "react";
import { Callout, DirectionalHint, Icon, mergeStyleSets } from "@fluentui/react";
import { boroondaraPalette } from "../../theme/boroondaraTheme";
import * as XLSX from "xlsx";

interface Props {
  target: HTMLElement | null;
  onDismiss: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_CONTENT_LENGTH = 50_000; // ~50K chars for AI context

const styles = mergeStyleSets({
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    cursor: "pointer",
    color: boroondaraPalette.text,
    fontSize: 13,
    fontWeight: 500,
    transition: "background 0.15s",
    selectors: {
      ":hover": {
        background: "#F5F5F5",
      },
    },
  },
});

/** Read file content client-side. Supports CSV, TXT, JSON, and XLSX/XLS. */
export async function readFileContent(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (["xlsx", "xls"].includes(ext)) {
    // Parse Excel using SheetJS (already installed)
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) return "(Empty workbook)";
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet]);
    return csv.slice(0, MAX_CONTENT_LENGTH);
  }

  // For CSV, TXT, JSON — read as text
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = (reader.result as string) || "";
      resolve(text.slice(0, MAX_CONTENT_LENGTH));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export { MAX_FILE_SIZE };

export default function AttachMenu({ target, onDismiss, fileInputRef }: Props) {
  if (!target) return null;

  const handleClick = () => {
    onDismiss();
    // Small delay so the callout closes before the file dialog opens
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  return (
    <Callout
      target={target}
      isBeakVisible={false}
      directionalHint={DirectionalHint.topLeftEdge}
      onDismiss={onDismiss}
      calloutWidth={260}
      styles={{
        root: {
          background: "#FFFFFF",
          border: "1px solid #E1E1E1",
          borderRadius: 4,
          overflow: "hidden",
        },
      }}
    >
      <div
        className={styles.item}
        onClick={handleClick}
      >
        <Icon
          iconName="Attach"
          style={{ fontSize: 16, color: boroondaraPalette.text2 }}
        />
        Add from local files
      </div>
    </Callout>
  );
}
