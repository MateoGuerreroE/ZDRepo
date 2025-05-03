from google.api_core.exceptions import ResourceExhausted
from google.generativeai import GenerativeModel
import time

from schema.connector import Connector
import google.generativeai as genai
from dotenv import load_dotenv
import os

from schema.types import Prompt

load_dotenv()
gemini_key = os.getenv("GEMINI_KEY")
max_retries = int(os.getenv("MODEL_MAX_RETRIES", "5"))

class GeminiConnector(Connector):
    client: GenerativeModel

    def __init__(self):
        genai.configure(api_key=gemini_key)
        self.client = genai.GenerativeModel("gemini-2.0-flash")

    def request(self, prompt: Prompt) -> str:
        content = [
            prompt.role,
            prompt.instruction,
            prompt.context,
            *prompt.examples,
            prompt.data,
        ]

        if prompt.retry_text is not None:
            content.insert(0, prompt.retry_text)

        # Exp backoff
        attempt = 0
        while attempt < int(max_retries):
            try:
                response = self.client.generate_content(contents=content)
                return response.text
            except Exception as e:
                if isinstance(e, ResourceExhausted):
                    attempt += 1
                    wait_time = 3 ** attempt # Last attempt will wait 27 seconds, likely refreshing RPM
                    print(f"Rate limit exceeded, retrying in {wait_time} seconds... (Attempt {attempt})")
                    time.sleep(wait_time)
                else:
                    raise e

        raise Exception("Maximum retry attempts reached. Could not complete the request.")
