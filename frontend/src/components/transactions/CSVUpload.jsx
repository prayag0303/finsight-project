import { useState, useRef } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useUploadCSV } from '../../hooks/useTransactions';

export default function CSVUpload({ onClose }) {
  const [file,     setFile]     = useState(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const { mutate: upload, isPending } = useUploadCSV();

  const handleFile = (f) => {
    if (f && f.name.endsWith('.csv')) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = () => {
    if (!file) return;
    setProgress(0);
    upload(
      { file, onProgress: setProgress },
      { onSuccess: onClose, onError: () => setProgress(0) }
    );
  };

  return (
    <Modal isOpen title="Import CSV Transactions" onClose={onClose}>
      <div className="space-y-4">
        <p style={{ fontSize: 12, color: '#aaa' }}>Supported banks: HDFC, SBI, ICICI, Axis, Kotak. AI will auto-categorize all transactions.</p>

        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          style={{
            border: `2px dashed ${dragOver ? '#7c3aed' : '#e0e0e0'}`,
            borderRadius: 12,
            padding: '36px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? '#f8f5ff' : '#fafafa',
            transition: 'all 0.15s',
          }}
        >
          <p style={{ fontSize: 28, marginBottom: 10 }}>📄</p>
          {file ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{file.name}</p>
              <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB</p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>Drop your CSV file here</p>
              <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>or click to browse</p>
            </>
          )}
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        </div>

        {isPending && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#777' }}>
              <span>Uploading & categorizing...</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#111', borderRadius: 99, transition: 'width 0.3s', width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={!file} loading={isPending}>
            Import Transactions
          </Button>
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
