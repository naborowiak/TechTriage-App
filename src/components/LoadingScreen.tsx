interface LoadingScreenProps {
  message?: string;
  size?: 'sm' | 'lg';
}

function HexBrick() {
  return (
    <>
      <div className="hex-brick h1" />
      <div className="hex-brick h2" />
      <div className="hex-brick h3" />
    </>
  );
}

/** Standalone hex honeycomb animation — use inside custom wrappers */
export function HexLoader({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  return (
    <div className={`hex-socket ${size === 'sm' ? 'hex-socket-sm' : ''}`} aria-hidden="true">
      <div className="gel center-gel"><HexBrick /></div>
      {/* Ring 1 */}
      <div className="gel c1 r1"><HexBrick /></div>
      <div className="gel c2 r1"><HexBrick /></div>
      <div className="gel c3 r1"><HexBrick /></div>
      <div className="gel c4 r1"><HexBrick /></div>
      <div className="gel c5 r1"><HexBrick /></div>
      <div className="gel c6 r1"><HexBrick /></div>
      {/* Ring 2 */}
      <div className="gel c7 r2"><HexBrick /></div>
      <div className="gel c8 r2"><HexBrick /></div>
      <div className="gel c9 r2"><HexBrick /></div>
      <div className="gel c10 r2"><HexBrick /></div>
      <div className="gel c11 r2"><HexBrick /></div>
      <div className="gel c12 r2"><HexBrick /></div>
      <div className="gel c13 r2"><HexBrick /></div>
      <div className="gel c14 r2"><HexBrick /></div>
      <div className="gel c15 r2"><HexBrick /></div>
      <div className="gel c16 r2"><HexBrick /></div>
      <div className="gel c17 r2"><HexBrick /></div>
      <div className="gel c18 r2"><HexBrick /></div>
      {/* Ring 3 */}
      <div className="gel c19 r3"><HexBrick /></div>
      <div className="gel c20 r3"><HexBrick /></div>
      <div className="gel c21 r3"><HexBrick /></div>
      <div className="gel c22 r3"><HexBrick /></div>
      <div className="gel c23 r3"><HexBrick /></div>
      <div className="gel c24 r3"><HexBrick /></div>
      <div className="gel c25 r3"><HexBrick /></div>
      <div className="gel c26 r3"><HexBrick /></div>
      <div className="gel c28 r3"><HexBrick /></div>
      <div className="gel c29 r3"><HexBrick /></div>
      <div className="gel c30 r3"><HexBrick /></div>
      <div className="gel c31 r3"><HexBrick /></div>
      <div className="gel c32 r3"><HexBrick /></div>
      <div className="gel c33 r3"><HexBrick /></div>
      <div className="gel c34 r3"><HexBrick /></div>
      <div className="gel c35 r3"><HexBrick /></div>
      <div className="gel c36 r3"><HexBrick /></div>
      <div className="gel c37 r3"><HexBrick /></div>
    </div>
  );
}

/** Full loading screen — use as a page/panel placeholder */
export function LoadingScreen({ message, size = 'lg' }: LoadingScreenProps) {
  const isSmall = size === 'sm';
  return (
    <div
      className={`flex flex-col items-center justify-center transition-colors ${
        isSmall ? 'py-8' : 'min-h-screen bg-light-100 dark:bg-midnight-950'
      }`}
      role="status"
    >
      <HexLoader size={size} />
      {message && (
        <p className={`${isSmall ? 'mt-2 text-sm' : 'mt-8'} text-text-secondary dark:text-gray-400 font-medium`}>
          {message}
        </p>
      )}
    </div>
  );
}
