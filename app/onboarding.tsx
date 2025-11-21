// app/onboarding.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '@/services/database';

interface GlassTypeInput {
  id: string;
  name: string;
  volume: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Étape 1: Informations personnelles
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  
  // Étape 2: Types de verres
  const [glassTypes, setGlassTypes] = useState<GlassTypeInput[]>([
    { id: '1', name: 'Petit verre', volume: '50' },
    { id: '2', name: 'Grand verre', volume: '100' },
  ]);
  
  // Étape 3: Objectif quotidien
  const [dailyGoal, setDailyGoal] = useState('2000');

  const addGlassType = () => {
    const newId = (Math.max(...glassTypes.map(g => parseInt(g.id))) + 1).toString();
    setGlassTypes([...glassTypes, { id: newId, name: '', volume: '' }]);
  };

  const removeGlassType = (id: string) => {
    if (glassTypes.length > 1) {
      setGlassTypes(glassTypes.filter(g => g.id !== id));
    }
  };

  const updateGlassType = (id: string, field: 'name' | 'volume', value: string) => {
    setGlassTypes(glassTypes.map(g => 
      g.id === id ? { ...g, [field]: value } : g
    ));
  };

  const validateStep1 = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return false;
    }
    if (!age || parseInt(age) < 1 || parseInt(age) > 120) {
      Alert.alert('Erreur', 'Veuillez entrer un âge valide');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    for (const glass of glassTypes) {
      if (!glass.name.trim()) {
        Alert.alert('Erreur', 'Tous les verres doivent avoir un nom');
        return false;
      }
      if (!glass.volume || parseInt(glass.volume) < 1) {
        Alert.alert('Erreur', 'Tous les verres doivent avoir un volume valide');
        return false;
      }
    }
    return true;
  };

  const validateStep3 = () => {
    if (!dailyGoal || parseInt(dailyGoal) < 500) {
      Alert.alert('Erreur', 'L\'objectif quotidien doit être au moins 500ml');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleFinish = async () => {
    if (!validateStep3()) return;

    try {
      await database.init();
      // Sauvegarder le profil
      await database.saveUserProfile(name, parseInt(age), parseInt(dailyGoal));

      // Sauvegarder les types de verres
      for (const glass of glassTypes) {
        await database.addGlassType(glass.name, parseInt(glass.volume));
      }
      // Naviguer vers la page d'accueil
      router.replace('/');
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la configuration');
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Indicateur d'étape */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]} />
        </View>

        {/* Étape 1: Informations personnelles */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Bienvenue ! 👋</Text>
            <Text style={styles.subtitle}>Commençons par faire connaissance</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Comment voulez-vous qu'on vous appelle ?</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre prénom"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quel âge avez-vous ?</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre âge"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Suivant</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Étape 2: Types de verres */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Vos contenants 🥤</Text>
            <Text style={styles.subtitle}>
              Quels verres/bouteilles utilisez-vous ?
            </Text>

            {glassTypes.map((glass, index) => (
              <View key={glass.id} style={styles.glassItem}>
                <View style={styles.glassInputs}>
                  <TextInput
                    style={[styles.input, styles.glassNameInput]}
                    placeholder="Nom (ex: Bouteille)"
                    value={glass.name}
                    onChangeText={(value) => updateGlassType(glass.id, 'name', value)}
                  />
                  <TextInput
                    style={[styles.input, styles.glassVolumeInput]}
                    placeholder="ml"
                    value={glass.volume}
                    onChangeText={(value) => updateGlassType(glass.id, 'volume', value)}
                    keyboardType="numeric"
                  />
                </View>
                {glassTypes.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeGlassType(glass.id)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addGlassType}>
              <Text style={styles.addButtonText}>+ Ajouter un contenant</Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setStep(1)}
              >
                <Text style={styles.buttonSecondaryText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>Suivant</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Étape 3: Objectif quotidien */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Votre objectif 🎯</Text>
            <Text style={styles.subtitle}>
              Combien d'eau souhaitez-vous boire par jour ?
            </Text>

            <View style={styles.goalContainer}>
              <TextInput
                style={styles.goalInput}
                value={dailyGoal}
                onChangeText={setDailyGoal}
                keyboardType="numeric"
              />
              <Text style={styles.goalUnit}>ml</Text>
            </View>

            <Text style={styles.hint}>
              💡 Recommandation: 2000ml - 2500ml par jour
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setStep(2)}
              >
                <Text style={styles.buttonSecondaryText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleFinish}>
                <Text style={styles.buttonText}>Terminer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#BFDBFE',
  },
  stepDotActive: {
    backgroundColor: '#2563EB',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stepLine: {
    width: 50,
    height: 2,
    backgroundColor: '#BFDBFE',
  },
  stepContent: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  glassItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  glassInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  glassNameInput: {
    flex: 2,
  },
  glassVolumeInput: {
    flex: 1,
  },
  removeButton: {
    marginLeft: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#DC2626',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 30,
  },
  addButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  goalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563EB',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    textAlign: 'center',
    minWidth: 200,
  },
  goalUnit: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#64748B',
    marginLeft: 10,
  },
  hint: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  buttonSecondaryText: {
    color: '#334155',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
});