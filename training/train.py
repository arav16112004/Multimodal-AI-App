from sklearn import metrics as sklearn_metrics
import torchaudio
import torch
from models import MultimodalSentimentModel, MultimodalTrainer
from meld_dataset import prepare_dataloaders
import json
from tqdm import tqdm
from install_ffmpeg import install_ffmpeg
import subprocess
import sys
import os
import argparse


# Install dependencies
print("Installing required dependencies...")
try:
    # Try to install from requirements.txt
    subprocess.check_call([
        sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
    ])
    print("Dependencies installed successfully from requirements.txt!")
except Exception as e:
    print(f"Could not install from requirements.txt: {e}")
    print("Trying to install packages individually...")
    
    # Fallback: install packages individually
    packages = [
        "transformers>=4.30.0",
        "torchaudio>=2.0.0", 
        "scikit-learn>=1.0.0",
        "tqdm>=4.60.0",
        "torchvision>=0.15.0",
        "pandas>=1.3.0",
        "opencv-python>=4.5.0",
        "librosa>=0.9.0",
        "numpy>=1.21.0"
    ]
    
    for package in packages:
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", package
            ])
            print(f"Installed {package}")
        except Exception as pkg_error:
            print(f"Failed to install {package}: {pkg_error}")
    
    print("Dependency installation completed!")

# Now import the required packages


# AWS SageMaker Training Script

SM_MODEL_DIR = os.environ.get('SM_MODEL_DIR', '.')
SM_CHANNEL_TRAINING = os.environ.get('SM_CHANNEL_TRAINING', '/opt/ml/input/data/training')
SM_CHANNEL_VALIDATION = os.environ.get('SM_CHANNEL_VALIDATION', '/opt/ml/input/data/validation')
SM_CHANNEL_TEST = os.environ.get('SM_CHANNEL_TEST', '/opt/ml/input/data/test')

os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--epochs', type=int, default=20)
    parser.add_argument('--batch_size', type=int, default=16)  # Reduced default
    parser.add_argument('--learning_rate', type=float, default=1e-4)  # Reduced default
    parser.add_argument('--max_grad_norm', type=float, default=1.0)  # Add gradient clipping

    # Data directory
    parser.add_argument('--train_dir', type=str, default=SM_CHANNEL_TRAINING)
    parser.add_argument('--val_dir', type=str, default=SM_CHANNEL_VALIDATION)
    parser.add_argument('--test_dir', type=str, default=SM_CHANNEL_TEST)
    parser.add_argument('--model_dir', type=str, default=SM_MODEL_DIR)

    return parser.parse_args()

def main():
    print()
    # Install FFMpeg

    if not install_ffmpeg():
        print("Failed to install ffmpeg.")
        sys.exit(1)
    

    print("Available audio backends")
    print(str(torchaudio.list_audio_backends()))

    args = parse_args()
    # Ensure the model directory exists so SageMaker can package artifacts
    os.makedirs(args.model_dir, exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    if torch.cuda.is_available():
        torch.cuda.reset_peak_memory_stats()
        memory_used = torch.cuda.max_memory_allocated() / 1024**2
        print(f"Using GPU: {torch.cuda.get_device_name(device)} with {memory_used:.2f}MB memory")
    else:
        print("Using CPU for training")
    
    train_loader, val_loader, test_loader = prepare_dataloaders(
        train_csv = os.path.join(args.train_dir, 'train_sent_emo.csv'),
        train_video_dir = os.path.join(args.train_dir, 'train_splits'),
        dev_csv = os.path.join(args.val_dir, 'dev_sent_emo.csv'),
        dev_video_dir = os.path.join(args.val_dir, 'dev_splits_complete'),
        test_csv = os.path.join(args.test_dir, 'test_sent_emo.csv'),
        test_video_dir = os.path.join(args.test_dir, 'output_repeated_splits_test'),
        batch_size = args.batch_size
    )

    print(f'''training dsv path: {os.path.join(args.train_dir, "train_sent_emo.csv")}''')
    print(f'''training video dir: {os.path.join(args.train_dir, "train_splits")}''')

    model = MultimodalSentimentModel().to(device)
    trainer = MultimodalTrainer(model, train_loader, val_loader, 
                               learning_rate=args.learning_rate, 
                               max_grad_norm=args.max_grad_norm)
    best_val_loss = float('inf')

    metrics_data = {
        'train_losses':[],
        'val_losses':[],
        'epochs':[],
    }

    print(f'Training Epochs: {args.epochs}')

    for epoch in tqdm(range(args.epochs), desc='Epochs'):
        train_loss = trainer.train_epoch()
        val_loss, val_metrics = trainer.evaluate(val_loader)

        # track metrics
        metrics_data['train_losses'].append(train_loss['total'])
        metrics_data['val_losses'].append(val_loss['total'])
        metrics_data['epochs'].append(epoch)

        # save metrics in sagemaker format
        print(json.dumps({
            'metrics': [
                {'Name': 'train: loss', 'Value': train_loss['total']},
                {'Name': 'validation: loss', 'Value': val_loss['total']},
                {'Name': 'validation:emotion_precision', 'Value':val_metrics['emotion_precision']},
                {'Name': 'validation:emotion_accuracy', 'Value':val_metrics['emotion_accuracy']},
                {'Name': 'validation:sentiment_precision', 'Value':val_metrics['sentiment_precision']},
                {'Name': 'validation:sentiment_accuracy', 'Value':val_metrics['sentiment_accuracy']}
            ]
        }))

        if torch.cuda.is_available():
            memory_used = torch.cuda.max_memory_allocated() / 1024**2
            print(f"Peak GPU used:  {memory_used:.2f}MB memory")

        # save model
        if val_loss['total'] < best_val_loss:
            best_val_loss = val_loss['total']
            torch.save(model.state_dict(), os.path.join(
                args.model_dir, 'best_model.pth'))
    
    # After training, save the final model

    print("Evaluating on test set...")
    test_loss, test_metrics = trainer.evaluate(test_loader, phase = 'test')
    metrics_data['test_losses']=test_loss['total']


    print(json.dumps({
            'metrics': [
                {'Name': 'train: loss', 'Value': test_loss['total']},
                {'Name': 'test: emotion_accuracy', 'Value': test_metrics['emotion_accuracy']},
                {'Name': 'test: sentiment_accuracy', 'Value': test_metrics['sentiment_accuracy']},
                {'Name': 'test: emotion_precision', 'Value': test_metrics['emotion_precision']},
                {'Name': 'test: sentiment_precision', 'Value': test_metrics['sentiment_precision']}
            ]
        }))

    # Always save a final model to trigger SageMaker packaging into model.tar.gz
    torch.save(model.state_dict(), os.path.join(args.model_dir, 'final_model.pth'))


                
if __name__ == '__main__':
    main()
    