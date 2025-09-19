const API_KEY = "aca048d7eef54384915163144251809";
const BASE_URL = "https://api.weatherapi.com/v1/current.json";

export const FALLBACK_WEATHER = {
  temp: 32,
  description: "Sunny",
  icon: "113",
  city: "Kano",
};

export type WeatherData = {
  temp: number;
  description: string;
  icon: string;
  city: string;
};

export const fetchWeather = async (
  lat: number,
  lon: number
): Promise<WeatherData> => {
  if (!API_KEY) {
    console.warn(
      "No valid WeatherAPI.com API key. Using fallback weather data."
    );
    return FALLBACK_WEATHER;
  }
  try {
    const response = await fetch(
      `${BASE_URL}?key=${API_KEY}&q=${lat},${lon}&aqi=no`
    );
    if (!response.ok) {
      console.warn("Weather API error, using fallback data");
      return FALLBACK_WEATHER;
    }
    const data = await response.json();
    return {
      temp: Math.round(data.current.temp_c),
      description: data.current.condition.text,
      icon: data.current.condition.code.toString(),
      city: data.location.name,
    };
  } catch (error) {
    console.log("Error fetching weather, using fallback data:", error);
    return FALLBACK_WEATHER;
  }
};

export const getWeatherIcon = (iconCode: string) => {
  return `https://cdn.weatherapi.com/weather/64x64/day/${iconCode}.png`;
};
