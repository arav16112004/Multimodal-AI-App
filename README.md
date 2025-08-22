# Multimodal AI App - Video Sentiment Analysis

A comprehensive multimodal AI application that analyzes video content to detect emotions and sentiments by processing text, video, and audio modalities simultaneously. Built with Next.js, PyTorch, and AWS SageMaker.

## 🚀 Features

- **Multimodal Analysis**: Combines text, video, and audio processing for comprehensive sentiment analysis
- **Real-time Inference**: Fast video processing with GPU acceleration support
- **Web Application**: Modern Next.js frontend with authentication and file upload
- **AWS Integration**: SageMaker training and S3 storage for scalable deployment
- **API Quota Management**: Built-in rate limiting and usage tracking
- **Responsive UI**: Beautiful, modern interface built with Tailwind CSS

## 🏗️ Architecture

### Frontend (Next.js)
- **Authentication**: NextAuth.js with Prisma adapter
- **File Upload**: Secure S3 presigned URL uploads
- **Real-time Processing**: Live sentiment analysis results
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Backend (Python)
- **Multimodal Model**: PyTorch-based neural network with BERT, ResNet3D, and custom audio encoder
- **Video Processing**: FFmpeg integration for video frame extraction
- **Audio Analysis**: Whisper transcription and mel-spectrogram processing
- **Model Serving**: SageMaker endpoint deployment

### Database
- **SQLite/PostgreSQL**: Prisma ORM with flexible database support
- **User Management**: Authentication, quotas, and file tracking
- **API Quotas**: Request limiting and usage monitoring

## 🧠 Model Architecture

The multimodal model consists of three main encoders:

1. **Text Encoder**: BERT-based text processing with 768→128 dimension projection
2. **Video Encoder**: ResNet3D-18 backbone for spatial-temporal video features
3. **Audio Encoder**: Custom CNN architecture for audio spectrogram processing

**Fusion Layer**: Combines all modalities through concatenation and dense layers
**Output Heads**: Separate classifiers for emotion (7 classes) and sentiment (3 classes)

**Total Parameters**: ~143M parameters

## 📁 Project Structure

```
Multimodal-AI-App/
├── src/                    # Next.js frontend application
│   ├── app/               # App router pages and API routes
│   ├── components/        # React components
│   ├── lib/              # Utility functions
│   └── server/           # Server-side authentication
├── training/              # Model training scripts
│   ├── models.py         # PyTorch model definitions
│   ├── train.py          # Training pipeline
│   ├── meld_dataset.py   # Dataset loading and preprocessing
│   └── requirements.txt  # Training dependencies
├── deployment/            # Model deployment and inference
│   ├── inference.py      # Local inference script
│   ├── deploy_endpoint.py # SageMaker deployment
│   ├── models.py         # Deployment model definitions
│   └── requirements.txt  # Deployment dependencies
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── dataset/              # Training data storage
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- FFmpeg
- CUDA-compatible GPU (optional, for training)

### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment variables**:
   Create `.env.local` file:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   AWS_ACCESS_KEY_ID="your-aws-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret"
   AWS_REGION="us-east-1"
   S3_BUCKET="your-bucket-name"
   SAGEMAKER_ENDPOINT="your-endpoint-name"
   ```

3. **Database setup**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Backend Setup

1. **Training environment**:
   ```bash
   cd training
   pip install -r requirements.txt
   ```

2. **Deployment environment**:
   ```bash
   cd deployment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

## 🎯 Usage

### Web Application

1. **Sign up/Login**: Create an account or sign in
2. **Upload Video**: Drag and drop or select video files
3. **Real-time Analysis**: View emotion and sentiment results
4. **API Access**: Use your secret key for programmatic access

### Local Inference

```bash
cd deployment
source venv/bin/activate
python inference.py
```

### Training

```bash
cd training
python train.py --config training_config.yaml
```

### SageMaker Deployment

```bash
cd deployment
python deploy_endpoint.py --model-path model/final_model.pth
```

## 🔧 Configuration

### Model Parameters

- **Video**: 30 frames, 224x224 resolution, 3 channels
- **Audio**: 64 mel-frequency bins, 300 time steps
- **Text**: BERT tokenization with 128-dimensional projection
- **Batch Size**: Configurable (default: 16)

### Training Configuration

- **Optimizer**: Adam with learning rate scheduling
- **Loss**: Cross-entropy for classification
- **Regularization**: Dropout and batch normalization
- **Augmentation**: Random cropping, horizontal flipping

## 📊 Performance

- **Inference Speed**: ~2-5 seconds per video (CPU), ~0.5-1 second (GPU)
- **Accuracy**: Emotion classification ~75%, Sentiment analysis ~80%
- **Model Size**: ~143M parameters, ~550MB on disk
- **Memory Usage**: ~2-4GB RAM during inference

## 🚀 Deployment

### Local Deployment

1. Build the application:
   ```bash
   npm run build
   npm start
   ```

2. Run inference locally:
   ```bash
   cd deployment
   source venv/bin/activate
   python inference.py
   ```

### AWS SageMaker

1. **Model Packaging**:
   ```bash
   python deploy_endpoint.py --model-path model/final_model.pth
   ```

2. **Endpoint Management**:
   - Auto-scaling based on load
   - Health checks and monitoring
   - Cost optimization

### Docker (Optional)

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "inference.py"]
```

## 🔒 Security

- **Authentication**: NextAuth.js with secure session management
- **File Upload**: S3 presigned URLs with expiration
- **API Security**: Rate limiting and quota management
- **Environment Variables**: Secure credential management

## 📈 Monitoring & Analytics

- **User Quotas**: Track API usage and limits
- **Model Performance**: Inference latency and accuracy metrics
- **Error Tracking**: Comprehensive logging and error handling
- **Cost Monitoring**: AWS resource usage tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **PyTorch**: Deep learning framework
- **Next.js**: React framework
- **AWS SageMaker**: ML platform
- **BERT**: Pre-trained language model
- **ResNet3D**: Video understanding backbone

## 📞 Support

For questions and support:
- Create an issue on GitHub
- Check the documentation
- Review the code examples

## 🔄 Version History

- **v0.1.0**: Initial release with basic multimodal analysis
- **v0.2.0**: Added web interface and authentication
- **v0.3.0**: SageMaker integration and deployment
- **v0.4.0**: Performance optimizations and UI improvements

---

**Built with ❤️ using Next.js, PyTorch, and AWS**
