"""
SageMaker Async Inference Endpoint Deployment Script

Timeout Strategy:
- Deployment/Startup: 20 minutes (reasonable time for endpoint creation)
- Model Download/Startup: 15 minutes (extended for async setup)
- Async Inference: 30 minutes (allow time for complex video processing)
- TorchServe Configuration: Optimized for async processing
"""

from sagemaker.pytorch import PyTorchModel
import sagemaker
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timezone
import time
import json

def wait_for_endpoint_ready(sm_client, endpoint_name, max_wait_minutes=20):
    """Wait for endpoint to be ready (not updating) with 20-minute timeout"""
    print(f"Waiting for endpoint {endpoint_name} to be ready (max wait: {max_wait_minutes} minutes)...")
    start_time = time.time()
    
    while time.time() - start_time < max_wait_minutes * 60:
        try:
            response = sm_client.describe_endpoint(EndpointName=endpoint_name)
            status = response['EndpointStatus']
            
            if status == 'InService':
                print(f"✅ Endpoint {endpoint_name} is ready (InService)")
                return True
            elif status == 'Failed':
                print(f"❌ Endpoint {endpoint_name} failed")
                return False
            elif status == 'Updating':
                print(f"⏳ Endpoint {endpoint_name} is still updating... waiting")
                time.sleep(60)  # Wait 1 minute before checking again
            else:
                print(f"⏳ Endpoint {endpoint_name} status: {status}")
                time.sleep(60)
                
        except ClientError as e:
            print(f"Error checking endpoint status: {e}")
            time.sleep(60)
    
    print(f"⏰ Timeout waiting for endpoint {endpoint_name} to be ready after {max_wait_minutes} minutes")
    return False

def deploy_endpoint():
    # Fix: Properly initialize SageMaker session with explicit region
    boto_session = boto3.Session(region_name='us-east-1')
    sess = sagemaker.Session(boto_session=boto_session)
    sm_client = sess.sagemaker_client
    
    role = "arn:aws:iam::570380297301:role/sentiment-analysis-deploy-endpoint-role"
    model_uri = "s3://sentiment-analysis-saas-ai/inference/model.tar.gz"

    endpoint_name = "sentiment-endpoint-async"
    instance_type = "ml.g5.xlarge"
    initial_instance_count = 1

    model = PyTorchModel(
        model_data=model_uri,
        role=role,
        framework_version="2.5.1",
        py_version="py311",
        entry_point="inference.py",
        source_dir=".",
        name="sentiment-analysis-model",
        sagemaker_session=sess,  # Fix: Set the session explicitly
        env={
            "TS_DEFAULT_RESPONSE_TIMEOUT": "1800",   # 30 min ceiling inside container
            "TS_MAX_REQUEST_SIZE": "104857600",      # 100 MB
            "TS_MAX_RESPONSE_SIZE": "104857600",
        }
    )

    # Create or reuse SageMaker Model entity
    model_name = model.name
    try:
        sm_client.describe_model(ModelName=model_name)
        print(f"✅ Model {model_name} already exists")
    except ClientError:
        # Create the model in SageMaker if it does not exist
        print(f"Creating new model: {model_name}")
        try:
            # Use the model object directly to create the SageMaker model
            model.create(instance_type=instance_type)
            print(f"✅ Model {model_name} created successfully")
        except Exception as e:
            print(f"❌ Error creating model: {e}")
            return

    # Check if endpoint exists
    endpoint_exists = False
    try:
        sm_client.describe_endpoint(EndpointName=endpoint_name)
        endpoint_exists = True
        print(f"✅ Endpoint {endpoint_name} already exists")
    except ClientError:
        endpoint_exists = False
        print(f"Creating new endpoint: {endpoint_name}")

    if endpoint_exists:
        # Wait for endpoint to be ready before updating
        if not wait_for_endpoint_ready(sm_client, endpoint_name):
            print("❌ Cannot proceed with deployment - endpoint is not ready")
            return

    # Always create a fresh endpoint config name
    endpoint_config_name = f"{endpoint_name}-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"

    # Create endpoint config with extended runtime settings
    print(f"Creating endpoint configuration: {endpoint_config_name}")
    try:
        sm_client.create_endpoint_config(
            EndpointConfigName=endpoint_config_name,
            ProductionVariants=[
                {
                    "VariantName": "AllTraffic",
                    "ModelName": model_name,
                    "InitialInstanceCount": initial_instance_count,
                    "InstanceType": instance_type,
                    "ModelDataDownloadTimeoutInSeconds": 900,  # 15 minutes for model download
                    "ContainerStartupHealthCheckTimeoutInSeconds": 900,  # 15 minutes for startup
                    "InitialVariantWeight": 1.0
                }
            ],
            AsyncInferenceConfig={
                "OutputConfig": {
                    "S3OutputPath": "s3://sentiment-analysis-saas-ai/async-out/"
                }
            }
        )
        print(f"✅ Endpoint configuration {endpoint_config_name} created successfully with extended timeouts")
    except Exception as e:
        print(f"❌ Error creating endpoint configuration: {e}")
        return

    if endpoint_exists:
        # Update existing endpoint
        print(f"Updating existing endpoint: {endpoint_name} -> {endpoint_config_name}")
        try:
            sm_client.update_endpoint(
                EndpointName=endpoint_name,
                EndpointConfigName=endpoint_config_name,
            )
            print(f"✅ Endpoint {endpoint_name} update initiated")
        except Exception as e:
            print(f"❌ Error updating endpoint: {e}")
            return
    else:
        # Create new endpoint
        print(f"Creating new endpoint: {endpoint_name} with config {endpoint_config_name}")
        try:
            sm_client.create_endpoint(
                EndpointName=endpoint_name,
                EndpointConfigName=endpoint_config_name,
            )
            print(f"✅ Endpoint {endpoint_name} creation initiated")
        except Exception as e:
            print(f"❌ Error creating endpoint: {e}")
            return

    # Wait for endpoint to be ready with 20-minute timeout
    print(f"Waiting for endpoint {endpoint_name} to be ready (max wait: 20 minutes)...")
    waiter = sm_client.get_waiter('endpoint_in_service')
    try:
        # 20-minute timeout configuration: 2 minute delays, up to 10 attempts = 20 minutes max
        waiter.wait(EndpointName=endpoint_name, WaiterConfig={'Delay': 120, 'MaxAttempts': 10})
        print(f"✅ Endpoint {endpoint_name} is now ready and serving!")
        
    except Exception as e:
        print(f"❌ Error waiting for endpoint: {e}")
        print("💡 Tip: Check the CloudWatch logs for more details about the deployment process")

if __name__ == "__main__":
    deploy_endpoint()