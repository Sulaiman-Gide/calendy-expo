import { useTheme } from "@/context/ThemeContext";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import { parseISO } from "date-fns/fp";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import type { Theme as BaseCalendarTheme } from "react-native-calendars/src/types";

// Extend the base CalendarTheme type to include our custom styles
type CustomCalendarTheme = BaseCalendarTheme & {
  "stylesheet.calendar.header"?: any;
  "stylesheet.calendar.main"?: any;
  "stylesheet.day.basic"?: any;
};

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { supabase } from "@/lib/supabase";

// Configure calendar locale
LocaleConfig.locales["en"] = {
  monthNames: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  monthNamesShort: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  dayNames: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  dayNamesShort: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
  today: "Today",
};

LocaleConfig.defaultLocale = "en";

type Event = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  color: string;
};

export default function CalendarScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [markedDates, setMarkedDates] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events for the selected month
  const fetchEvents = async (month: Date) => {
    try {
      setIsLoading(true);
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("start_time", startOfMonth.toISOString())
        .lte("start_time", endOfMonth.toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;

      setEvents(data || []);
      updateMarkedDates(data || []);
    } catch (error) {
      console.log("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update marked dates for the calendar
  const updateMarkedDates = (eventsList: Event[]) => {
    const marked: any = {};

    // Mark today
    const today = format(new Date(), "yyyy-MM-dd");
    marked[today] = {
      selected: selectedDate === today,
      selectedColor: "#3b82f6",
      dotColor: "#3b82f6",
    };

    // Mark selected date
    if (selectedDate && selectedDate !== today) {
      marked[selectedDate] = { selected: true, selectedColor: "#3b82f6" };
    }

    // Mark dates with events
    eventsList.forEach((event) => {
      const date = event.start_time.split("T")[0];
      if (!marked[date]) {
        marked[date] = { marked: true, dotColor: event.color || "#3b82f6" };
      }
    });

    setMarkedDates(marked);
  };

  // Handle month change
  const onMonthChange = (month: any) => {
    const newMonth = new Date(month.dateString);
    setCurrentMonth(newMonth);
    fetchEvents(newMonth);
  };

  // Handle date selection
  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  // Load events when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchEvents(currentMonth);
    }, [currentMonth])
  );

  // Filter events for the selected date
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = event.start_time.split("T")[0];
      return eventDate === selectedDate;
    });
  }, [events, selectedDate]);

  // Format time for display
  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), "h:mm a");
  };

  // Calendar theme with custom styles
  const calendarTheme: CustomCalendarTheme = {
    backgroundColor: "transparent",
    calendarBackground: "transparent",
    textSectionTitleColor: colors.text,
    selectedDayBackgroundColor: colors.tint,
    selectedDayTextColor: "#ffffff",
    todayTextColor: colors.tint,
    dayTextColor: colors.text,
    textDisabledColor: `${colors.text}60`,
    dotColor: colors.tint,
    selectedDotColor: "#ffffff",
    arrowColor: colors.tint,
    monthTextColor: colors.text,
    textDayFontWeight: "500" as const,
    textMonthFontWeight: "600" as const,
    textDayHeaderFontWeight: "500" as const,
    textDayFontSize: 12,
    textMonthFontSize: 12,
    textDayHeaderFontSize: 12,
    "stylesheet.calendar.header": {
      week: {
        marginVertical: 14,
        flexDirection: "row",
        justifyContent: "space-around",
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border + "40",
        marginHorizontal: 20,
      },
    },
    "stylesheet.calendar.main": {
      container: {
        padding: 0,
        margin: 0,
      },
      monthView: {
        backgroundColor: "transparent",
      },
      week: {
        marginTop: 5,
        marginBottom: 5,
        flexDirection: "row",
        justifyContent: "space-around",
      },
    },
    "stylesheet.day.basic": {
      base: {
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 32,
      },
    },
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.calendarContainer}>
        <Calendar
          style={[styles.calendar, { backgroundColor: "transparent" }]}
          current={selectedDate}
          onDayPress={onDayPress}
          markedDates={markedDates}
          onMonthChange={onMonthChange}
          theme={calendarTheme}
          firstDay={1}
          hideExtraDays={false}
          enableSwipeMonths={true}
          hideArrows={false}
          renderArrow={(direction) => (
            <ThemedText
              style={{ color: colors.tint, fontSize: 20, fontWeight: "bold" }}
            >
              {direction === "left" ? "‹" : "›"}
            </ThemedText>
          )}
        />
      </View>

      <ThemedView style={styles.eventsContainer}>
        <ThemedText
          type="subtitle"
          style={[styles.eventsTitle, { color: colors.text }]}
        >
          {format(parseISO(selectedDate), "EEEE, MMMM d, yyyy")}
        </ThemedText>

        {isLoading ? (
          <ThemedText
            style={{ color: colors.text, textAlign: "center", marginTop: 60 }}
          >
            Loading events...
          </ThemedText>
        ) : filteredEvents.length > 0 ? (
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.eventItem,
                  {
                    backgroundColor: colors.card,
                    borderLeftColor: item.color || colors.primary,
                    shadowColor: colors.text === "#f5f5f5" ? "#000" : "#000",
                  },
                ]}
              >
                <View style={styles.eventTimeContainer}>
                  <ThemedText
                    style={[styles.eventTime, { color: colors.secondary }]}
                  >
                    {formatTime(item.start_time)}
                    {item.end_time && ` - ${formatTime(item.end_time)}`}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.eventTitle, { color: colors.text }]}>
                  {item.title}
                </ThemedText>
              </View>
            )}
          />
        ) : (
          <ThemedText style={[styles.noEvents, { color: colors.secondary }]}>
            No events for this day
          </ThemedText>
        )}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/add-event")}
        >
          <ThemedText style={styles.addButtonText}>+ Add Event</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  calendarContainer: {
    backgroundColor: "transparent",
  },
  calendar: {
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  header: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  eventsContainer: {
    flex: 1,
    paddingTop: 8,
  },
  eventsTitle: {
    marginTop: 15,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  eventItem: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 5,
    marginBottom: 12,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  eventTimeContainer: {
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  noEvents: {
    textAlign: "center",
    marginTop: 32,
    fontSize: 14,
  },
  addButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 110,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
