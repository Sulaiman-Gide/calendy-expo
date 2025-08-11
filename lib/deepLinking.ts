import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from './supabase';

export const prefixes = [
  Linking.createURL('/'),
  'calendy://',
  'https://calendy.app',
];

export const linking = {
  prefixes,
  config: {
    initialRouteName: '(tabs)',
    screens: {
      '(tabs)': {
        path: '',
        screens: {
          calendar: 'calendar',
          upcoming: 'upcoming',
          profile: 'profile',
        },
      },
      '(auth)': {
        screens: {
          signIn: 'sign-in',
          signUp: 'sign-up',
        },
      },
      '(onboarding)': 'onboarding',
      'email-confirm': 'email-confirm',
    },
  },
  // Handle deep links
  async getInitialURL() {
    // First, check for any pending deep links
    const url = await Linking.getInitialURL();
    if (url) {
      // Handle Supabase auth callbacks
      if (url.includes('access_token') || url.includes('refresh_token')) {
        return `calendy://auth/callback${url.split('?')[1] ? '?' + url.split('?')[1] : ''}`;
      }
      return url;
    }

    // If no deep link, check for Supabase session
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', data.session.user.id)
        .single();

      if (profile && !profile.onboarded) {
        return 'calendy://onboarding';
      }
      return 'calendy://';
    }
    return 'calendy://sign-in';
  },
  // Handle deep link subscriptions
  subscribe(listener: (url: string) => void) {
    const onReceiveURL = ({ url }: { url: string }) => {
      console.log('Received URL:', url);
      
      // Handle Supabase auth callbacks
      if (url.includes('access_token') || url.includes('refresh_token') || url.includes('type=')) {
        // If it's a direct auth callback (e.g., from email)
        if (url.startsWith('calendy://auth/callback')) {
          // Process the auth callback
          const params = new URLSearchParams(url.split('?')[1]);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');
          const error = params.get('error');

          if (error) {
            console.error('Auth error:', error, params.get('error_description'));
            // Redirect to sign-in with error message
            router.replace({
              pathname: '/(auth)/sign-in',
              params: { 
                message: 'Authentication failed. Please try again.',
                messageType: 'error'
              },
            });
            return;
          }

          if (accessToken && refreshToken) {
            // Set the session
            supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            }).then(({ data, error }) => {
              if (error) {
                console.error('Error setting session:', error);
                router.replace({
                  pathname: '/(auth)/sign-in',
                  params: { 
                    message: 'Session error. Please sign in again.',
                    messageType: 'error'
                  },
                });
                return;
              }

              if (type === 'signup' || type === 'signin') {
                // Check if user needs to complete onboarding
                supabase.from('profiles')
                  .select('onboarded')
                  .eq('id', data.session?.user.id)
                  .single()
                  .then(({ data: profile, error: profileError }) => {
                    if (profileError || !profile?.onboarded) {
                      router.replace('/(onboarding)/onboarding');
                    } else {
                      router.replace('/(tabs)');
                    }
                  });
              } else if (type === 'recovery') {
                router.replace({
                  pathname: '/(auth)/sign-in',
                  params: { 
                    message: 'Please sign in with your new password',
                    messageType: 'success'
                  },
                });
              }
            });
            return;
          }
        }
      }
      
      // Default deep link handling
      listener(url);
    };

    // Listen to incoming links from deep linking
    const subscription = Linking.addEventListener('url', onReceiveURL);

    return () => {
      subscription.remove();
    };
  },
};
