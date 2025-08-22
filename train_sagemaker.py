

from sagemaker.pytorch import PyTorch
from sagemaker.debugger import TensorBoardOutputConfig


def start_training():
    
    tensorboard_config = TensorBoardOutputConfig(
        s3_output_path = 's3://sentiment-analysis-saas-ai/tensorboard',
        container_local_output_path = '/opt/ml/output/tensorboard',
    )
    
    estimator = PyTorch(
        entry_point = 'train.py',
        source_dir = 'training',
        role = 'arn:aws:iam::570380297301:role/sentiment-analysis-execution-role',
        framework_version = '2.5.1',
        py_version = 'py311',
        instance_count = 1,
        instance_type = 'ml.g5.xlarge',
        hyperparameters = {
            'epochs': 25,
            'batch_size': 16,  # Reduced from 32 to prevent memory issues
            'learning_rate': 1e-4,  # Reduced learning rate to prevent NaN weights
            'max_grad_norm': 1.0,  # Add gradient clipping
        },
        tensorboard_config = tensorboard_config,
    )

    estimator.fit({
        'training': 's3://sentiment-analysis-saas-ai/dataset/train',
        'validation': 's3://sentiment-analysis-saas-ai/dataset/dev',
        'test': 's3://sentiment-analysis-saas-ai/dataset/test',
    })

if __name__ == '__main__':
    start_training()