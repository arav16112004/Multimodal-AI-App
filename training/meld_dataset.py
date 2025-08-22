from torch.utils.data import Dataset, DataLoader
import os
import json
import pandas as pd
from transformers import AutoTokenizer
import cv2
import torch
import numpy as np
import subprocess
import torchaudio
import librosa

os.environ['TOKENIZERS_PARALLELISM'] = 'false'

class MeldDataset(Dataset):
    
    def __init__(self, csv_path, video_dir):
        self.csv_path = csv_path
        self.data = pd.read_csv(csv_path)
        self.video_dir = video_dir
        self.tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')

        self.emotion_map = {
            'anger':0,
            'disgust':1,
            'fear':2,
            'happiness':3,
            'sadness':4,
            'surprise':5,
            'neutral':6
        }

        self.sentiment_map = {
            'positive':0,
            'negative':1,
            'neutral':2
        }

    def __load_video_frames__(self,video_path):
        cap = cv2.VideoCapture(video_path)
        frames = []

        try:
            if not cap.isOpened():
                raise ValueError(f"Video not found: {video_path}")
            
            ret, frame = cap.read()
            if not ret or frame is None:
                raise ValueError(f"Video not found at {video_path}")
            

            # reset frame to first frame
            cap.set(cv2.CAP_PROP_POS_FRAMES,0)
            while len(frames) < 30 and cap.isOpened():
                ret, frame = cap.read()

                if not ret:
                    break
                frame = cv2.resize(frame,(224,224))

                # Normalize values
                frame = frame/255.0

                frames.append(frame)

            if len(frames) == 0:
                raise ValueError("No values could be extracted")
            
            if len(frames) < 30:
                frames += [np.zeros_like(frames[0])] * (30 - len(frames))
            else:
                frames = frames[:30]

            return torch.FloatTensor(np.array(frames)).permute(0,3,1,2)



        except Exception as e:
            raise ValueError(f"video error: {e}")
        finally:
            cap.release()


    def _extract_audio_features_(self, video_path):
        try:
            # Use librosa to load audio directly from video file
            waveform, sample_rate = librosa.load(video_path, sr=16000, mono=True)
            
            # Convert to torch tensor and add channel dimension
            waveform = torch.FloatTensor(waveform).unsqueeze(0)
            
            # Create mel spectrogram using torchaudio
            mel_spectogram = torchaudio.transforms.MelSpectrogram(
                sample_rate=16000,
                n_mels=64,
                n_fft=1024,
                hop_length=512
            )

            mel_spec = mel_spectogram(waveform)

            # normalize
            mel_spec = (mel_spec - mel_spec.mean())/mel_spec.std()

            # Pad or truncate to fixed length (300 frames)
            if mel_spec.size(2) < 300:
                padding = 300 - mel_spec.size(2)
                mel_spec = torch.nn.functional.pad(mel_spec, (0, padding))
            else:
                mel_spec = mel_spec[:,:,:300]
                
            return mel_spec
        except Exception as e:
            raise ValueError(f"Audio error: {str(e)}")



    def  __len__(self):
        return len(self.data)


    def __getitem__(self,idx):

        if isinstance(idx, torch.Tensor):
            idx = idx.item()
        row = self.data.iloc[idx]
        try:

            video_filename = f"""dia{row['Dialogue_ID']}_utt{row['Utterance_ID']}.mp4"""
            path = os.path.join(self.video_dir, video_filename)
            video_path_exists = os.path.exists(path)

            if video_path_exists == False:
                raise FileNotFoundError(f"No video found for name: {path}")
                return None
            
            print(f"File Found,{video_filename}")
            text_inputs = self.tokenizer(row["Utterance"],
                                        padding = 'max_length',
                                        truncation = True,
                                        max_length = 128,
                                        return_tensors = 'pt'
                                        )
            
            video_frames = self.__load_video_frames__(path)

            audio_features = self._extract_audio_features_(path)

            emotion_label = self.emotion_map[row['Emotion'].lower()]
            sentiment_label = self.sentiment_map[row['Sentiment'].lower()]

            return {
                        'text_inputs': {
                            'input_ids': text_inputs['input_ids'].squeeze(),
                            'attention_mask': text_inputs['attention_mask'].squeeze()
                        },
                        'video_frames': video_frames,
                        'audio_features': audio_features,
                        'emotion_label': torch.tensor(emotion_label),
                        'sentiment_label': torch.tensor(sentiment_label)
                    }
        
        except Exception as e:
            print(f"Error processing {path}: {str(e)}")
            return None
        
        # print(video_frames)

def collate_fn(batch):
    batch = list(filter(None, batch))
    return torch.utils.data.dataloader.default_collate(batch)

    


def prepare_dataloaders(train_csv, train_video_dir,
                        dev_csv, dev_video_dir,
                        test_csv, test_video_dir, batch_size = 32):
                        
    train_dataset = MeldDataset(train_csv,train_video_dir)
    dev_dataset = MeldDataset(dev_csv , dev_video_dir)
    test_dataset = MeldDataset(test_csv, test_video_dir)

    train_loader = DataLoader(train_dataset,
                              batch_size = batch_size,
                              shuffle=True,
                              num_workers=0,  # Set to 0 for debugging
                              pin_memory=True,
                              collate_fn=collate_fn
                              )
    
    dev_loader = DataLoader(dev_dataset,
                            batch_size = batch_size,
                            collate_fn=collate_fn)

    
    test_loader = DataLoader(test_dataset,
                             batch_size=batch_size,
                             collate_fn=collate_fn)

    return train_loader, dev_loader, test_loader


if __name__ == "__main__":
    train_loader, dev_loader, test_loader = prepare_dataloaders(
        '../dataset/train/train_sent_emo.csv', '../dataset/train/train_splits',
        '../dataset/dev/dev_sent_emo.csv', '../dataset/dev/dev_splits_complete',
        '../dataset/test/test_sent_emo.csv', '../dataset/test/output_repeated_splits_test'
    )

    for batch in train_loader:
        print(batch['text_inputs'])
        print(batch['video_frames'].shape)
        print(batch['audio_features'].shape)
        print(batch['emotion_label'])
        print(batch['sentiment_label'])
        break
    
    

  