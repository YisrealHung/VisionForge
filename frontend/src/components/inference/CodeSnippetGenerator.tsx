import React, { useState } from 'react';
import { Code2, Copy, Check, Terminal } from 'lucide-react';
import { Card } from '../common/Card';

interface CodeSnippetGeneratorProps {
  projectId: string;
}

type LangKey = 'python' | 'javascript' | 'csharp' | 'curl' | 'esp32';

export const CodeSnippetGenerator: React.FC<CodeSnippetGeneratorProps> = ({ projectId }) => {
  const [selectedLang, setSelectedLang] = useState<LangKey>('python');
  const [copied, setCopied] = useState(false);

  const getSnippet = (lang: LangKey): string => {
    const endpoint = 'http://127.0.0.1:8000/api/inference/predict';

    switch (lang) {
      case 'python':
        return `import requests
import base64

# 1. 讀取圖片並進行 Base64 編碼
with open("test.jpg", "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode("utf-8")

# 2. 發送推論請求至 VisionForge API
payload = {
    "model_id": "${projectId}",
    "image_base64": img_b64,
    # "roi": {"x": 0.1, "y": 0.1, "width": 0.8, "height": 0.8} # 可選關注區域
}

response = requests.post("${endpoint}", json=payload)
data = response.json()

print(f"Top 預測類別: {data['top_label']} ({data['top_confidence']}%)")
print(f"推論延遲: {data['inference_time_ms']} ms")`;

      case 'javascript':
        return `// Node.js 或 瀏覽器 Fetch 範例
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
  console.log('預測結果:', result);
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

        Console.WriteLine($"VisionForge 推論結果: {jsonResult}");
    }
}`;

      case 'curl':
        return `# cURL 呼叫推論 API 範例
curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model_id": "${projectId}",
    "image_base64": "'$(base64 -w 0 test.jpg)'"
  }'`;

      case 'esp32':
        return `// ESP32 Arduino HTTPClient 範例
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={18} color="#06b6d4" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>多語言 API 串接程式碼產生器</h3>
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={handleCopy}
          style={{ fontSize: '0.75rem', gap: '4px' }}
        >
          {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          {copied ? '已複製到剪貼簿！' : '複製代碼'}
        </button>
      </div>

      {/* Language Switcher Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '4px' }}>
        {languages.map((l) => (
          <button
            key={l.key}
            onClick={() => setSelectedLang(l.key)}
            style={{
              padding: '5px 12px',
              fontSize: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: selectedLang === l.key ? '1px solid #06b6d4' : '1px solid var(--border-subtle)',
              background: selectedLang === l.key ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-surface-elevated)',
              color: selectedLang === l.key ? '#06b6d4' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Code Block Display */}
      <pre
        style={{
          background: '#070a12',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#cbd5e1',
          overflowX: 'auto',
          lineHeight: '1.5',
          margin: 0,
        }}
      >
        <code>{getSnippet(selectedLang)}</code>
      </pre>
    </Card>
  );
};
