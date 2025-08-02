# 🎬 Multimodal Sentiment Analysis SaaS

An end-to-end SaaS platform that performs real-time sentiment and emotion analysis on video content by fusing visual, audio, and textual modalities. Designed for researchers, product teams, and content platforms aiming to extract rich emotional insights from user-generated videos.

---

## 🔍 Features

- 🎥 **Video Sentiment Analysis**: Real-time inference of emotions from videos using a multimodal fusion model.
- 📺 **Video Frame Extraction**: Frame sampling and preprocessing using OpenCV and FFMPEG.
- 🎙️ **Audio Feature Extraction**: MFCC-based and spectrogram-based audio representation extraction.
- 📝 **Text Embedding with BERT**: Transcripts embedded using pre-trained BERT for contextual understanding.
- 🔗 **Multimodal Fusion**: Audio, text, and visual embeddings fused via a PyTorch neural network.
- 📊 **Emotion & Sentiment Classification**: Trained on the MELD dataset to recognize multiple emotions.
- 🚀 **Model Training & Evaluation**: Modular PyTorch training pipeline with weighted loss to handle class imbalance.
- 📈 **TensorBoard Logging**: Monitor training metrics, losses, and evaluation performance.
- 🚀 **AWS S3 Integration**: Scalable video storage with automated upload and access.
- 🤖 **AWS SageMaker Integration**: Model hosted on a SageMaker endpoint for production-grade inference.
- 🔐 **User Authentication (Auth.js)**: Secure user login flow and session management.
- 🔑 **API Key Management**: Role-based access to model inference with rate limits.
- 📊 **Usage Quota Tracking**: Monitor API usage per user for quota enforcement.
- 📈 **Real-Time Analysis Results**: Inference results streamed to the UI with latency-optimized endpoints.
- 🎨 **Modern UI**: Responsive and clean front-end built with Tailwind CSS, React, and Next.js 15.

---

## 🛠 Tech Stack

**Frontend**
- React + Next.js 15
- Tailwind CSS
- Auth.js

**Backend & Model**
- Python, PyTorch
- AWS SageMaker
- HuggingFace Transformers
- FFMPEG, OpenCV

**Storage & DevOps**
- AWS S3
- GitHub Actions
- Flask (for local API testing)

---

## 📦 Dataset

- **MELD (Multimodal EmotionLines Dataset)**: Used for model training with synchronized video, audio, and transcripts from TV dialogues.
