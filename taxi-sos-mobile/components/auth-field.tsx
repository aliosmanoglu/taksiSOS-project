import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../app/index.styles';

type AuthFieldProps = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  rightIcon?: React.ComponentProps<typeof MaterialIcons>['name'];
  onRightIconPress?: () => void;
} & React.ComponentProps<typeof TextInput>;

export function AuthField({ icon, rightIcon, onRightIconPress, style, ...inputProps }: AuthFieldProps) {
  return (
    <View style={styles.authFieldWrap}>
      <MaterialIcons name={icon} size={16} color="#888" style={styles.authFieldIconLeft} />
      <TextInput
        style={[styles.input, { paddingLeft: 42, paddingRight: rightIcon ? 40 : 16 }, style]}
        placeholderTextColor="#999"
        {...inputProps}
      />
      {rightIcon ? (
        <TouchableOpacity onPress={onRightIconPress} style={styles.authFieldIconRight}>
          <MaterialIcons name={rightIcon} size={20} color="#999" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
