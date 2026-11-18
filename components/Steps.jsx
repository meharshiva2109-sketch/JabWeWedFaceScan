import { ChevronRight, Download, ScanFace, Scan } from 'lucide-react';

export function Steps() {
  const items = [
    { icon: Scan, label: 'Scan QR Code' },
    { icon: ScanFace, label: 'Scan Your Face' },
    { icon: Download, label: 'Download Your Photos' },
  ];
  return (
    <ol className="steps" aria-label="How it works" style={{ listStyle: 'none', padding: 0 }}>
      {items.map((item, i) => (
        <li key={item.label} style={{ display: 'contents' }}>
          <div className="step">
            <span className="step-icon"><item.icon aria-hidden="true" /></span>
            <span className="step-label"><span className="visually-hidden">Step {i + 1}: </span>{item.label}</span>
          </div>
          {i < items.length - 1 && <span className="step-arrow" aria-hidden="true"><ChevronRight /></span>}
        </li>
      ))}
    </ol>
  );
}
