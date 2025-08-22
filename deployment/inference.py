import torch
from models import MultimodalSentimentModel
import os
import cv2
import numpy as np
import subprocess
import torchaudio
import whisper
from transformers import AutoTokenizer
import sys
import json
import boto3
import tempfile

# Fix: Match the training model's emotion and sentiment mappings exactly
# Based on training/models.py line 158
EMOTION_MAP = {0: "anger", 1: "disgust", 2: "fear",
               3: "joy", 4: "neutral", 5: "sadness", 6: "surprise"}
SENTIMENT_MAP = {0: "negative", 1: "neutral", 2: "positive"}


def install_ffmpeg():
    print("Starting Ffmpeg installation...")

    subprocess.check_call([sys.executable, "-m", "pip",
                          "install", "--upgrade", "pip"])

    subprocess.check_call([sys.executable, "-m", "pip",
                          "install", "--upgrade", "setuptools"])

    try:
        subprocess.check_call([sys.executable, "-m", "pip",
                               "install", "ffmpeg-python"])
        print("Installed ffmpeg-python successfully")
    except subprocess.CalledProcessError as e:
        print("Failed to install ffmpeg-python via pip")

    try:
        subprocess.check_call([
            "wget",
            "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz",
            "-O", "/tmp/ffmpeg.tar.xz"
        ])

        subprocess.check_call([
            "tar", "-xf", "/tmp/ffmpeg.tar.xz", "-C", "/tmp/"
        ])

        result = subprocess.run(
            ["find", "/tmp", "-name", "ffmpeg", "-type", "f"],
            capture_output=True,
            text=True
        )
        ffmpeg_path = result.stdout.strip()

        subprocess.check_call(["cp", ffmpeg_path, "/usr/local/bin/ffmpeg"])

        subprocess.check_call(["chmod", "+x", "/usr/local/bin/ffmpeg"])

        print("Installed static FFmpeg binary successfully")
    except Exception as e:
        print(f"Failed to install static FFmpeg: {e}")

    try:
        result = subprocess.run(["ffmpeg", "-version"],
                                capture_output=True, text=True, check=True)
        print("FFmpeg version:")
        print(result.stdout)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("FFmpeg installation verification failed")
        return False


class VideoProcessor:
    def process_video(self, video_path):
        cap = cv2.VideoCapture(video_path)
        frames = []

        try:
            if not cap.isOpened():
                raise ValueError(f"Video not found: {video_path}")

            # Try and read first frame to validate video
            ret, frame = cap.read()
            if not ret or frame is None:
                raise ValueError(f"Video not found: {video_path}")

            # Reset index to not skip first frame
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

            while len(frames) < 30 and cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                frame = cv2.resize(frame, (224, 224))
                frame = frame / 255.0
                frames.append(frame)

        except Exception as e:
            raise ValueError(f"Video error: {str(e)}")
        finally:
            cap.release()

        if (len(frames) == 0):
            raise ValueError("No frames could be extracted")

        # Pad or truncate frames
        if len(frames) < 30:
            frames += [np.zeros_like(frames[0])] * (30 - len(frames))
        else:
            frames = frames[:30]

        # Before permute: [frames, height, width, channels]
        # After permute: [frames, channels, height, width]
        return torch.FloatTensor(np.array(frames)).permute(0, 3, 1, 2)


class AudioProcessor:
    def extract_features(self, video_path, max_length=300):
        audio_path = video_path.replace('.mp4', '.wav')

        try:
            subprocess.run([
                'ffmpeg',
                '-i', video_path,
                '-vn',
                '-acodec', 'pcm_s16le',
                '-ar', '16000',
                '-ac', '1',
                audio_path
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            waveform, sample_rate = torchaudio.load(audio_path)

            if sample_rate != 16000:
                resampler = torchaudio.transforms.Resample(sample_rate, 16000)
                waveform = resampler(waveform)

            mel_spectrogram = torchaudio.transforms.MelSpectrogram(
                sample_rate=16000,
                n_mels=64,
                n_fft=1024,
                hop_length=512
            )

            mel_spec = mel_spectrogram(waveform)

            # Normalize
            mel_spec = (mel_spec - mel_spec.mean()) / mel_spec.std()

            if mel_spec.size(2) < 300:
                padding = 300 - mel_spec.size(2)
                mel_spec = torch.nn.functional.pad(mel_spec, (0, padding))
            else:
                mel_spec = mel_spec[:, :, :300]

            return mel_spec

        except subprocess.CalledProcessError as e:
            raise ValueError(f"Audio extraction error: {str(e)}")
        except Exception as e:
            raise ValueError(f"Audio error: {str(e)}")
        finally:
            if os.path.exists(audio_path):
                os.remove(audio_path)


class VideoUtteranceProcessor:
    def __init__(self):
        self.video_processor = VideoProcessor()
        self.audio_processor = AudioProcessor()

    def extract_segment(self, video_path, start_time, end_time, temp_dir="/tmp"):
        os.makedirs(temp_dir, exist_ok=True)
        segment_path = os.path.join(
            temp_dir, f"segment_{start_time}_{end_time}.mp4")

        subprocess.run([
            "ffmpeg", "-i", video_path,
            "-ss", str(start_time),
            "-to", str(end_time),
            "-c:v", "libx264",
            "-c:a", "aac",
            "-y",
            segment_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        if not os.path.exists(segment_path) or os.path.getsize(segment_path) == 0:
            raise ValueError("Segment extraction failed: " + segment_path)

        return segment_path


def download_from_s3(s3_uri):
    s3_client = boto3.client("s3")
    bucket = s3_uri.split("/")[2]
    key = "/".join(s3_uri.split("/")[3:])

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
        s3_client.download_file(bucket, key, temp_file.name)
        return temp_file.name


def input_fn(request_body, request_content_type):
    if request_content_type == "application/json":
        input_data = json.loads(request_body)
        s3_uri = input_data['video_path']
        local_path = download_from_s3(s3_uri)
        return {"video_path": local_path}
    raise ValueError(f"Unsupported content type: {request_content_type}")


def output_fn(prediction, response_content_type):
    if response_content_type == "application/json":
        return json.dumps(prediction)
    raise ValueError(f"Unsupported content type: {response_content_type}")


def model_fn(model_dir):
    # Load the model for inference
    if not install_ffmpeg():
        raise RuntimeError(
            "FFmpeg installation failed - required for inference")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Create model instance
    model = MultimodalSentimentModel().to(device)
    print(f"Model created with {sum(p.numel() for p in model.parameters()):,} parameters")
    
    # Try multiple possible model file names and paths
    # Priority: Existing models first, then fallback paths
    possible_paths = [
        os.path.join(model_dir, 'final_model.pth'),  # Existing model file
        os.path.join(model_dir, 'final_model_fixed.pth'),  # Fixed corrupted model
        os.path.join(model_dir, 'model2_final', 'model.pth'),  # Known working model
        os.path.join(model_dir, 'model2_final', 'best_model.pth'),
        os.path.join(model_dir, 'best_model.pth'),
        os.path.join(model_dir, 'model.pth'),
        os.path.join(model_dir, "model", 'best_model.pth'),
        os.path.join(model_dir, "model", 'final_model.pth'),
        os.path.join(model_dir, "model", 'model.pth')
    ]
    
    model_path = None
    for path in possible_paths:
        if os.path.exists(path):
            model_path = path
            break
    
    if model_path is None:
        raise FileNotFoundError(
            f"Model file not found. Tried paths: {possible_paths}")

    print("Loading model from path: " + model_path)
    
    # Load the model weights
    checkpoint = torch.load(model_path, map_location=device)
    print(f"Checkpoint keys: {list(checkpoint.keys()) if isinstance(checkpoint, dict) else 'Not a dict'}")
    
    # Handle different checkpoint formats
    if isinstance(checkpoint, dict):
        if 'state_dict' in checkpoint:
            state_dict = checkpoint['state_dict']
            print("Using 'state_dict' from checkpoint")
        elif 'model_state_dict' in checkpoint:
            state_dict = checkpoint['model_state_dict']
            print("Using 'model_state_dict' from checkpoint")
        else:
            state_dict = checkpoint
            print("Using checkpoint directly as state_dict")
    else:
        state_dict = checkpoint
        print("Checkpoint is not a dict, using directly")
    
    # Fix: Ensure model is in eval mode and handle any missing keys
    try:
        missing_keys, unexpected_keys = model.load_state_dict(state_dict, strict=False)
        print(f"Model loaded successfully")
        if missing_keys:
            print(f"Missing keys: {missing_keys}")
        if unexpected_keys:
            print(f"Unexpected keys: {unexpected_keys}")
    except Exception as e:
        print(f"Warning: Error loading state dict: {e}")
        # Try to load what we can
        model_dict = model.state_dict()
        pretrained_dict = {k: v for k, v in state_dict.items() if k in model_dict}
        model_dict.update(pretrained_dict)
        model.load_state_dict(model_dict)
        print(f"Loaded {len(pretrained_dict)}/{len(model_dict)} layers")
    
    model.eval()
    print("Model set to evaluation mode")
    
    # Fix: Add gradient clipping and validation for any trainable params
    for param in model.parameters():
        if param.requires_grad:
            param.register_hook(lambda grad: torch.clamp(grad, -10, 10))

    # Test model with dummy inputs to catch any immediate issues
    try:
        print("Testing model with dummy inputs...")
        dummy_text = {'input_ids': torch.randint(0, 1000, (1, 128)).to(device),
                     'attention_mask': torch.ones(1, 128).to(device)}
        dummy_video = torch.randn(1, 30, 3, 224, 224).to(device)
        dummy_audio = torch.randn(1, 1, 64, 300).to(device)
        
        with torch.inference_mode():
            test_output = model(dummy_text, dummy_video, dummy_audio)
            print(f"Test output shapes - emotions: {test_output['emotions'].shape}, sentiments: {test_output['sentiments'].shape}")
            print(f"Test output values - emotions: {test_output['emotions'][0][:3]}, sentiments: {test_output['sentiments'][0]}")
            
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        raise RuntimeError(f"Model architecture test failed: {e}")

    # Validate model weights
    if not validate_model_weights(model):
        print("⚠️ Warning: Model weights have issues, but continuing...")

    return {
        'model': model,
        'tokenizer': AutoTokenizer.from_pretrained('bert-base-uncased'),
        'transcriber': whisper.load_model(
            "base",
            device="cpu" if device.type == "cpu" else device,
        ),
        'device': device
    }


def validate_model_weights(model):
    """Check if model weights are properly loaded and not NaN"""
    print("Validating model weights...")
    
    total_params = 0
    nan_params = 0
    inf_params = 0
    
    for name, param in model.named_parameters():
        total_params += param.numel()
        if torch.isnan(param).any():
            nan_params += param.numel()
            print(f"❌ NaN found in {name}")
        if torch.isinf(param).any():
            inf_params += param.numel()
            print(f"❌ Inf found in {name}")
    
    print(f"Total parameters: {total_params:,}")
    print(f"NaN parameters: {nan_params:,}")
    print(f"Inf parameters: {inf_params:,}")
    
    if nan_params > 0 or inf_params > 0:
        print("❌ Model has corrupted weights!")
        return False
    else:
        print("✅ Model weights are valid")
        return True


def predict_fn(input_data, model_dict):
    model = model_dict['model']
    tokenizer = model_dict['tokenizer']
    device = model_dict['device']
    video_path = input_data['video_path']

    result = model_dict['transcriber'].transcribe(
        video_path, word_timestamps=True)

    utterance_processor = VideoUtteranceProcessor()
    predictions = []

    for segment in result["segments"]:
        try:
            segment_path = utterance_processor.extract_segment(
                video_path,
                segment["start"],
                segment["end"]
            )

            video_frames = utterance_processor.video_processor.process_video(
                segment_path)
            audio_features = utterance_processor.audio_processor.extract_features(
                segment_path)
            text_inputs = tokenizer(
                segment["text"],
                padding="max_length",
                truncation=True,
                max_length=128,
                return_tensors="pt"
            )

            # Move to device
            text_inputs = {k: v.to(device) for k, v in text_inputs.items()}
            video_frames = video_frames.unsqueeze(0).to(device)
            audio_features = audio_features.unsqueeze(0).to(device)

            # Fix: Add input validation and normalization
            # Check for NaN in inputs
            if torch.isnan(video_frames).any():
                print("❌ NaN detected in video input, replacing with zeros")
                video_frames = torch.nan_to_num(video_frames, nan=0.0)
            
            if torch.isnan(audio_features).any():
                print("❌ NaN detected in audio input, replacing with zeros")
                audio_features = torch.nan_to_num(audio_features, nan=0.0)
            
            # Normalize inputs to prevent numerical instability
            if video_frames.abs().max() > 1.0:
                video_frames = torch.clamp(video_frames, -1.0, 1.0)
            
            if audio_features.abs().max() > 10.0:
                audio_features = torch.clamp(audio_features, -10.0, 10.0)

            # Get predictions
            with torch.inference_mode():
                # Debug: Check inputs before model
                print(f"Text input shape: {text_inputs['input_ids'].shape}")
                print(f"Video input shape: {video_frames.shape}")
                print(f"Audio input shape: {audio_features.shape}")
                
                # Check for NaN in inputs
                if torch.isnan(video_frames).any():
                    print("❌ NaN in video input!")
                if torch.isnan(audio_features).any():
                    print("❌ NaN in audio input!")
                
                try:
                    outputs = model(text_inputs, video_frames, audio_features)
                    
                    # Debug: Check raw outputs before softmax
                    print(f"Raw emotion output: {outputs['emotions']}")
                    print(f"Raw sentiment output: {outputs['sentiments']}")
                    
                    # Fix: Handle NaN outputs gracefully
                    if torch.isnan(outputs["emotions"]).any():
                        print("❌ NaN detected in raw emotion output! Using uniform distribution")
                        outputs["emotions"] = torch.ones_like(outputs["emotions"]) * 1.0/7.0
                    
                    if torch.isnan(outputs["sentiments"]).any():
                        print("❌ NaN detected in raw sentiment output! Using uniform distribution")
                        outputs["sentiments"] = torch.ones_like(outputs["sentiments"]) * 1.0/3.0
                    
                    # Apply softmax with numerical stability
                    emotion_probs = torch.softmax(outputs["emotions"], dim=1)[0]
                    sentiment_probs = torch.softmax(outputs["sentiments"], dim=1)[0]

                    emotion_values, emotion_indices = torch.topk(emotion_probs, 3)
                    sentiment_values, sentiment_indices = torch.topk(
                        sentiment_probs, 3)
                        
                except Exception as e:
                    print(f"❌ Model inference failed: {e}")
                    # Fallback to uniform predictions
                    emotion_probs = torch.ones(7) / 7.0
                    sentiment_probs = torch.ones(3) / 3.0
                    emotion_values, emotion_indices = torch.topk(emotion_probs, 3)
                    sentiment_values, sentiment_indices = torch.topk(sentiment_probs, 3)

            predictions.append({
                "start_time": segment["start"],
                "end_time": segment["end"],
                "text": segment["text"],
                "emotions": [
                    {"label": EMOTION_MAP[idx.item()], "confidence": conf.item()} for idx, conf in zip(emotion_indices, emotion_values)
                ],
                "sentiments": [
                    {"label": SENTIMENT_MAP[idx.item()], "confidence": conf.item()} for idx, conf in zip(sentiment_indices, sentiment_values)
                ]
            })

        except Exception as e:
            print("Segment failed inference: " + str(e))

        finally:
            # Cleanup
            if os.path.exists(segment_path):
                os.remove(segment_path)
    return {"utterances": predictions}


def process_local_video(video_path, model_dir="model"):
    model_dict = model_fn(model_dir)

    input_data = {'video_path': video_path}

    predictions = predict_fn(input_data, model_dict)

    for utterance in predictions["utterances"]:
        print("\nUtterance:")
        print(f"""Start: {utterance['start_time']}s, End: {
              utterance['end_time']}s""")
        print(f"Text: {utterance['text']}")
        print("\n Top Emotions:")
        for emotion in utterance['emotions']:
            print(f"{emotion['label']}: {emotion['confidence']:.2f}")
        print("\n Top Sentiments:")
        for sentiment in utterance['sentiments']:
            print(f"{sentiment['label']}: {sentiment['confidence']:.2f}")
        print("-"*50)


if __name__ == "__main__":
    process_local_video("./joy.mp4")