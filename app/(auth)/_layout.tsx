import { Stack } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function AuthLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="sign-in" 
        options={{ 
          title: 'Sign In',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="sign-up" 
        options={{ 
          title: 'Create Account',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
