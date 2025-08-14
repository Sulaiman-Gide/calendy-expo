import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, subMinutes } from "date-fns";
import { useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import * as Notifications from 'expo-notifications';
import { scheduleNotification } from "@/utils/notifications";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { MaterialIcons } from "@expo/vector-icons";

const EVENT_COLORS = [
  { id: "#3b82f6", name: "Blue" },
  { id: "#ef4444", name: "Red" },
  { id: "#10b981", name: "Green" },
  { id: "#f59e0b", name: "Yellow" },
  { id: "#8b5cf6", name: "Purple" },
];

export default function AddEventScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    color: "#3b82f6",
    isAllDay: false,
  });

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600000));
  const [pickerState, setPickerState] = useState({
    type: null as "start" | "end" | null,
    mode: "date" as "date" | "time",
    visible: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const showDateTimePicker = (type: "start" | "end") => {
    setPickerState({ type, mode: "date", visible: true });
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    if (!selectedDate) {
      setPickerState({ type: null, mode: "date", visible: false });
      return;
    }

    if (pickerState.mode === "date") {
      // Save the selected date and move to time selection
      if (pickerState.type === "start") {
        const updated = new Date(startDate);
        updated.setFullYear(selectedDate.getFullYear());
        updated.setMonth(selectedDate.getMonth());
        updated.setDate(selectedDate.getDate());
        setStartDate(updated);
      } else if (pickerState.type === "end") {
        const updated = new Date(endDate);
        updated.setFullYear(selectedDate.getFullYear());
        updated.setMonth(selectedDate.getMonth());
        updated.setDate(selectedDate.getDate());
        setEndDate(updated);
      }
      setPickerState((prev) => ({ ...prev, mode: "time", visible: true }));
    } else {
      // Save the selected time
      if (pickerState.type === "start") {
        const updated = new Date(startDate);
        updated.setHours(selectedDate.getHours());
        updated.setMinutes(selectedDate.getMinutes());
        setStartDate(updated);

        if (endDate < updated) {
          const newEnd = new Date(updated);
          newEnd.setHours(updated.getHours() + 1);
          setEndDate(newEnd);
        }
      } else if (pickerState.type === "end") {
        const updated = new Date(endDate);
        updated.setHours(selectedDate.getHours());
        updated.setMinutes(selectedDate.getMinutes());
        setEndDate(updated);
      }
      setPickerState({ type: null, mode: "date", visible: false });
    }
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter a title for the event");
      return;
    }

    if (endDate < startDate) {
      Alert.alert("Error", "End time must be after start time");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase.from("events").insert([
        {
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          location: formData.location || null,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          color: formData.color,
          is_all_day: formData.isAllDay,
        },
      ]);

      if (error) throw error;

      // Schedule notification 15 minutes before the event starts
      const notificationTime = subMinutes(startDate, 15);
      await scheduleNotification(
        `Upcoming: ${formData.title}`,
        formData.description || `Your event is starting soon!`,
        notificationTime
      );

      // Also schedule a notification for when the event starts
      await scheduleNotification(
        `Event Started: ${formData.title}`,
        formData.description || `Your event has started!`,
        startDate
      );

      Alert.alert("Success", "Event created successfully! Notifications scheduled.");
      navigation.goBack();
    } catch (error) {
      console.error("Error saving event:", error);
      Alert.alert("Error", "Failed to save event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Title</ThemedText>
            <ThemedTextInput
              style={
                [
                  styles.input,
                  { backgroundColor: colors.card },
                ] as StyleProp<TextStyle>
              }
              placeholder="Event title"
              placeholderTextColor={colors.secondary}
              value={formData.title}
              onChangeText={(text: string) => handleInputChange("title", text)}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Description (Optional)</ThemedText>
            <ThemedTextInput
              style={
                [
                  styles.input,
                  styles.multilineInput,
                  { backgroundColor: colors.card },
                ] as StyleProp<TextStyle>
              }
              placeholder="Add details..."
              placeholderTextColor={colors.secondary}
              multiline
              numberOfLines={3}
              value={formData.description}
              onChangeText={(text: string) =>
                handleInputChange("description", text)
              }
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Starts</ThemedText>
            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: colors.card }]}
              onPress={() => showDateTimePicker("start")}
            >
              <ThemedText>{formatDateTime(startDate)}</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Ends</ThemedText>
            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: colors.card }]}
              onPress={() => showDateTimePicker("end")}
            >
              <ThemedText>{formatDateTime(endDate)}</ThemedText>
            </TouchableOpacity>
          </View>

          {pickerState.visible && pickerState.type && (
            <DateTimePicker
              value={pickerState.type === "start" ? startDate : endDate}
              mode={pickerState.mode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
            />
          )}

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>All-day</ThemedText>
            <View style={styles.toggleContainer}>
              <ThemedText style={{ marginRight: 10 }}>
                {formData.isAllDay ? "Yes" : "No"}
              </ThemedText>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: formData.isAllDay
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={() =>
                  handleInputChange("isAllDay", !formData.isAllDay)
                }
              >
                <View
                  style={[
                    styles.toggleCircle,
                    {
                      transform: [{ translateX: formData.isAllDay ? 20 : 0 }],
                      backgroundColor: "#fff",
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Color</ThemedText>
            <View style={styles.colorPickerContainer}>
              {EVENT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color.id}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color.id,
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                  onPress={() => handleInputChange("color", color.id)}
                >
                  {formData.color === color.id && (
                    <MaterialIcons name="check" size={20} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Location (Optional)</ThemedText>
            <ThemedTextInput
              style={
                [
                  styles.input,
                  { backgroundColor: colors.card },
                ] as StyleProp<TextStyle>
              }
              placeholder="Add location"
              placeholderTextColor={colors.secondary}
              value={formData.location}
              onChangeText={(text: string) =>
                handleInputChange("location", text)
              }
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                isSubmitting && styles.disabledButton,
              ]}
              onPress={handleSaveEvent}
              disabled={isSubmitting}
            >
              <ThemedText style={styles.saveButtonText}>
                {isSubmitting ? "Saving..." : "Save Event"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 10, paddingTop: 30 },
  keyboardAvoidingView: { flex: 1 },
  scrollView: { flexGrow: 1, padding: 16 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: { borderRadius: 8, padding: 12, fontSize: 16 },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#cccccc90",
  },
  dateTimeButton: {
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleCircle: { width: 26, height: 26, borderRadius: 13 },
  colorPickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  disabledButton: { opacity: 0.6 },
});
