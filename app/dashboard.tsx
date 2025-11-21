// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { database, GlassType } from '@/services/database';

export default function HomeScreen() {
  const [userName, setUserName] = useState('');
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [totalDaysAchieved, setTotalDaysAchieved] = useState(0);
  const [weeklyData, setWeeklyData] = useState<number[]>([]);
  const [glassTypes, setGlassTypes] = useState<GlassType[]>([]);
  const [showGlassModal, setShowGlassModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger le profil
      const profile = await database.getUserProfile();
      if (profile) {
        setUserName(profile.name);
        setDailyGoal(profile.dailyGoal);
      }

      // Charger les types de verres
      const glasses = await database.getGlassTypes();
      setGlassTypes(glasses);

      // Charger la consommation du jour
      const today = new Date().toISOString().split('T')[0];
      const todayTotal = await database.getTotalForDate(today);
      setCurrentAmount(todayTotal);

      // Charger les statistiques
      const consecutive = await database.getConsecutiveDays();
      setConsecutiveDays(consecutive);

      const totalDays = await database.getTotalDaysAchieved();
      setTotalDaysAchieved(totalDays);

      // Charger les données de la semaine
      await loadWeeklyData();
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const loadWeeklyData = async () => {
    try {
      // Calculer le début et la fin de la semaine (lundi à dimanche)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lundi = début
      
      const monday = new Date(today);
      monday.setDate(today.getDate() + diff);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const startDate = monday.toISOString().split('T')[0];
      const endDate = sunday.toISOString().split('T')[0];

      const data = await database.getWeeklyData(startDate, endDate);
      
      // Créer un tableau avec les 7 jours
      const weekData: number[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = data.find(d => d.date === dateStr);
        weekData.push(dayData ? dayData.total : 0);
      }
      
      setWeeklyData(weekData);
    } catch (error) {
      console.error('Erreur lors du chargement des données hebdomadaires:', error);
    }
  };

  const handleDrinkWater = async (glassType: GlassType) => {
    try {
      await database.addWaterLog(glassType.id, glassType.volume);
      setShowGlassModal(false);
      await loadData();

      // Vérifier si l'objectif est atteint
      const newTotal = currentAmount + glassType.volume;
      if (newTotal >= dailyGoal && currentAmount < dailyGoal) {
        Alert.alert(
          '🎉 Bravo !',
          `Vous avez atteint votre objectif quotidien de ${dailyGoal}ml !`,
          [{ text: 'Super !', style: 'default' }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer votre consommation');
      console.error(error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const progressPercentage = Math.min((currentAmount / dailyGoal) * 100, 100);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour, {userName} ! 👋</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
      </View>

      {/* Progression du jour */}
      <View style={styles.progressCard}>
        <Text style={styles.cardTitle}>Objectif du jour</Text>
        <View style={styles.progressCircle}>
          <Text style={styles.progressAmount}>{currentAmount}</Text>
          <Text style={styles.progressGoal}>/ {dailyGoal} ml</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {progressPercentage >= 100
            ? '✅ Objectif atteint !'
            : `${Math.round(progressPercentage)}% de votre objectif`}
        </Text>
      </View>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{consecutiveDays}</Text>
          <Text style={styles.statLabel}>Jours consécutifs 🔥</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalDaysAchieved}</Text>
          <Text style={styles.statLabel}>Objectifs atteints 🎯</Text>
        </View>
      </View>

      {/* Graphique hebdomadaire */}
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Cette semaine</Text>
        
        <View style={styles.chartLabels}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => (
            <Text key={i} style={styles.chartLabel}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.chartLabels}>
          {weeklyData.map((day, i) => (
            <Text key={i} style={styles.chartLabel}>
              {day}
            </Text>
          ))}
        </View>
      </View>

      {/* Bouton boire de l'eau */}
      <TouchableOpacity
        style={styles.drinkButton}
        onPress={() => setShowGlassModal(true)}
      >
        <Text style={styles.drinkButtonText}>💧 Boire de l'eau</Text>
      </TouchableOpacity>

      {/* Modal de sélection de verre */}
      <Modal
        visible={showGlassModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGlassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisissez votre contenant</Text>
            
            {glassTypes.map((glass) => (
              <TouchableOpacity
                key={glass.id}
                style={styles.glassOption}
                onPress={() => handleDrinkWater(glass)}
              >
                <Text style={styles.glassName}>{glass.name}</Text>
                <Text style={styles.glassVolume}>{glass.volume} ml</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGlassModal(false)}
            >
              <Text style={styles.modalCloseText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 10,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 16,
  },
  progressCircle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  progressGoal: {
    fontSize: 18,
    color: '#64748B',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 6,
  },
  progressText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartContainer: {
    marginVertical: 16,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  drinkButton: {
    backgroundColor: '#2563EB',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  drinkButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 20,
    textAlign: 'center',
  },
  glassOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  glassName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  glassVolume: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  modalCloseButton: {
    marginTop: 12,
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
});