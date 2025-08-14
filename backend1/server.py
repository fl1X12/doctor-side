import os
import json # Import the json library
from flask import Flask, request, jsonify
from sarvamai import SarvamAI
from werkzeug.utils import secure_filename
import logging
import shutil # Import shutil for robust directory cleanup

from dotenv import load_dotenv
load_dotenv()

# Set up basic logging
logging.basicConfig(level=logging.INFO)

# Initialize the Flask app
app = Flask(__name__)

# Configure a folder to temporarily store uploaded audio files
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize the Sarvam AI client
# The SDK will automatically look for the SARVAM_API_KEY environment variable
try:
    client = SarvamAI()
    logging.info("Sarvam AI client initialized successfully.")
except Exception as e:
    logging.error(f"Failed to initialize Sarvam AI client: {e}")
    client = None

# --- API Endpoint ---
@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """
    This endpoint receives an audio file, transcribes it using Sarvam's
    Batch API with diarization, and returns the transcribed text.
    """
    if not client:
        return jsonify({"error": "Sarvam AI client is not initialized. Check API key."}), 500

    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        output_dir = None # Define output_dir here to ensure it's in scope for finally
        
        try:
            # 2. Save the uploaded file temporarily
            file.save(filepath)
            logging.info(f"File saved temporarily to {filepath}")

            # 3. Use the Sarvam Python SDK for batch speech-to-English translation
            logging.info("Creating speech-to-English translation job with diarization and timestamps...")
            
            # --- MODIFIED: Switched to the translation job and model, removed language_code ---
            job = client.speech_to_text_translate_job.create_job(
                model="saaras:v2.5",      # Use the 'saaras' model for translation
                with_diarization=True,
                num_speakers=2,
                prompt="Doctor's office conversation"
                # language_code is removed to enable auto-detection
            )
            logging.info(f"Job created with ID: {job.job_id}")

            job.upload_files(file_paths=[filepath])
            logging.info("File uploaded to job successfully.")

            job.start()
            logging.info("Translation job started. Waiting for completion...")

            job.wait_until_complete()
            logging.info("Job completed.")

            if job.is_failed():
                raise Exception(f"Translation job failed: {job.get_status()}")

            # 4. Process and return the result
            output_dir = os.path.join(app.config['UPLOAD_FOLDER'], job.job_id)
            os.makedirs(output_dir, exist_ok=True)
            logging.info(f"Downloading job output to {output_dir}")
            
            job.download_outputs(output_dir=output_dir)
            
            result_filename = os.listdir(output_dir)[0]
            result_filepath = os.path.join(output_dir, result_filename)

            with open(result_filepath, 'r', encoding='utf-8') as f:
                result_data = json.load(f)
            
            # Format the transcript to include timestamps
            if result_data and 'diarized_transcript' in result_data:
                entries = result_data['diarized_transcript'].get('entries', [])
                
                def format_time(seconds):
                    # Helper to format seconds into MM:SS format
                    mins, secs = divmod(seconds, 60)
                    return f"{int(mins):02d}:{int(secs):02d}"

                formatted_transcript = "\n".join(
                    f"[{format_time(entry.get('start_time_seconds', 0))} | {entry.get('speaker_id', 'SPK_?')}]: {entry.get('transcript', '')}"
                    for entry in entries
                )
            else:
                formatted_transcript = result_data.get('transcript', "No transcription result.")

            return jsonify({"transcription": formatted_transcript})

        except Exception as e:
            logging.error(f"An error occurred during transcription: {e}")
            return jsonify({"error": str(e)}), 500
        
        finally:
            # 5. Clean up all temporary files and directories
            if os.path.exists(filepath):
                os.remove(filepath)
                logging.info(f"Cleaned up temporary file: {filepath}")
            if output_dir and os.path.exists(output_dir):
                shutil.rmtree(output_dir) # Use shutil to remove directory and its contents
                logging.info(f"Cleaned up output directory: {output_dir}")

    return jsonify({"error": "An unknown error occurred"}), 500

# --- Main execution block ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
