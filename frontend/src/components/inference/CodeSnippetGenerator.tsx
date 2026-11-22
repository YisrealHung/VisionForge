import React, { useState } from 'react';
import { Code2, Copy, Check } from 'lucide-react';
import { Card } from '../common/Card';
import { useProject } from '../../context/ProjectContext';
import { getPredictEndpoint } from '../../services/api';

interface CodeSnippetGeneratorProps {
  projectId: string;
}

type LangKey = 'python' | 'javascript' | 'csharp' | 'curl' | 'esp32';

export const CodeSnippetGenerator: React.FC<CodeSnippetGeneratorProps> = ({ projectId }) => {
  const [selectedLang, setSelectedLang] = useState<LangKey>('python');
  const [copied, setCopied] = useState(false);
  const { language } = useProject();
  const isZh = language === 'zh-TW';

  const getSnippet = (lang: LangKey): string => {
    const endpoint = getPredictEndpoint();

    switch (lang) {
      case 'python':
        return `import requests
import base64

# 1. Read image and encode as Base64
with open("test.jpg", "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode("utf-8")

# 2. Send inference request to VisionForge API
payload = {
    "model_id": "${projectId}",
    "image_base64": img_b64,
    # "roi": {"x": 0.1, "y": 0.1, "width": 0.8, "height": 0.8}  # Optional ROI
}

response = requests.post("${endpoint}", json=payload)
data = response.json()

print(f"Top Prediction: {data['top_label']} ({data['top_confidence']}%)")
print(f"Inference latency: {data['inference_time_ms']} ms")`;

      case 'javascript':
        return `// Node.js / Browser Fetch example
const fs = require('fs');

async function runInference() {
  const imageBuffer = fs.readFileSync('test.jpg');
  const base64Image = imageBuffer.toString('base64');

  const response = await fetch('${endpoint}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_id: '${projectId}',
      image_base64: base64Image
    })
  });

  const result = await response.json();
  console.log('Prediction result:', result);
}

runInference();`;

      case 'csharp':
        return `using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        byte[] imageBytes = File.ReadAllBytes("test.jpg");
        string base64String = Convert.ToBase64String(imageBytes);

        var payload = new
        {
            model_id = "${projectId}",
            image_base64 = base64String
        };

        using var client = new HttpClient();
        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await client.PostAsync("${endpoint}", content);
        string jsonResult = await response.Content.ReadAsStringAsync();

        Console.WriteLine($"VisionForge inference result: {jsonResult}");
    }
}`;

      case 'curl':
        return `# cURL Inference API example
curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model_id": "${projectId}",
    "image_base64": "'$(base64 -w 0 test.jpg)'"
  }'`;

      case 'esp32':
        return `// ESP32 Arduino HTTPClient example
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "${endpoint}";

void sendInference(String base64Image) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String payload = "{\\"model_id\\":\\"${projectId}\\",\\"image_base64\\":\\"" + base64Image + "\\"}";
    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println(response);
    }
    http.end();
  }
}`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getSnippet(selectedLang));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages: { key: LangKey; label: string }[] = [
    { key: 'python', label: 'Python' },
    { key: 'javascript', label: 'Node.js / JS' },
    { key: 'csharp', label: 'C# (.NET)' },
    { key: 'curl', label: 'cURL' },
    { key: 'esp32', label: 'ESP32 / Arduino' },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={16} strokeWidth={1.5} color="var(--text-secondary)" />
          <h3 style={{ fontSize: '16px', fontWeight: 500 }}>
            {isZh ? 'API 串接程式碼範例' : 'API integration code samples'}
          </h3>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleCopy}
        >
          {copied ? <Check size={14} strokeWidth={1.75} color="var(--accent-emerald)" /> : <Copy size={14} strokeWidth={1.5} />}
          <span>{copied ? (isZh ? '已複製' : 'Copied') : (isZh ? '複製程式碼' : 'Copy code')}</span>
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div className="vf-tabs" role="tablist" aria-label={isZh ? '選擇程式語言' : 'Select language'}>
          {languages.map((l) => (
            <button
              key={l.key}
              type="button"
              role="tab"
              aria-selected={selectedLang === l.key}
              className={`vf-tab ${selectedLang === l.key ? 'active' : ''}`}
              onClick={() => setSelectedLang(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <pre
        className="vf-mono"
        style={{
          background: 'var(--canvas-bg)',
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--canvas-border)',
          fontSize: '12px',
          color: 'var(--canvas-text)',
          overflowX: 'auto',
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        <code>{getSnippet(selectedLang)}</code>
      </pre>
    </Card>
  );
};
