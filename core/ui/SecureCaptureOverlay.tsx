import React from 'react';
import { Platform, requireNativeComponent, View, type ViewProps } from 'react-native';

const NativeSecureCaptureView =
  Platform.OS === 'ios'
    ? requireNativeComponent<ViewProps>('FFSecureCaptureView')
    : View;

export function SecureCaptureOverlay(props: ViewProps) {
  return <NativeSecureCaptureView {...props} />;
}
