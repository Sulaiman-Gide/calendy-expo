import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const onboardingData = [
  {
    id: "1",
    title: "Welcome to Calendy",
    description:
      "Your personal scheduling assistant for managing all your appointments and events in one place.",
    image: require("@/assets/images/photo-1.jpg"),
  },
  {
    id: "2",
    title: "Schedule with Ease",
    description:
      "Book, reschedule, and manage appointments with just a few taps.",
    image: require("@/assets/images/photo-2.jpg"),
  },
  {
    id: "3",
    title: "Stay Organized",
    description:
      "Keep track of all your events and never miss an important meeting again.",
    image: require("@/assets/images/photo-3.jpg"),
  },
];

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < onboardingData.length) {
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    // Always go to sign-in after onboarding
    router.replace("/(auth)/sign-in");
  };

  const SlideContent = ({
    item,
    index,
  }: {
    item: (typeof onboardingData)[0];
    index: number;
  }) => {
    const textStyle = useAnimatedStyle(() => {
      const inputRange = [
        (index - 1) * width,
        index * width,
        (index + 1) * width,
      ];

      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0, 1, 0],
        Extrapolate.CLAMP
      );

      const translateY = interpolate(
        scrollX.value,
        inputRange,
        [50, 0, 50],
        Extrapolate.CLAMP
      );

      return {
        opacity,
        transform: [{ translateY }],
      };
    });

    return (
      <View style={styles.slideContainer}>
        <ImageBackground
          source={item.image}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradient}
          >
            <Animated.View style={[styles.textContainer, textStyle]}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </Animated.View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          scrollX.value = offsetX;
          const index = Math.round(offsetX / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => (
          <SlideContent key={item.id} item={item} index={index} />
        ))}
      </Animated.ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.dotsContainer}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentIndex === index && styles.activeDot]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Ionicons
            name={
              currentIndex === onboardingData.length - 1
                ? "checkmark"
                : "arrow-forward"
            }
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollView: {
    flex: 1,
  },
  slideContainer: {
    width,
    height,
    justifyContent: "flex-end",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    paddingBottom: 150,
    paddingHorizontal: 32,
  },
  textContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 38,
    fontWeight: "bold",
    color: "white",
    textAlign: "left",
    marginBottom: 16,
    fontFamily: "BeVietnamPro-Bold",
  },
  description: {
    fontSize: 18,
    color: "rgba(255,255,255,0.8)",
    textAlign: "left",
    lineHeight: 26,
    fontFamily: "BeVietnamPro-Regular",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 50,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontFamily: "BeVietnamPro-Regular",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#1b2196",
    width: 24,
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1b2196",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#1b2196",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default OnboardingScreen;
