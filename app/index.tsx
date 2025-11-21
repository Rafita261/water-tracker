// app/_layout.tsx
import { useEffect, useState } from 'react';
import { database } from '@/services/database';
import { useRouter } from 'expo-router';

export default function Index() {
  const [hasProfile, setHasProfile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      // Initialiser la base de données
      await database.init();

      // Vérifier si l'utilisateur a déjà un profil
      const profile = await database.getUserProfile();
      setHasProfile(!!profile);

      // Rediriger vers onboarding si pas de profil
      console.log(profile)

      if (profile) {
        return router.replace('/dashboard');
      }
      else {
        router.replace('/onboarding')
      }
    } catch (error) {
      return console.error('Erreur d\'initialisation:', error);
    }
  }
}