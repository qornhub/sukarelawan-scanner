// app/(tabs)/home.tsx
import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api, { loadTokenAndUser, removeTokenAndUser } from "../api";
import dayjs from "dayjs";

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      await loadTokenAndUser();
      const res = await api.get("/volunteer/profile");
      setProfile(res.data);
    } catch (err: any) {
      console.error("Error fetching profile", err);
      // if unauthorized, force logout (optional)
      if (err?.response?.status === 401) {
        await safeLogoutNavigate();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const computedAge = (() => {
    if (profile?.age) return profile.age;
    if (profile?.dateOfBirth) {
      return dayjs().diff(dayjs(profile.dateOfBirth), "year");
    }
    return null;
  })();

  const fallbackAvatar = require("../../assets/default-avatar.png");

  // logout helper
  const safeLogoutNavigate = async () => {
    try {
      await removeTokenAndUser();
    } catch (e) {
      // ignore errors clearing storage
      console.warn("Error clearing token/user", e);
    } finally {
      router.replace("/login");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await safeLogoutNavigate();
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Welcome (no top-right logout) */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.nameText}>{profile?.name?.split(' ')[0] || "Volunteer"}! 👋</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileContent}>
            <Image
              source={
                profile?.profilePhoto
                  ? { uri: profile.profilePhoto }
                  : fallbackAvatar
              }
              style={styles.avatar}
              resizeMode="cover"
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.name || "Volunteer"}</Text>
              <View style={styles.profileDetails}>
                {computedAge && (
                  <Text style={styles.profileDetail}>{computedAge} years</Text>
                )}
                {profile?.gender && (
                  <Text style={styles.profileDetail}>• {profile.gender}</Text>
                )}
              </View>
              {profile?.email && (
                <Text style={styles.profileEmail}>{profile.email}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.total_attended ?? 0}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.total_points ?? 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.actionsGrid}>
            {/* Scan QR - neutral card like others (icon still colored) */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/scanner")}
            >
              <View style={[styles.actionIconContainer, styles.neutralIcon]}>
                <Ionicons name="scan-outline" size={24} color="#0066cc" />
              </View>
              <Text style={styles.actionText}>Scan QR</Text>
              <Text style={styles.actionSubtext}>Mark attendance</Text>
            </TouchableOpacity>

            {/* Upcoming */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/upcoming")}
            >
              <View style={[styles.actionIconContainer, styles.secondaryIcon]}>
                <Ionicons name="calendar-outline" size={24} color="#0066cc" />
              </View>
              <Text style={styles.actionText}>Upcoming</Text>
              <Text style={styles.actionSubtext}>View events</Text>
            </TouchableOpacity>

            {/* Attended */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/attended")}
            >
              <View style={[styles.actionIconContainer, styles.secondaryIcon]}>
                <Ionicons name="checkmark-done-outline" size={24} color="#0066cc" />
              </View>
              <Text style={styles.actionText}>Attended</Text>
              <Text style={styles.actionSubtext}>Past events</Text>
            </TouchableOpacity>

            {/* Logout - placed as a grid item */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleLogout}
            >
              <View style={[styles.actionIconContainer, styles.dangerIcon]}>
                <Ionicons name="log-out-outline" size={24} color="#b71c1c" />
              </View>
              <Text style={styles.actionText}>Logout</Text>
              <Text style={styles.actionSubtext}>Sign out of your account</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },

  nameText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#e6f2ff",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  profileDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 14,
    color: "#666",
  },
  profileEmail: {
    fontSize: 14,
    color: "#0066cc",
  },

  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0066cc",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 8,
  },

  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  // neutral icon circle (used for Scan)
  neutralIcon: {
    backgroundColor: "#f0f0f0",
  },

  // secondary icon circle (used for Upcoming/Attended)
  secondaryIcon: {
    backgroundColor: "#e6f2ff",
  },

  // danger icon circle (for logout)
  dangerIcon: {
    backgroundColor: "#fdecea",
  },

  actionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 12,
    color: "#666",
  },

  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
