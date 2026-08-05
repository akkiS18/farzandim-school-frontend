import { useState, useCallback } from "react";

interface DialogState {
  isOpen: boolean;
  type: "alert" | "confirm" | "danger";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const DEFAULT_STATE: DialogState = {
  isOpen: false,
  type: "alert",
  title: "",
  message: "",
};

export function useDialog() {
  const [dialogState, setDialogState] = useState<DialogState>(DEFAULT_STATE);

  const closeDialog = useCallback(() => {
    setDialogState(DEFAULT_STATE);
  }, []);

  const showAlert = useCallback((message: string, title = "Xabar") => {
    setDialogState({
      isOpen: true,
      type: "alert",
      title,
      message,
      confirmText: "OK",
      onConfirm: () => setDialogState(DEFAULT_STATE),
    });
  }, []);

  const showConfirm = useCallback(
    (
      message: string,
      onConfirm: () => void,
      options?: {
        title?: string;
        type?: "confirm" | "danger";
        confirmText?: string;
        cancelText?: string;
      }
    ) => {
      setDialogState({
        isOpen: true,
        type: options?.type ?? "confirm",
        title: options?.title ?? "Tasdiqlash",
        message,
        confirmText: options?.confirmText ?? "Ha, tasdiqlash",
        cancelText: options?.cancelText ?? "Bekor qilish",
        onConfirm: () => {
          setDialogState(DEFAULT_STATE);
          onConfirm();
        },
        onCancel: () => setDialogState(DEFAULT_STATE),
      });
    },
    []
  );

  return { dialogState, showAlert, showConfirm, closeDialog };
}
