import torch
import os

def inspect_model(model_path):
    print(f"Model file: {model_path}")
    print(f"File size: {os.path.getsize(model_path) / (1024*1024):.2f} MB")
    
    try:
        checkpoint = torch.load(model_path, map_location='cpu')
        print(f"Checkpoint type: {type(checkpoint)}")
        
        if isinstance(checkpoint, dict):
            print(f"Keys: {list(checkpoint.keys())}")
            
            # Check for NaN values in the weights
            has_nan = False
            for key, value in checkpoint.items():
                if isinstance(value, dict):
                    for param_name, param in value.items():
                        if torch.isnan(param).any():
                            print(f"❌ NaN found in {key}.{param_name}")
                            has_nan = True
                elif isinstance(value, torch.Tensor):
                    if torch.isnan(value).any():
                        print(f"❌ NaN found in {key}")
                        has_nan = True
            
            if not has_nan:
                print("✅ No NaN values found in model weights")
                
    except Exception as e:
        print(f"Error: {e}")

# Test your model
inspect_model("model/model.pth")
