export default function LabLoader({ label }: { label: string }) {
  return (
    <div className="lab-loader" role="status" aria-live="polite">
      <div className="lab-loader__hud" aria-hidden="true">
        <span className="lab-loader__ring" />
        <span className="lab-loader__core" />
      </div>
      <p className="lab-loader__title">{label}</p>
      <div className="lab-loader__bar" aria-hidden="true"><span /></div>
    </div>
  );
}
