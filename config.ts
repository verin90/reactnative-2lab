import { Platform } from 'react-native';
import { AngleUnit } from './types';

const DEFAULT_HOST =
    Platform.OS === 'android' ? '192.168.0.108' : 'localhost';

export const API_URL =
    process.env.EXPO_PUBLIC_API_URL ?? `http://${DEFAULT_HOST}:3001`;

export const angleUnits: { value: AngleUnit; label: string }[] = [
    { value: 'degrees', label: 'Градусы' },
    { value: 'radians', label: 'Радианы' },
];

export const formatAngle = (value: number, unit: AngleUnit): string => {
    if (unit === 'degrees') {
        return `${value.toFixed(2)}°`;
    }
    return `${value.toFixed(4)} рад`;
};

export const formatDate = (iso: string): string => {
    try {
        return new Date(iso).toLocaleString('ru-RU');
    } catch {
        return iso;
    }
};
