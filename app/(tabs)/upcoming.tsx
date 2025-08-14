import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useFocusEffect } from "expo-router";
import React, { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  color: string;
  location?: string;
}

export default function UpcomingScreen() {
  const { colors } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchUpcomingEvents();
    }, [])
  );

  const fetchUpcomingEvents = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("end_time", now)
        .order("start_time", { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <View
      style={[
        styles.eventCard,
        {
          backgroundColor: colors.card,
          borderLeftColor: item.color || colors.primary,
          borderLeftWidth: 4,
          borderRightWidth: 1,
          borderRightColor: "#dcdcdc40",
        },
      ]}
    >
      <View style={styles.eventContent}>
        <Text style={[styles.eventTitle, { color: colors.text }]}>
          {item.title}
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={styles.eventDetailRow}>
            <MaterialIcons
              name="access-time"
              size={16}
              color={colors.secondary}
            />
            <Text style={[styles.eventDetail, { color: colors.secondary }]}>
              {format(parseISO(item.start_time), "MMM d, yyyy • h:mm a")}
            </Text>
          </View>

          {item.location && (
            <View style={styles.eventDetailRow}>
              <MaterialIcons
                name="location-on"
                size={16}
                color={colors.secondary}
              />
              <Text style={[styles.eventDetail, { color: colors.secondary }]}>
                {item.location}
              </Text>
            </View>
          )}
        </View>
        {item.description && (
          <Text
            style={[styles.eventDescription, { color: colors.secondary }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.description}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: colors.text }}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Upcoming Events
      </Text>

      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons
            name="event-available"
            size={48}
            color={colors.secondary}
          />
          <Text style={[styles.emptyText, { color: colors.secondary }]}>
            No upcoming events. Create one to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 10,
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  eventCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  eventDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  eventDetail: {
    marginLeft: 8,
    fontSize: 14,
  },
  eventDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 16,
  },
});
