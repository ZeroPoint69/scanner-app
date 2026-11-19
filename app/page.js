'use client';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [scans, setScans] = useState([]);
  const [itemCode, setItemCode] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');
  const [scanningFor, setScanningFor] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('scans');
    if (saved) setScans(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('scans', JSON.stringify(scans));
  }, [scans]);

  useEffect(() => {
    if (!scanningFor) return;
    let cancelled = false;

    async function start() {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      if (cancelled) return;
      const scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current = scanner;
      scanner.render(
        (decodedText) => {
          if (scanningFor === 'item') setItemCode(decodedText);
          else setUniqueCode(decodedText);
          scanner.clear().then(() => setScanningFor(null)).catch(() => setScanningFor(null));
        },
        () => {}
      );
    }
    start();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scanningFor]);

  const addPair = () => {
    if (!itemCode || !uniqueCode) {
      alert('দুটো কোডই লাগবে!');
      return;
    }
    const newRow = {
      itemCode,
      uniqueCode,
      time: new Date().toLocaleString('en-GB'),
    };
    setScans([newRow, ...scans]);
    setItemCode('');
    setUniqueCode('');
  };

  const deleteOne = (index) => {
    setScans(scans.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    if (confirm('সব ডিলিট করবে?')) setScans([]);
  };

  const exportCSV = () => {
    if (scans.length === 0) {
      alert('এক্সপোর্ট করার মতো কিছু নাই');
      return;
    }
    const header = 'Item Code,Unique Code,Time\n';
    const rows = scans.map(s => `"${s.itemCode}","${s.uniqueCode}","${s.time}"`).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container">
      {/* ক্যামেরা এখন উপরের দিক থেকে খুলবে */}
      {scanningFor && (
        <div className="scanner-top">
          <div className="scanner-top-head">
            <span>📷 {scanningFor === 'item' ? 'আইটেম কোড স্ক্যান করো' : 'ইউনিক কোড স্ক্যান করো'}</span>
            <button className="close-btn" onClick={() => setScanningFor(null)}>✕</button>
          </div>
          <div id="reader"></div>
          <p className="scanner-hint">কোডটা ক্যামেরার সামনে ধরো</p>
        </div>
      )}

      <h1>📷 কোড স্ক্যানার</h1>
      <p className="sub">আইটেম কোড + ইউনিক কোড স্ক্যান করো, তারপর এক্সপোর্ট করো</p>

      <div className="card">
        <div className="inputs-row">
          <div className="field">
            <label>আইটেম কোড</label>
            <div className="input-wrap">
              <span className="icon-left">🏷️</span>
              <input
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                placeholder="আইটেম কোড"
              />
              <button className="icon-btn" onClick={() => setScanningFor('item')} title="স্ক্যান">
                📷
              </button>
            </div>
          </div>

          <div className="field">
            <label>ইউনিক কোড</label>
            <div className="input-wrap">
              <span className="icon-left">🔖</span>
              <input
                value={uniqueCode}
                onChange={(e) => setUniqueCode(e.target.value)}
                placeholder="ইউনিক কোড"
              />
              <button className="icon-btn" onClick={() => setScanningFor('unique')} title="স্ক্যান">
                📷
              </button>
            </div>
          </div>
        </div>

        <button className="btn green big" onClick={addPair}>+ সেভ করো</button>
      </div>

      <div className="top-bar">
        <h3>স্ক্যান লিস্ট ({scans.length} টা)</h3>
        <div>
          <button className="btn green" onClick={exportCSV}>⬇ Export CSV</button>
          <button className="btn red" onClick={clearAll}>Clear</button>
        </div>
      </div>

      <table>
        <thead>
          <tr><th>#</th><th>Item Code</th><th>Unique Code</th><th>Time</th><th></th></tr>
        </thead>
        <tbody>
          {scans.length === 0 && (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>এখনো কিছু স্ক্যান হয়নি</td></tr>
          )}
          {scans.map((s, i) => (
            <tr key={i}>
              <td>{scans.length - i}</td>
              <td><b>{s.itemCode}</b></td>
              <td>{s.uniqueCode}</td>
              <td>{s.time}</td>
              <td><button onClick={() => deleteOne(i)}>❌</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}