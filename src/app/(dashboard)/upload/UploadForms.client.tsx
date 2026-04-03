"use client";

import React, { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import styles from './upload.module.css';
import { saveHealthEntry } from '@/app/actions/user';
import { analyzeDocument } from '@/app/actions/vision';
import { useRouter } from 'next/navigation';

interface ExtractedData {
  type: string;
  value: string;
  date: string;
}

const UploadForms: React.FC = () => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // States for Review & Confirm flow
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSuccess(false);
      setStep('upload');
      setExtractedData(null);
      setError('');
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
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  // Real Vision AI calling
  const handleFileUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await analyzeDocument(formData);
    
    setUploading(false);
    
    if (res?.error) {
      setError(res.error);
    } else if (res.success && res.data) {
      // Mapping common laboratory terms to our system types
      let normalizedType = res.data.type;
      const lowerType = normalizedType.toLowerCase();
      
      if (lowerType.includes("sugar") || lowerType.includes("glucose")) {
        if (lowerType.includes("fasting")) normalizedType = "Blood Sugar (Fasting)";
        else if (lowerType.includes("pp") || lowerType.includes("post")) normalizedType = "Blood Sugar (Post-Prandial)";
        else normalizedType = "Blood Sugar (Fasting)";
      } else if (lowerType.includes("hba")) {
        normalizedType = "HbA1c";
      } else if (lowerType.includes("weight")) {
        normalizedType = "Weight";
      }

      setExtractedData({
        type: normalizedType,
        value: res.data.value,
        date: res.data.date
      });
      setStep('review');
    }
  };

  const handleConfirmSave = async () => {
    if (!extractedData) return;
    
    const formData = new FormData();
    formData.append('type', extractedData.type);
    formData.append('value', extractedData.value);
    formData.append('date', extractedData.date);
    
    const res = await saveHealthEntry(formData);
    
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setStep('upload');
      setFile(null);
      setExtractedData(null);
      router.refresh(); 
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className={styles.grid}>
      <div>
        <Card title="New Entry">
          {error && <div style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px'}}>{error}</div>}
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
          {error && step === 'upload' && <div style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px'}}>{error}</div>}
          {step === 'upload' ? (
            <>
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
                  Laboratory Reports (PDF, JPG, PNG)
                </p>
              </label>

              {file && (
                <div className={styles.previewCard}>
                  {uploading && <div className={styles.scanningLaser} />}
                  <span>✅ {file.name}</span>
                </div>
              )}

              {success && (
                <div className={styles.previewCard} style={{ background: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--success)' }}>
                  <span>🎉 Health data synced successfully!</span>
                </div>
              )}

              <Button 
                variant="secondary" 
                fullWidth 
                style={{ marginTop: '24px' }}
                disabled={!file || uploading}
                onClick={handleFileUpload}
              >
                {uploading ? 'Analyzing Clinical Data...' : 'Upload & Analyze (AI)'}
              </Button>
            </>
          ) : (
            <div className={styles.reviewCard}>
              <div className={styles.reviewTitle}>
                <span>🤖 AI CLINICAL PREVIEW</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Please verify the extracted metrics and date before confirming.
              </p>
              <div className={styles.reviewForm}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Metric Detected</label>
                  <select 
                    className={styles.select}
                    value={extractedData?.type}
                    onChange={(e) => setExtractedData({...extractedData!, type: e.target.value})}
                  >
                    <option>Blood Sugar (Fasting)</option>
                    <option>Blood Sugar (Post-Prandial)</option>
                    <option>HbA1c</option>
                    <option>Weight</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Observed Value</label>
                  <input 
                    type="text" 
                    className={styles.input}
                    value={extractedData?.value}
                    onChange={(e) => setExtractedData({...extractedData!, value: e.target.value})}
                    placeholder="e.g. 115"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Collection Date</label>
                  <input 
                    type="date" 
                    className={styles.input}
                    value={extractedData?.date}
                    onChange={(e) => setExtractedData({...extractedData!, date: e.target.value})}
                  />
                </div>
              </div>
              <div className={styles.reviewActions}>
                <Button variant="secondary" onClick={() => setStep('upload')} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleConfirmSave} style={{ flex: 2 }}>
                  Confirm & Save
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default UploadForms;
