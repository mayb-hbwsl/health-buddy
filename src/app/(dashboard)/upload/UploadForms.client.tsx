"use client";

import React, { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import styles from './upload.module.css';
import { saveHealthEntry } from '@/app/actions/user';

const UploadForms: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSuccess(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await saveHealthEntry(formData);
    
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      form.reset();
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handleFileUpload = () => {
    if (!file) return;
    setUploading(true);
    // Simulate OCR analysis for a second
    setTimeout(() => {
      setUploading(false);
      setSuccess(true);
      setFile(null);
      setTimeout(() => setSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className={styles.grid}>
      <div>
        <Card title="New Entry">
          {error && <p style={{color: '#ff4757', fontSize: '0.8rem', marginBottom: '8px'}}>{error}</p>}
          <form onSubmit={handleManualSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Report Type</label>
              <select name="type" className={styles.select}>
                <option>Blood Sugar (Fasting)</option>
                <option>Blood Sugar (Post-Prandial)</option>
                <option>HbA1c</option>
                <option>Weight</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Value</label>
              <input name="value" type="text" className={styles.input} placeholder="e.g. 110" required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Date</label>
              <input name="date" type="date" className={styles.input} defaultValue={new Date().toISOString().split('T')[0]} />
            </div>

            <Button type="submit" variant="primary" fullWidth style={{ marginTop: '20px' }}>
              Save Manual Entry
            </Button>
          </form>
        </Card>
      </div>

      <div>
        <Card title="Upload Document">
          <label className={styles.dragDropArea}>
            <input 
              type="file" 
              hidden 
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <div className={styles.uploadIcon}>📄</div>
            <p style={{ color: '#fff', fontWeight: 600 }}>Click to browse or drag & drop</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>
              PDF, JPG, PNG (Max 5MB)
            </p>
          </label>

          {file && (
            <div className={styles.previewCard}>
              <span>✅ {file.name}</span>
            </div>
          )}

          {success && (
            <div className={styles.previewCard} style={{ background: 'var(--success-light)', border: '1px solid var(--success)' }}>
              <span>🎉 Entry saved successfully!</span>
            </div>
          )}

          <Button 
            variant="secondary" 
            fullWidth 
            style={{ marginTop: '24px' }}
            disabled={!file || uploading}
            onClick={handleFileUpload}
          >
            {uploading ? 'Analyzing...' : 'Upload & Analyze (AI)'}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default UploadForms;
