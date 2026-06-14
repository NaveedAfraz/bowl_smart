# BowlSmart - Cricket Biomechanics Analysis Platform

BowlSmart is a modern web application built for automated cricket bowling biomechanics analysis. It utilizes AI/ML models to process video footage, detect bowling phases, analyze player poses, and generate actionable insights for performance improvement and injury prevention.

## 🚀 Project Overview

The project is structured into two main components:
- **Backend**: Built with Python and FastAPI. It handles video processing, human pose estimation (using MediaPipe), data storage, and biomechanical analysis algorithms.
- **Frontend**: A sleek, responsive dashboard built with Next.js, React, and TypeScript. It offers an intuitive UI to upload videos, analyze stats, and view generated reports.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Styling**: Vanilla CSS with modern standardizations
- **Features**: Dashboard, settings, video upload, analysis monitoring

### Backend
- **Framework**: FastAPI (Python)
- **Machine Learning / Computer Vision**: OpenCV, MediaPipe (Pose Detection)
- **Core Services**: Injury Scorer, Video Processor, Phase detection

---

## ⚙️ How to Install and Run Locally

Follow these step-by-step instructions to get both the frontend and backend up and running on your local machine.

### Prerequisites
- [Node.js](https://nodejs.org/en/download/) (v16.14 or later)
- [Python](https://www.python.org/downloads/) (v3.9 or later)
- Git

### 1. Clone the repository
Open a terminal and clone the repository:
```bash
git clone https://github.com/sufiyan-uddin/BOWLSMART-.git
cd bowling-biomechanics
```

### 2. Set up the Backend (FastAPI)
> **Important:** Use **Python 3.12** (MediaPipe does not support 3.14).

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the environment template and fill in your keys (optional):
   ```bash
   cp .env.example .env
   ```
3. Create a Python virtual environment (**Python 3.12 required**):
   ```bash
   python -m venv .venv
   ```
4. Activate the virtual environment:
   - **Windows:**
     ```bash
     .venv\Scripts\activate
     ```
   - **Mac/Linux:**
     ```bash
     source .venv/bin/activate
     ```
5. Install all the necessary Python packages:
   ```bash
   pip install -r requirements.txt
   ```
6. Download the MediaPipe pose model (first time only):
   ```bash
   python download_models.py
   ```
7. Start the backend server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   *The backend should now run on `http://localhost:8000`*

### 3. Set up the Frontend (Next.js)
1. Open a **new terminal tab/window** and navigate back to the project root, then into the frontend directory:
   ```bash
   cd bowling-biomechanics/frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The application should now be accessible at `http://localhost:3000`*

### 4. Explore the System
- Open your browser to `http://localhost:3000` to interact with the BowlSmart dashboard.
- You can access the backend auto-generated API documentation at `http://localhost:8000/docs`

---

## ✨ Features
- **Video Upload**: Seamlessly upload bowling action videos.
- **AI Processing**: Automated phase tracking and human pose mapping.
- **Reporting**: Generates biomechanical metrics and calculates potential injury risks.
- **Dynamic UI**: Rich, responsive, animated user interface built for modern aesthetics.
