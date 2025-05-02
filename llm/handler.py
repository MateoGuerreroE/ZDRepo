import os
from data.prompt_defaults import prompt_role, prompt_instruction, prompt_role_description, prompt_context, \
    prompt_examples, prompt_reattempt
from gemini_connector import GeminiConnector
from llm_model import LLModel
from schema.types import JobData
from utils import verify_parsing, get_json_from_response, prepare_prompt

max_attempts = os.getenv("MAX_PARSE_ATTEMPTS")

class Handler:
    @staticmethod
    def handle_request(job_data: JobData) -> dict:
        connector = GeminiConnector()
        model = LLModel(connector)
        attempts = 1

        prompt = prepare_prompt(job_data, model)

        # This will use class prompt defined on prepare function
        response = model.send_prompt()

        # In case invalid JSON, this will return empty error, which will return in invalidation
        data = get_json_from_response(response)

        is_valid = verify_parsing(data)
        while not is_valid:
            if attempts > max_attempts:
                raise Exception("Data received could not be parsed. Attempts reached")
            if attempts == 1:
                # Ensures the retry text is set when failed, and for all subsequent attempts
                prompt.set_retry_text(prompt_reattempt)
            # This will use param prompt (which contains the retry text)
            response = model.send_prompt(prompt=prompt)

            data = get_json_from_response(response)
            is_valid = verify_parsing(data)
            attempts += 1


        return data
