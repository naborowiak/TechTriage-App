
# TechTriage - AI-Powered Home Support

TechTriage is a React application that combines computer vision (Google Gemini 1.5 Pro) with real-time video support concepts to help homeowners diagnose and fix issues.

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
