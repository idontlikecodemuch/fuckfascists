const base = require('./app.json');

module.exports = ({ config }) => {
  const mapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  const hasAndroidGoogleMapsApiKey = Boolean(mapsApiKey?.trim());
  const android = {
    ...base.expo.android,
    adaptiveIcon: {
      foregroundImage: './assets/pixel/brand/icon.png',
      backgroundColor: '#070B12',
      ...base.expo.android?.adaptiveIcon,
    },
  };

  if (hasAndroidGoogleMapsApiKey) {
    android.config = {
      ...android.config,
      googleMaps: {
        ...android.config?.googleMaps,
        apiKey: mapsApiKey,
      },
    };
  }

  return {
    ...config,
    ...base.expo,
    extra: {
      ...base.expo.extra,
      hasAndroidGoogleMapsApiKey,
    },
    android,
  };
};
