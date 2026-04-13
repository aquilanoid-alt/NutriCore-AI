import { Redirect } from 'expo-router';
import React from 'react';

import { saveSelectedAppMode } from '@/services/session';

export default function ProfessionalEntryScreen() {
  React.useEffect(() => {
    saveSelectedAppMode('institution');
  }, []);

  return <Redirect href="/" />;
}
