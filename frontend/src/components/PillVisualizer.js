import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export const PillVisualizer = ({ form = 'pill', color = '#3B82F6', size = 36 }) => {
  const getIcon = () => {
    switch (form?.toLowerCase()) {
      case 'capsule':
        return <MaterialCommunityIcons name="pill" size={size} color={color} />;
      case 'syrup':
      case 'liquid':
        return <FontAwesome5 name="prescription-bottle-alt" size={size} color={color} />;
      case 'inhaler':
        return <MaterialCommunityIcons name="spray" size={size} color={color} />;
      case 'injection':
        return <FontAwesome5 name="syringe" size={size} color={color} />;
      case 'drops':
        return <Ionicons name="water" size={size} color={color} />;
      case 'patch':
        return <MaterialCommunityIcons name="bandage" size={size} color={color} />;
      case 'pill':
      default:
        return <MaterialCommunityIcons name="checkbox-blank-circle" size={size} color={color} />;
    }
  };

  return (
    <View style={[styles.container, { width: size + 16, height: size + 16, backgroundColor: `${color}15`, borderColor: color }]}>
      {getIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default PillVisualizer;
