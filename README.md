# Vektorize - A Full-Stack RAG Playground

**Live Demo:** [**vektorize.vercel.app**](https://[YOUR-VERCEL-URL])

![Vektorize Demo GIF](https://raw.githubusercontent.com/[YOUR-GITHUB-REPO-LINK]/main/public/demo.gif)

---

Vektorize is a complete, full-stack **Retrieval-Augmented Generation (RAG)** application built to explore the challenges and user experience of creating modern AI-powered chat interfaces. It allows users to upload their own documents (`.pdf` or `.txt`) to create a dynamic knowledge base, and then ask questions that are answered exclusively based on the provided content.

This project was built as a hands-on deep-dive into the architecture of AI applications, with a specific focus on creating an intuitive and powerful frontend experience for a complex backend process.

## Core Features

*   **Multi-Document Knowledge Base:** Upload multiple `.pdf` and `.txt` documents to build a session-specific knowledge base.
*   **Secure Server-Side Processing:** All PDF text extraction is handled securely on the backend, ensuring robustness and scalability.
*   **Conversational AI Chat:** Engage in multi-turn conversations with an AI that remembers the previous context of the chat, allowing for natural follow-up questions.
*   **Factually Grounded Responses:** Utilizes advanced prompt engineering with the Google Gemini API to ensure the AI's answers are strictly derived from the content of the uploaded documents, preventing hallucinations.
*   **Interactive RAG Debugging:** A standout feature where clicking on any user-sent prompt opens a modal, revealing the *exact* retrieved context that the AI used to formulate its response.
*   **Polished, Modern UI:** A sleek, developer-tool-inspired dark mode interface built from scratch with a focus on a clean, intuitive, and responsive user experience.

## Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (v4 CSS-first approach)
*   **AI:** Google Gemini API
*   **Backend:** Next.js API Routes
*   **Deployment:** Vercel

## Key Architectural Decisions & Learnings

### 1. Simulated RAG Pipeline

To focus on building a robust and polished end-to-end user experience, the retrieval part of the RAG pipeline is simulated using a simple but effective **keyword-based (lexical) search**. The application chunks the combined text of all uploaded documents and filters those chunks based on keywords from the user's query.

### 2. Secure, Server-Side Logic

All sensitive operations are handled by Next.js API Routes. This includes:
*   **PDF Parsing:** The heavy lifting of extracting text from PDF files is done on the server, avoiding browser limitations.
*   **API Key Management:** The `GOOGLE_AI_API_KEY` is stored securely as a server-side environment variable and is never exposed to the client.

### 3. Advanced Prompt Engineering

The application's reliability comes from a carefully crafted "few-shot" prompt. The prompt gives the AI a clear persona, a set of strict rules, and concrete examples of how to behave. This allows it to differentiate between:
*   **Research Questions:** Which must be answered only from the provided context.
*   **Conversational Greetings:** Which can be answered from its general persona.
This prevents the AI from being overly rigid or hallucinating answers.

## How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/[YOUR-GITHUB-REPO-LINK]
    cd vektorize
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment variables:**
    Create a file named `.env.local` in the root of the project and add your Google Gemini API key:
    ```
    GOOGLE_AI_API_KEY=your_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.
