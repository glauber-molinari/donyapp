"use client";

/**
 * Modal — alias do SidePanel para painéis laterais de edição.
 * Para confirmações e diálogos centrados, use <Dialog> de ./dialog.tsx.
 */
import { SidePanel, type SidePanelSize } from "./side-panel";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: ModalSize;
}

const sizeMap: Record<ModalSize, SidePanelSize> = {
  sm: "sm",
  md: "sm",
  lg: "md",
  xl: "lg",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  size = "md",
}: ModalProps) {
  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={title}
      footer={footer}
      size={sizeMap[size]}
      className={className}
    >
      {children}
    </SidePanel>
  );
}
