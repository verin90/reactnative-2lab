import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CalculationHistory, AngleUnit } from '../types';
import { formatAngle, formatDate } from '../config';

interface HistoryItemProps {
    item: CalculationHistory;
    unit: AngleUnit;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ item, unit }) => {
    const phiText = unit === 'degrees'
        ? formatAngle(item.phi_deg, 'degrees')
        : formatAngle(item.phi_rad, 'radians');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    ({item.x}, {item.y}) → ({item.r.toFixed(4)}, {phiText})
                </Text>
                <Text style={styles.time}>{formatDate(item.created_at)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    time: {
        fontSize: 12,
        color: '#999',
        marginLeft: 10,
    },
});