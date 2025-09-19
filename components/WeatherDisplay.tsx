import { useTheme } from "@/context/ThemeContext";
import { FALLBACK_WEATHER, fetchWeather } from "@/services/weatherService";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const DEFAULT_LAT = 12.0001;
const DEFAULT_LON = 8.5167;

// WeatherAPI icon code mapping (basic)
function getWeatherApiIconName(iconCode: string) {
  switch (iconCode) {
    case "113":
      return "sunny"; // Clear/Sunny
    case "116":
      return "partly-sunny"; // Partly cloudy
    case "119":
      return "cloud"; // Cloudy
    case "122":
      return "cloudy"; // Overcast
    case "176":
    case "296":
      return "rainy"; // Patchy/light rain
    case "200":
      return "thunderstorm"; // Thundery
    case "227":
      return "snow"; // Snow
    default:
      return "sunny";
  }
}

function getWeatherApiIconColor(iconCode: string) {
  if (["113"].includes(iconCode)) return "#F59E0B";
  if (["116", "119", "122"].includes(iconCode)) return "#64748B";
  if (["176", "296", "200", "227"].includes(iconCode)) return "#3B82F6";
  return "#94A3B8";
}

export const WeatherDisplay = () => {
  const { colors } = useTheme();
  const [weather, setWeather] = useState(FALLBACK_WEATHER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        let weatherData;
        if (status === "granted") {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.LocationAccuracy.Low,
          });
          weatherData = await fetchWeather(
            position.coords.latitude,
            position.coords.longitude
          );
        } else {
          setError("Location permission denied. Showing weather for Kano.");
          weatherData = await fetchWeather(DEFAULT_LAT, DEFAULT_LON);
        }
        setWeather(weatherData);
      } catch (err) {
        setError("Could not fetch weather. Showing fallback data.");
        setWeather(FALLBACK_WEATHER);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <ThemedView style={[styles.card, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </ThemedView>
    );
  }

  const displayWeather = weather;
  const iconName = getWeatherApiIconName(displayWeather.icon);
  const iconColor = getWeatherApiIconColor(displayWeather.icon);

  console.log("WeatherDisplay render with weather:", displayWeather);

  return (
    <ThemedView style={styles.card}>
      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
      <View style={styles.header}>
        <View>
          <ThemedText style={[styles.city, { color: colors.text }]}>
            {displayWeather.city}
          </ThemedText>
          <ThemedText
            style={[styles.description, { color: colors.textSecondary }]}
          >
            {displayWeather.description}
          </ThemedText>
        </View>
        <Ionicons
          name={iconName as any}
          size={32}
          color={iconColor}
          style={styles.weatherIcon}
        />
      </View>
      <View style={styles.temperatureContainer}>
        <ThemedText style={[styles.temp, { color: colors.primary }]}>
          {Math.round(displayWeather.temp)}°
        </ThemedText>
        <ThemedText style={styles.celsius}>C</ThemedText>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    marginVertical: 12,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#00000010",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  city: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    textTransform: "capitalize",
    opacity: 0.8,
  },
  temperatureContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  temp: {
    fontSize: 48,
    fontWeight: "700",
    lineHeight: 56,
    marginRight: 4,
  },
  celsius: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    opacity: 0.7,
  },
  weatherIcon: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    color: "#EF4444",
    marginTop: 4,
  },
});
