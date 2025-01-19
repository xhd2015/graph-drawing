

export enum ValueType {
    Percent = "percent",
    Seconds = "seconds",
    Bytes = "bytes",
    BytesPerSecond = "bytesPerSecond",
    Rate = "rate",
    Number = "number",
}

export function formatValue(value: number, valType: ValueType): string {
    switch (valType) {
        case ValueType.Percent:
            return `${(value * 100).toFixed(2)}%`;
        case ValueType.Seconds:
            return formatSeconds(value);
        case ValueType.Bytes:
            return formatBytes(value);
        case ValueType.BytesPerSecond:
            return formatBytes(value) + "/s";
        case ValueType.Rate:
            return `${value.toFixed(2)}/s`;
        case ValueType.Number:
            return `${value.toFixed(2)}`;
    }
}

export function formatBytes(value: number): string {
    if (value < 1024) {
        return `${value}B`;
    }
    if (value < 1024 * 1024) {
        return `${(value / 1024).toFixed(2)}KB`;
    }
    if (value < 1024 * 1024 * 1024) {
        return `${(value / 1024 / 1024).toFixed(2)}MB`;
    }
    if (value < 1024 * 1024 * 1024 * 1024) {
        return `${(value / 1024 / 1024 / 1024).toFixed(2)}GB`;
    }
    return `${(value / 1024 / 1024 / 1024 / 1024).toFixed(2)}TB`;
}

export function formatChange(value: number, valType: ValueType): string {
    let sign = "+"
    if (value < 0) {
        sign = "-"
        value = -value
    }
    return `${sign}${formatValue(value, valType)}`;
}

export function formatSeconds(value: number): string {
    if (isNaN(value)) {
        return "NaN"
    }
    if (value >= 60 * 60 * 24) {
        return `${(value / 60 / 60 / 24).toFixed(1)}d`;
    }
    if (value >= 60 * 60) {
        return `${(value / 60 / 60).toFixed(1)}h`;
    }
    if (value >= 60) {
        return `${(value / 60).toFixed(1)}m`;
    }
    if (value >= 1) {
        return `${value.toFixed(1)}s`;
    }
    if (value >= 0.001) {
        return `${(value * 1000).toFixed(0)}ms`;
    }
    return `${(value * 1000000).toFixed(0)}µs`;
}