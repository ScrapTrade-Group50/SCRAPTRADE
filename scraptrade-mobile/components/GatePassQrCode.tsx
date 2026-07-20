import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

type GatePassQrCodeProps = {
  value: string;
};

export default function GatePassQrCode({ value }: GatePassQrCodeProps) {
  const { width } = useWindowDimensions();

  const size = useMemo(() => Math.round(Math.min(196, Math.max(160, width - 96))), [width]);

  return (
    <View
      className="items-center justify-center self-center rounded-xl border p-3"
      style={{
        width: size + 24,
        height: size + 24,
        backgroundColor: '#FFFFFF',
        borderColor: '#D4D4D8',
      }}>
      <QRCode value={value} size={size} color="#000000" backgroundColor="#FFFFFF" ecl="M" />
    </View>
  );
}
