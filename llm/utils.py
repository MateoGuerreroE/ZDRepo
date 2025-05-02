import json

from data.prompt_defaults import prompt_role, prompt_instruction, prompt_role_description, prompt_context, \
    prompt_examples
from llm_model import LLModel
from schema.types import JobData, Prompt


def verify_parsing(data: dict) -> bool:
    candidates = data.get('candidates', [])
    if not len(candidates):
        print("No candidates found in the response")
        return False
    for item in candidates:
        candidate_id = item.get("candidateId", None)
        experience = item.get("overallExperience", None)
        education = item.get("education", None)
        questions = item.get("questionAlignment", None)
        completion = item.get("completion", None)
        highlights = item.get("highlights", None)

        if None in [candidate_id, experience, education, questions, completion, highlights]:
            print("Invalid data format")
            return False

        return True


def get_json_from_response(response: str) -> dict:
    try:
        clean_response = response.strip('```json\n').rstrip('```')
        json_data = json.loads(clean_response)
        return json_data
    except:
        return {}


def prepare_prompt(job: JobData, model: LLModel) -> Prompt:
    prompt_data = f"\nReady?\n\nThis is the information given for the task: \n\n{job.jobDescription}\n And candidate list:\n\n${job.candidates}"
    prompt = model.generate_prompt(prompt_role, prompt_instruction, role_description=prompt_role_description,
                                   context=prompt_context, data=prompt_data, examples=prompt_examples)

    return prompt
