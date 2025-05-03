import os
from data.prompt_defaults import prompt_role, prompt_instruction, prompt_role_description, prompt_context, \
    prompt_examples, prompt_reattempt
from gemini_connector import GeminiConnector
from schema.types import JobData
from utils import verify_parsing, get_json_from_response, get_prompt

max_attempts = int(os.getenv("MAX_PARSE_ATTEMPTS", "5"))

class Handler:
    @staticmethod
    def handle_request(job_data: JobData) -> dict:
        connector = GeminiConnector()
        attempts = 1

        prompt = get_prompt(job_data)

        response = connector.request(prompt)
        # In case invalid JSON, this will return empty error, which will return in invalidation
        data = get_json_from_response(response)
        is_valid = verify_parsing(data)

        while not is_valid:
            if attempts > max_attempts:
                raise Exception("Data received could not be parsed. Attempts reached")
            if attempts == 1:
                prompt.set_retry_text(prompt_reattempt)

            response = connector.request(prompt)

            data = get_json_from_response(response)
            is_valid = verify_parsing(data)
            attempts += 1


        return data
