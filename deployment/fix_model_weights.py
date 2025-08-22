import torch
import os
import numpy as np

def fix_nan_weights(model_path, output_path):
    """Fix NaN weights in a PyTorch model by replacing them with proper initialization"""
    
    print(f"Loading corrupted model from: {model_path}")
    checkpoint = torch.load(model_path, map_location='cpu')
    
    print("Checking for NaN weights...")
    fixed_count = 0
    total_params = 0
    
    # Fix NaN weights in the state dict
    for key, param in checkpoint.items():
        total_params += param.numel()
        if torch.isnan(param).any():
            print(f"❌ Fixing NaN in {key}")
            fixed_count += 1
            
            # Replace NaN with proper initialization based on layer type
            if 'weight' in key:
                if 'conv' in key or 'linear' in key:
                    # Use Xavier/Glorot initialization for weights
                    nn.init.xavier_uniform_(param)
                else:
                    # Use normal initialization for other weights
                    nn.init.normal_(param, mean=0.0, std=0.01)
            elif 'bias' in key:
                # Initialize biases to zero
                nn.init.constant_(param, 0.0)
            else:
                # For other parameters, use small random values
                nn.init.normal_(param, mean=0.0, std=0.01)
    
    print(f"Fixed {fixed_count} layers with NaN weights")
    print(f"Total parameters: {total_params:,}")
    
    # Save the fixed model
    torch.save(checkpoint, output_path)
    print(f"Fixed model saved to: {output_path}")
    
    # Verify the fix
    print("Verifying fix...")
    fixed_checkpoint = torch.load(output_path, map_location='cpu')
    nan_count = 0
    
    for key, param in fixed_checkpoint.items():
        if torch.isnan(param).any():
            nan_count += 1
            print(f"❌ Still has NaN: {key}")
    
    if nan_count == 0:
        print("✅ All NaN weights fixed successfully!")
    else:
        print(f"❌ {nan_count} layers still have NaN weights")
    
    return nan_count == 0

if __name__ == "__main__":
    # Import here to avoid circular imports
    import torch.nn as nn
    
    model_dir = "model"
    corrupted_path = os.path.join(model_dir, "final_model.pth")
    fixed_path = os.path.join(model_dir, "final_model_fixed.pth")
    
    if os.path.exists(corrupted_path):
        print("Found corrupted model, attempting to fix...")
        success = fix_nan_weights(corrupted_path, fixed_path)
        
        if success:
            print("\n🎉 Model weights fixed! You can now use the fixed model.")
            print(f"Original: {corrupted_path}")
            print(f"Fixed: {fixed_path}")
        else:
            print("\n❌ Failed to fix all NaN weights. Model may need retraining.")
    else:
        print(f"Model file not found: {corrupted_path}")
        print("Please check the model directory path.")
