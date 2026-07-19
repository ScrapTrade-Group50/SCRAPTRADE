import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS === 'web') {
    const body = message ? `${title}\n\n${message}` : title;
    if (!buttons || buttons.length <= 1) {
      window.alert(body);
      buttons?.[0]?.onPress?.();
      return;
    }
    const confirmed = window.confirm(body);
    if (confirmed) {
      buttons.find((b) => b.style !== 'cancel')?.onPress?.();
    } else {
      buttons.find((b) => b.style === 'cancel')?.onPress?.();
    }
    return;
  }

  Alert.alert(title, message, buttons);
}
