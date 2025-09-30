// app/(tabs)/upcoming.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api, { loadTokenAndUser } from "../api";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  // More user-friendly date format
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) {
    return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (d.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return d.toLocaleDateString([], { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

function formatEventDuration(startStr?: string | null, endStr?: string | null) {
  if (!startStr) return "";
  
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : null;
  
  if (isNaN(start.getTime())) return "";

  if (!end || isNaN(end.getTime())) {
    return formatDate(startStr);
  }

  const isSameDay = start.toDateString() === end.toDateString();
  
  if (isSameDay) {
    return `${start.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })} • ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return `${formatDate(startStr)} - ${formatDate(endStr)}`;
  }
}

export default function UpcomingScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setError(null);
    try {
      await loadTokenAndUser();
      const res = await api.get("/volunteer/events/upcoming");
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error("Error fetching upcoming events", err);
      setError(err?.response?.data?.message || err.message || "Failed to load events");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadEvents();
  }, [loadEvents]);

  const renderEventCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => {
        // Navigate to event details if needed
        // router.push(`/events/${item.event_id}`);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.eventTitle || "Untitled Event"}
          </Text>
          <View style={styles.pointsBadge}>
            <Ionicons name="trophy-outline" size={14} color="#fff" />
            <Text style={styles.pointsText}>{item.eventPoints || 0}</Text>
          </View>
        </View>
      </View>

      <View style={styles.eventDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatEventDuration(item.eventStart, item.eventEnd)}
          </Text>
        </View>

        {item.eventLocation && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.eventLocation}
            </Text>
          </View>
        )}

        {item.eventDescription && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <Text style={styles.detailText} numberOfLines={2}>
              {item.eventDescription}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, styles.registeredDot]} />
          <Text style={styles.statusText}>confirmed</Text>
        </View>
        <TouchableOpacity style={styles.directionsButton}>
          <Ionicons name="navigate-outline" size={16} color="#0066cc" />
          <Text style={styles.directionsText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Upcoming Events</Text>
      <Text style={styles.emptyStateSubtitle}>
        You haven't registered for any upcoming events yet
      </Text>
      
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="warning-outline" size={64} color="#ff6b6b" />
      <Text style={styles.errorStateTitle}>Unable to Load Events</Text>
      <Text style={styles.emptyStateSubtitle}>
        {error}
      </Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={loadEvents}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading upcoming events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upcoming Events</Text>
          <Text style={styles.headerSubtitle}>
            {events.length} event{events.length !== 1 ? 's' : ''} registered
          </Text>
        </View>

        {error ? (
          <ErrorState />
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.event_id ? String(item.event_id) : Math.random().toString()}
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
            contentContainerStyle={events.length === 0 ? styles.emptyListContainer : styles.listContainer}
          />
        )}
      </View>
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
    paddingHorizontal: 20,
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
  header: {
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyListContainer: {
    flex: 1,
  },
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
  cardHeader: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
    marginRight: 12,
  },
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
  pointsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  eventDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  registeredDot: {
    backgroundColor: "#00c851",
  },
  statusText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#e6f2ff",
  },
  directionsText: {
    fontSize: 12,
    color: "#0066cc",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ff6b6b",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: "#0066cc",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});