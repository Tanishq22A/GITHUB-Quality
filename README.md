# 🚀 GitHub Project Quality Analyzer

A production-grade SaaS tool that analyzes any GitHub repository and generates a **Quality Score out of 100** based on real engineering standards such as code structure, documentation, originality, and maintenance activity.

🌐 Live App: https://github-quality.vercel.app/  
📦 Repository: https://github.com/Tanishq22A/GITHUB-Quality

---

# 📊 Overview

Most tools judge repositories by **stars and forks**, which are often vanity metrics.

**GitHub Project Quality Analyzer evaluates real engineering quality instead.**

Using the GitHub REST API, the platform inspects repository structure, activity, and documentation to generate a **multi-factor quality score** that reflects real-world project standards.

The result is presented with **interactive analytics, radar charts, and detailed score breakdowns.**

---

# 🧠 Scoring Algorithm

Repositories are evaluated across **four major categories** for a total score of **100 points**.

### 🏗️ Code Structure — 35 Points
Analyzes repository architecture and development practices.

Signals include:
- `src/` or modular project structure
- `lib/` directories
- test frameworks (`__tests__`, `jest`)
- CI/CD workflows (`.github/workflows`)
- linting configurations (`eslint`, `prettier`)

Projects following professional engineering structure score higher.

---

### 📘 Documentation & Practical Use — 30 Points

Measures usability and developer friendliness.

Signals include:
- Comprehensive **README**
- **Live demo links**
- repository **topics/tags**
- **Contributing guides**
- **Code of Conduct**
- **semantic versioned releases**

---

### 💡 Originality — 20 Points

Rewards original work and innovation.

Signals include:
- whether the project is a **fork**
- number of **community forks**
- developer ownership of the project

---

### 🔧 Maintenance — 15 Points

Evaluates repository health and maintenance activity.

Signals include:
- **12-week rolling commit activity**
- issue management quality
- ratio of open issues to contributors
- overall development activity

---

# ✨ Key Features

## ⚡ Lightning Fast Architecture

Built with:

- **Next.js 15 (App Router)**
- **React 19**
- **TailwindCSS**

No heavy chart libraries or UI frameworks are used.  
All charts and visualizations are implemented with **native SVG and React** for maximum performance.

---

## 📈 Interactive Analytics Dashboard

The results page includes:

- animated **score counter**
- custom **SVG radar chart**
- detailed **score breakdown**
- repository health indicators

---

## 🎨 Premium SaaS UI

Design highlights include:

- deep charcoal engineering theme
- electric blue accent highlights
- graphite data panels
- smooth hover animations
- 3D tilt cards
- interactive carousel navigation

---

## ⚡ Smart API Caching

To avoid GitHub API rate limits:

- results are cached in **server memory**
- **10 minute TTL**
- repeated repository analyses load instantly

This makes the app scalable on **Vercel serverless infrastructure**.

---

## 🏷️ Dynamic GitHub Badge

Every analyzed repository can generate a badge:

```
![Project Score](https://github-quality.vercel.app/api/badge?owner=vercel&repo=next.js)
```

Users can add this badge to their README to display their **repository quality score**.

---

## 🔗 Shareable Result Pages

Each analysis creates a shareable URL:

```
/result/{owner}/{repo}
```

Example:

```
/result/vercel/next.js
```

These pages include **Open Graph metadata**, allowing rich previews on:

- Twitter
- Discord
- Slack
- LinkedIn

---

# 🧩 Tech Stack

Frontend
- Next.js 15
- React 19
- TailwindCSS
- Native SVG visualizations

Backend
- Next.js Server API routes
- GitHub REST API
- Server-side caching

Deployment
- Vercel

---

# 📂 Project Structure

```
GITHUB-Quality
│
├── app
│   ├── api
│   │   ├── analyze
│   │   └── badge
│   │
│   ├── result
│   │   └── [owner]/[repo]
│   │
│   └── page.tsx
│
├── components
│   ├── RadarChart
│   ├── ScoreCard
│   ├── Carousel
│   └── TiltCard
│
├── lib
│   └── analyze.ts
│
└── styles
```

---

# ⚙️ Environment Setup

Create a `.env.local` file.

```
GITHUB_TOKEN=your_github_personal_access_token
```

This prevents GitHub API rate limits during repository analysis.

---

# 💻 Local Development

Clone the repository:

```
git clone https://github.com/Tanishq22A/GITHUB-Quality
```

Install dependencies:

```
npm install
```

Run the development server:

```
npm run dev
```

Open:

```
http://localhost:3000
```

---

# 🚀 Deployment

The project is optimized for **Vercel deployment**.

Steps:

1. Push repository to GitHub
2. Import project in Vercel
3. Add the `GITHUB_TOKEN` environment variable
4. Deploy

---

# 🔮 Future Improvements

Possible future features:

- AI-powered code quality analysis
- commit message quality scoring
- code complexity metrics
- repository leaderboards
- developer profile scoring
- organization-wide analytics

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

# 📜 License

MIT License

---

# 👨‍💻 Author

**Tanishq Arora**

GitHub: https://github.com/Tanishq22A

---

⭐ If you found this project useful, consider giving the repository a star.
