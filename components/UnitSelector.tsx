import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AngleUnit } from '../types';

interface UnitSelectorProps {
    unit: AngleUnit;
    onUnitChange: (unit: AngleUnit) => void;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({ unit, onUnitChange }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Единицы измерения угла:</Text>
            <View style={styles.buttonGroup}>
                <TouchableOpacity
                    style={[styles.button, unit === 'degrees' && styles.activeButton]}
                    onPress={() => onUnitChange('degrees')}
                >
                    <Text style={[styles.buttonText, unit === 'degrees' && styles.activeButtonText]}>
                        Градусы
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, unit === 'radians' && styles.activeButton]}
                    onPress={() => onUnitChange('radians')}
                >
                    <Text style={[styles.buttonText, unit === 'radians' && styles.activeButtonText]}>
                        Радианы
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 25,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 10,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    activeButton: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    activeButtonText: {
        color: '#fff',
    },
});