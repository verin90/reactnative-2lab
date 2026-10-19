
export interface CalculationHistory {
    id: number;
    x: number;
    y: number;
    r: number;
    phi_rad: number;
    phi_deg: number;
    created_at: string;
}


export interface PolarResponse {
    id: number;
    x: number;
    y: number;
    r: number;
    phi_rad: number;
    phi_deg: number;
    created_at: string;
}

export interface Coordinates {
    x: string;
    y: string;
}

export type AngleUnit = 'degrees' | 'radians';
