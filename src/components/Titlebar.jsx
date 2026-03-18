export default function Titlebar() {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 44,
                background: 'rgba(28,28,30,0.92)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                zIndex: 100,
                WebkitAppRegion: 'drag',
                userSelect: 'none',
            }}
        >
            <div
                style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text2)',
                    letterSpacing: '-0.01em',
                }}
            >
                iMessage Command Center
            </div>

            {/* Spacer to balance traffic lights */}
            <div style={{ width: 50 }} />
        </div>
    );
}
