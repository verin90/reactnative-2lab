import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Coordinates, CalculationHistory, PolarResponse, AngleUnit } from "./types";
import { InputField } from "./components/InputField";
import { HistoryItem } from "./components/HistoryItem";
import { UnitSelector } from "./components/UnitSelector";
import { formatAngle, API_URL } from "./config";

export default function App() {
    const [coordinates, setCoordinates] = useState<Coordinates>({ x: '', y: '' });
    const [angleUnit, setAngleUnit] = useState<AngleUnit>('degrees');
    const [result, setResult] = useState<PolarResponse | null>(null);
    const [history, setHistory] = useState<CalculationHistory[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    // GET /api/history -> последние 50 вычислений
    const loadHistory = useCallback(async (): Promise<void> => {
        setIsLoadingHistory(true);
        try {
            const response = await fetch(`${API_URL}/api/history`);
            if (!response.ok) throw new Error(`Сервер ответил ${response.status}`);
            const data: CalculationHistory[] = await response.json();
            setHistory(data);
        } catch (error) {
            console.error('Не удалось загрузить историю:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const calculatePolar = async (): Promise<void> => {
        const x = parseFloat(coordinates.x.replace(',', '.'));
        const y = parseFloat(coordinates.y.replace(',', '.'));

        if (isNaN(x) || isNaN(y)) {
            Alert.alert('Ошибка', 'Введите корректные значения x и y');
            return;
        }

        setIsCalculating(true);
        try {
            const response = await fetch(`${API_URL}/api/polar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Сервер ответил ${response.status}`);
            }
            const data: PolarResponse = await response.json();
            setResult(data);
            await loadHistory();
        } catch (error) {
            Alert.alert(
                'Ошибка',
                (error as Error).message +
                `\n\nПроверь, что сервер запущен (npm start в папке api) и правильный API_URL в config.ts (${API_URL})`
            );
        } finally {
            setIsCalculating(false);
        }
    };

    const clearHistory = async (): Promise<void> => {
        try {
            const response = await fetch(`${API_URL}/api/history`, { method: 'DELETE' });
            if (!response.ok) throw new Error(`Сервер ответил ${response.status}`);
            setHistory([]);
        } catch (error) {
            Alert.alert('Ошибка', (error as Error).message);
        }
    };

    const clearInputs = (): void => {
        setCoordinates({ x: '', y: '' });
        setResult(null);
    };

    const handleCoordinateChange = (key: keyof Coordinates, value: string) => {
        setCoordinates(prev => ({ ...prev, [key]: value }));
    };

    const phiText = useMemo(() => {
        if (result === null) return '';
        return angleUnit === 'degrees'
            ? formatAngle(result.phi_deg, 'degrees')
            : formatAngle(result.phi_rad, 'radians');
    }, [result, angleUnit]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Преобразование координат</Text>

                <View style={styles.formulaSection}>
                    <Text style={styles.formulaLabel}>Формулы преобразования:</Text>
                    <Text style={styles.formulaText}>ρ = √(x² + y²)</Text>
                    <Text style={styles.formulaText}>φ = arctg(y/x)</Text>
                </View>

                <View style={styles.inputSection}>
                    <Text style={styles.sectionTitle}>Декартовы координаты (x, y)</Text>
                    <View style={styles.inputGroup}>
                        <InputField
                            placeholderText="Введите значение x"
                            value={coordinates.x}
                            label="Координата X"
                            onChangeText={(text) => handleCoordinateChange('x', text)}
                        />
                        <InputField
                            placeholderText="Введите значение y"
                            value={coordinates.y}
                            label="Координата Y"
                            onChangeText={(text) => handleCoordinateChange('y', text)}
                        />
                    </View>
                </View>

                <UnitSelector unit={angleUnit} onUnitChange={setAngleUnit} />

                <View style={styles.buttonGroup}>
                    <TouchableOpacity
                        style={styles.calculateButton}
                        onPress={calculatePolar}
                        disabled={isCalculating}
                    >
                        {isCalculating
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.calculateButtonText}>Рассчитать</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.clearButton} onPress={clearInputs}>
                        <Text style={styles.clearButtonText}>Очистить</Text>
                    </TouchableOpacity>
                </View>

                {result !== null && (
                    <View style={styles.resultSection}>
                        <Text style={styles.resultTitle}>Результат:</Text>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Полярный радиус (ρ):</Text>
                            <Text style={styles.resultValue}>{result.r.toFixed(4)}</Text>
                        </View>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Полярный угол (φ):</Text>
                            <Text style={styles.resultValue}>{phiText}</Text>
                        </View>
                    </View>
                )}

                {/* История: loading / empty / list */}
                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.sectionTitle}>История преобразований</Text>
                        {history.length > 0 && (
                            <TouchableOpacity onPress={clearHistory}>
                                <Text style={styles.clearHistoryText}>Очистить</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isLoadingHistory ? (
                        <ActivityIndicator color="#007AFF" />
                    ) : history.length === 0 ? (
                        <Text style={styles.emptyText}>Пока нет вычислений</Text>
                    ) : (
                        history.map((item) => (
                            <HistoryItem item={item} unit={angleUnit} key={item.id} />
                        ))
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    scrollView: { flex: 1, padding: 20, paddingTop: 60 },
    title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 30, color: '#333' },
    sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 15, color: '#444' },
    formulaSection: {
        backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 25,
        borderLeftWidth: 4, borderLeftColor: "#FF9500",
    },
    formulaLabel: { fontSize: 14, fontWeight: "600", color: '#666', marginBottom: 5 },
    formulaText: { fontSize: 16, fontWeight: "600", color: '#FF9500', fontStyle: 'italic', marginBottom: 3 },
    inputSection: { marginBottom: 25 },
    inputGroup: { gap: 5 },
    buttonGroup: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    calculateButton: {
        flex: 2, backgroundColor: '#007AFF', padding: 18, borderRadius: 10,
        alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
    },
    calculateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    clearButton: {
        flex: 1, backgroundColor: '#ff3b30', padding: 18, borderRadius: 10,
        alignItems: 'center', shadowColor: '#ff3b30', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
    },
    clearButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    resultSection: {
        backgroundColor: '#fff', padding: 20, borderRadius: 10, borderLeftWidth: 4,
        borderLeftColor: '#34C759', marginBottom: 25,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1,
        shadowRadius: 3, elevation: 3,
    },
    resultTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15, color: '#666' },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    resultLabel: { fontSize: 16, color: '#666' },
    resultValue: { fontSize: 18, fontWeight: 'bold', color: '#34C759' },
    historySection: { marginBottom: 25 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    clearHistoryText: { color: '#ff3b30', fontSize: 14, fontWeight: '500' },
    emptyText: { textAlign: 'center', color: '#999', fontSize: 14, paddingVertical: 20 },
});