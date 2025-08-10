import { useCallback, useState, useMemo } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { format, addMonths, subMonths, isToday } from 'date-fns';
import { parseISO } from 'date-fns/fp';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { supabase } from '@/lib/supabase';

// Configure calendar locale
LocaleConfig.locales['en'] = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],
  dayNames: [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ],
  dayNamesShort: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  today: 'Today'
};

LocaleConfig.defaultLocale = 'en';

type Event = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  color: string;
};

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
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
        .from('events')
        .select('*')
        .gte('start_time', startOfMonth.toISOString())
        .lte('start_time', endOfMonth.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
      updateMarkedDates(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update marked dates for the calendar
  const updateMarkedDates = (eventsList: Event[]) => {
    const marked: any = {};
    
    // Mark today
    const today = format(new Date(), 'yyyy-MM-dd');
    marked[today] = { selected: selectedDate === today, selectedColor: '#3b82f6', dotColor: '#3b82f6' };
    
    // Mark selected date
    if (selectedDate && selectedDate !== today) {
      marked[selectedDate] = { selected: true, selectedColor: '#3b82f6' };
    }
    
    // Mark dates with events
    eventsList.forEach(event => {
      const date = event.start_time.split('T')[0];
      if (!marked[date]) {
        marked[date] = { marked: true, dotColor: event.color || '#3b82f6' };
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
    return events.filter(event => {
      const eventDate = event.start_time.split('T')[0];
      return eventDate === selectedDate;
    });
  }, [events, selectedDate]);

  // Format time for display
  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'h:mm a');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">
          {format(currentMonth, 'MMMM yyyy')}
        </ThemedText>
      </View>
      
      <Calendar
        style={styles.calendar}
        current={selectedDate}
        onDayPress={onDayPress}
        markedDates={markedDates}
        onMonthChange={onMonthChange}
        theme={{
          backgroundColor: 'transparent',
          calendarBackground: 'transparent',
          textSectionTitleColor: '#3b82f6',
          selectedDayBackgroundColor: '#3b82f6',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#3b82f6',
          dayTextColor: '#1a1a1a',
          textDisabledColor: '#d1d5db',
          dotColor: '#3b82f6',
          selectedDotColor: '#ffffff',
          arrowColor: '#3b82f6',
          monthTextColor: '#1a1a1a',
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 14,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 12,
        }}
      />
      
      <View style={styles.eventsContainer}>
        <ThemedText type="subtitle" style={styles.eventsTitle}>
          {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
        </ThemedText>
        
        {isLoading ? (
          <ThemedText>Loading events...</ThemedText>
        ) : filteredEvents.length > 0 ? (
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.eventItem, { borderLeftColor: item.color || '#3b82f6' }]}>
                <View style={styles.eventTimeContainer}>
                  <ThemedText style={styles.eventTime}>
                    {formatTime(item.start_time)}
                    {item.end_time && ` - ${formatTime(item.end_time)}`}
                  </ThemedText>
                </View>
                <ThemedText style={styles.eventTitle}>{item.title}</ThemedText>
              </View>
            )}
          />
        ) : (
          <ThemedText style={styles.noEvents}>No events for this day</ThemedText>
        )}
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => console.log('Add event')}
        >
          <ThemedText style={styles.addButtonText}>+ Add Event</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendar: {
    borderRadius: 10,
    elevation: 4,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  eventsContainer: {
    flex: 1,
  },
  eventsTitle: {
    marginBottom: 16,
    color: '#4b5563',
  },
  eventItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  eventTimeContainer: {
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  noEvents: {
    textAlign: 'center',
    marginTop: 32,
    color: '#9ca3af',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 32,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
