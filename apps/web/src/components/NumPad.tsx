interface NumPadProps {
    value: string;
    maxLength: number;
    onChange: (value: string) => void;
    onSubmit: () => void;
    disabled?: boolean;
    submitLabel?: string;
}

export function NumPad({ value, maxLength, onChange, onSubmit, disabled }: NumPadProps) {
    const usedDigits = new Set(value.split(''));

    const handleDigit = (d: string) => {
        if (value.length >= maxLength) return;
        // First digit can't be 0
        if (value.length === 0 && d === '0') return;
        // No repeated digits
        if (usedDigits.has(d)) return;
        onChange(value + d);
    };

    const handleDelete = () => {
        onChange(value.slice(0, -1));
    };

    const canSubmit = value.length === maxLength && !disabled;

    return (
        <div className="numpad">
            <div className="numpad__display">
                {Array.from({ length: maxLength }).map((_, i) => (
                    <span key={i} className={`numpad__digit ${value[i] ? 'numpad__digit--filled' : ''}`}>
                        {value[i] || '·'}
                    </span>
                ))}
            </div>
            <div className="numpad__keys">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => {
                    const isUsed = usedDigits.has(d);
                    return (
                        <button
                            key={d}
                            className={`numpad__key ${isUsed ? 'numpad__key--used' : ''}`}
                            onClick={() => handleDigit(d)}
                            disabled={isUsed || value.length >= maxLength}
                        >
                            {d}
                        </button>
                    );
                })}
                <button
                    className="numpad__key numpad__key--action"
                    onClick={handleDelete}
                    disabled={value.length === 0}
                >
                    ⌫
                </button>
                <button
                    className={`numpad__key ${usedDigits.has('0') ? 'numpad__key--used' : ''}`}
                    onClick={() => handleDigit('0')}
                    disabled={usedDigits.has('0') || value.length >= maxLength || value.length === 0}
                >
                    0
                </button>
                <button
                    className={`numpad__key numpad__key--submit ${canSubmit ? 'numpad__key--ready' : ''}`}
                    onClick={onSubmit}
                    disabled={!canSubmit}
                >
                    ✓
                </button>
            </div>
        </div>
    );
}
