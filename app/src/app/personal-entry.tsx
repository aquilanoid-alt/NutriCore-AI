import { Redirect } from 'expo-router';
import React from 'react';

import { saveSelectedAppMode } from '@/services/session';

export default function PersonalEntryScreen() {
  React.useEffect(() => {
    saveSelectedAppMode('personal');
  }, []);

  return <Redirect href="/" />;
}
