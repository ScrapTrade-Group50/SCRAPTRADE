import { create } from 'zustand';

export type DialogButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type ConfirmState = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: DialogButton[];
};

type NoticeState = {
  visible: boolean;
  title: string;
  message?: string;
  variant: 'info' | 'success' | 'error';
  onDismiss?: () => void;
};

interface DialogState {
  confirm: ConfirmState;
  notice: NoticeState;
  showConfirm: (title: string, message?: string, buttons?: DialogButton[]) => void;
  hideConfirm: () => void;
  showNotice: (
    title: string,
    message?: string,
    options?: { variant?: NoticeState['variant']; onDismiss?: () => void }
  ) => void;
  hideNotice: () => void;
}

const emptyConfirm: ConfirmState = {
  visible: false,
  title: '',
  message: undefined,
  buttons: [],
};

const emptyNotice: NoticeState = {
  visible: false,
  title: '',
  message: undefined,
  variant: 'info',
  onDismiss: undefined,
};

export const useDialogStore = create<DialogState>((set, get) => ({
  confirm: emptyConfirm,
  notice: emptyNotice,

  showConfirm: (title, message, buttons) => {
    set({
      confirm: {
        visible: true,
        title,
        message,
        buttons: buttons?.length
          ? buttons
          : [{ text: 'OK', style: 'default' }],
      },
    });
  },

  hideConfirm: () => set({ confirm: emptyConfirm }),

  showNotice: (title, message, options) => {
    set({
      notice: {
        visible: true,
        title,
        message,
        variant: options?.variant ?? 'info',
        onDismiss: options?.onDismiss,
      },
    });
  },

  hideNotice: () => {
    const onDismiss = get().notice.onDismiss;
    set({ notice: emptyNotice });
    onDismiss?.();
  },
}));
