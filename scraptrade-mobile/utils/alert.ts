import { Platform } from 'react-native';
import { useDialogStore } from '@/store/dialogStore';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/** In-app dialog on native; falls back to browser dialogs on web. */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS === 'web') {
    const body = message ? `${title}\n\n${message}` : title;
    const resolvedButtons = buttons?.length ? buttons : [{ text: 'OK', style: 'default' as const }];
    if (resolvedButtons.length <= 1) {
      window.alert(body);
      resolvedButtons[0]?.onPress?.();
      return;
    }
    const confirmed = window.confirm(body);
    if (confirmed) {
      resolvedButtons.find((b) => b.style !== 'cancel')?.onPress?.();
    } else {
      resolvedButtons.find((b) => b.style === 'cancel')?.onPress?.();
    }
    return;
  }

  const resolvedButtons = buttons?.length ? buttons : [{ text: 'OK', style: 'default' as const }];
  const isSimpleNotice =
    resolvedButtons.length === 1 && !resolvedButtons[0]?.style && resolvedButtons[0]?.text === 'OK';

  if (isSimpleNotice) {
    useDialogStore.getState().showNotice(title, message, { variant: 'info' });
    return;
  }

  useDialogStore.getState().showConfirm(title, message, resolvedButtons);
}

export function showSuccessNotice(title: string, message?: string, onDismiss?: () => void) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    onDismiss?.();
    return;
  }
  useDialogStore.getState().showNotice(title, message, { variant: 'success', onDismiss });
}

export function showErrorNotice(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  useDialogStore.getState().showNotice(title, message, { variant: 'error' });
}

export function showConfirm(
  title: string,
  message: string | undefined,
  buttons: AlertButton[]
) {
  showAlert(title, message, buttons);
}
