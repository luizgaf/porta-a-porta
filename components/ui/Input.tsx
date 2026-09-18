'use client';

import { TextInput, View, Text, StyleSheet, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import { ReactNode } from 'react';
import { Controller, ControllerProps, FieldPath, FieldValues } from 'react-hook-form';

interface InputProps<T extends FieldValues> extends Omit<ControllerProps<T>, 'name' | 'control' | 'render'> {
  name: FieldPath<T>;
  control: ControllerProps<T>['control'];
  label?: string;
  placeholder?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

export function Input<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  error,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  keyboardType = 'default',
  style,
  inputStyle,
  labelStyle,
  multiline = false,
  numberOfLines,
  rules,
  ...props
}: InputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const hasError = fieldState.error || error;
        return (
          <View style={[styles.container, style]}>
            {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
            <View style={[styles.inputWrapper, hasError && styles.inputError]}>
              {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
              <TextInput
                {...props}
                value={field.value ?? ''}
                onChangeText={(value) => field.onChange(value)}
                onBlur={field.onBlur}
                placeholder={placeholder}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={numberOfLines}
                style={[
                  styles.input,
                  multiline && styles.inputMultiline,
                  inputStyle,
                ]}
                placeholderTextColor="#8E8E93"
              />
              {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
            </View>
            {hasError && <Text style={styles.errorText}>{fieldState.error?.message || error}</Text>}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1D1D1F',
    paddingVertical: 14,
  },
  inputMultiline: {
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  iconLeft: {
    marginRight: 12,
  },
  iconRight: {
    marginLeft: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
  },
});