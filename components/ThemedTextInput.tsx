import { TextInput as RNTextInput, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { forwardRef } from "react";

type ThemedTextInputProps = React.ComponentProps<typeof RNTextInput> & {
  style?: any;
};

export const ThemedTextInput = forwardRef<RNTextInput, ThemedTextInputProps>(
  ({ style, ...props }, ref) => {
    const { colors } = useTheme();

    return (
      <RNTextInput
        ref={ref}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.card },
          style,
        ]}
        placeholderTextColor={colors.secondary}
        {...props}
      />
    );
  }
);

ThemedTextInput.displayName = "ThemedTextInput";

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    borderRadius: 8,
    padding: 12,
  },
});
