'use client';
import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [scans, setScans] = useState([]);
  const [itemCode, setItemCode] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');
  const [scanningFor, setScanningFor] = useState(null); // 'item' | 'unique' | null
  const scannerRef = useRef(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('scans');
    if (saved) setScans(JSON.parse(saved));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('scans', JSON.stringify(scans));
  }, [scans]);

  // Scanner start
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
      <h1>📷 কোড স্ক্যানার</h1>
      <p className="sub">আইটেম কোড + ইউনিক কোড স্ক্যান করো, তারপর এক্সপোর্ট করো</p>

      <div className="card">
        <label>১. আইটেম কোড</label>
        <div className="row">
          <input value={itemCode} onChange={(e) => setItemCode(e.target.value)} placeholder="আইটেম কোড লিখো বা স্ক্যান করো" />
          <button className="btn blue" onClick={() => setScanningFor('item')}>স্ক্যান</button>
        </div>

        <label>২. ইউনিক কোড</label>
        <div className="row">
          <input value={uniqueCode} onChange={(e) => setUniqueCode(e.target.value)} placeholder="ইউনিক কোড লিখো বা স্ক্যান করো" />
          <button className="btn blue" onClick={() => setScanningFor('unique')}>স্ক্যান</button>
        </div>

        {scanningFor && (
          <div className="scanner-box">
            <p>ক্যামেরার সামনে কোড ধরো... ({scanningFor === 'item' ? 'আইটেম কোড' : 'ইউনিক কোড'})</p>
            <div id="reader"></div>
            <button className="btn gray" onClick={() => setScanningFor(null)}>বন্ধ করো</button>
          </div>
        )}

        <button className="btn green big" onClick={addPair}>+ সেভ করো</button>
      </div>

      <div className="top-bar">
        <h3>স্ক্যান লিস্ট ({scans.length} টা)</h3>
        <div>
          <button className="btn green" onClick={exportCSV}>⬇ Export CSV</button>
          <button className="btn red" onClick={clearAll}>Clear All</button>
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