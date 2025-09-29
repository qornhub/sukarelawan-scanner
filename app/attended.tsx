// app/(tabs)/attended.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api, { loadTokenAndUser } from "./api"; // correct import path

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

function formatEventDate(startStr?: string | null) {
  if (!startStr) return "";
  const d = new Date(startStr);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function AttendedScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttendedEvents = useCallback(async () => {
    setError(null);
    try {
      await loadTokenAndUser();
      const res = await api.get("/volunteer/events/attended");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error("Error fetching attended events", err);
      setError(err?.response?.data?.message || err.message || "Failed to load attended events");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAttendedEvents();
  }, [loadAttendedEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadAttendedEvents();
  }, [loadAttendedEvents]);

  const totalEvents = items.length;

  const renderEventCard = ({ item }: { item: any }) => {
    const location = item.eventLocation ?? item.venueName ?? "";
    const attendedAt = item.attendanceTime ?? item.created_at ?? null;
    return (
      <TouchableOpacity style={styles.eventCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {item.eventTitle || "Untitled Event"}
            </Text>
            <View style={styles.pointsBadge}>
              <Ionicons name="trophy" size={14} color="#fff" />
              <Text style={styles.pointsText}>{item.eventPoints ?? 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{formatEventDate(item.eventStart)}</Text>
          </View>

          {location ? (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.detailText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Attended {formatDate(attendedAt)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, styles.attendedDot]} />
            <Text style={styles.statusText}>attended</Text>
          </View>

          <View style={styles.attendanceId}>
            <Text style={styles.attendanceIdText}>
              ID: {String(item.attendance_id ?? "").slice(-8) || "N/A"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-done-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Events Attended Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Events you attend will appear here with your earned points and attendance records
      </Text>
      <TouchableOpacity style={styles.browseButton} onPress={() => router.push("/upcoming")}>
        <Text style={styles.browseButtonText}>Browse Upcoming Events</Text>
      </TouchableOpacity>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="warning-outline" size={64} color="#ff6b6b" />
      <Text style={styles.errorStateTitle}>Unable to Load Events</Text>
      <Text style={styles.emptyStateSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadAttendedEvents}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading your event history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Attended Events</Text>
          <Text style={styles.headerSubtitle}>You have attended {totalEvents} events</Text>
        </View>

        {error ? (
          <ErrorState />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) =>
              item.attendance_id
                ? String(item.attendance_id)
                : String(item.event_id ?? Math.random())
            }
            renderItem={renderEventCard}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#0066cc"]}
                tintColor="#0066cc"
              />
            }
            ListEmptyComponent={<EmptyState />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              items.length === 0 ? styles.emptyListContainer : styles.listContainer
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  container: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
  header: { paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
  headerSubtitle: { fontSize: 16, color: "#666" },
  listContainer: { paddingVertical: 8 },
  emptyListContainer: { flex: 1 },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { marginBottom: 16 },
  titleContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eventTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a", flex: 1, marginRight: 12 },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0066cc",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 50,
    justifyContent: "center",
  },
  pointsText: { color: "#fff", fontSize: 12, fontWeight: "600", marginLeft: 4 },
  eventDetails: { marginBottom: 16 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  detailText: { fontSize: 14, color: "#666", marginLeft: 12, flex: 1 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statusContainer: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  attendedDot: { backgroundColor: "#0066cc" },
  statusText: { fontSize: 12, color: "#0066cc", fontWeight: "500" },
  attendanceId: { backgroundColor: "#f5f5f5", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  attendanceIdText: {
    fontSize: 10,
    color: "#888",
    fontWeight: "500",
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
  },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyStateTitle: { fontSize: 20, fontWeight: "600", color: "#666", marginTop: 16, marginBottom: 8, textAlign: "center" },
  errorStateTitle: { fontSize: 20, fontWeight: "600", color: "#ff6b6b", marginTop: 16, marginBottom: 8, textAlign: "center" },
  emptyStateSubtitle: { fontSize: 16, color: "#999", textAlign: "center", marginBottom: 24, lineHeight: 22 },
  browseButton: { backgroundColor: "#0066cc", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  browseButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  retryButton: { backgroundColor: "#ff6b6b", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
