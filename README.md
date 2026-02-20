
# TotalAssist - AI-Powered Home Tech Support

TotalAssist is a full-stack React/Node.js application that provides AI-powered technical support for homeowners, helping them diagnose and fix issues with Wi-Fi, smart devices, appliances, HVAC, and more through text chat, photo analysis, or live video support.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18 or higher)
- A Google Gemini API Key (Get one at [aistudio.google.com](https://aistudio.google.com))

### 2. Installation

```bash
# Install dependencies
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```env
API_KEY=your_actual_api_key_here
```

### 4. Run Locally

```bash
npm run dev
```

The app will start at `http://localhost:5173`.

## 🛠 Tech Stack

- **Framework**: React + Vite
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini (via `@google/genai` SDK)
- **Icons**: Lucide React
