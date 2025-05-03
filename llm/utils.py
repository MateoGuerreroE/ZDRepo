import json

from data.prompt_defaults import prompt_role, prompt_instruction, prompt_role_description, prompt_context, \
    prompt_examples
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


def get_prompt(job: JobData, role=prompt_role, role_description=prompt_role_description,
                   examples=prompt_examples, instruction=prompt_instruction, context=prompt_context) -> Prompt:
    prompt_data = f"\nReady?\n\nThis is the information given for the task: \n\n{job.jobDescription}\n And candidate list:\n\n${job.candidates}"

    prompt = Prompt()

    prompt.set_role(role, role_description)
    prompt.set_instruction(instruction)

    prompt.set_examples(examples)
    prompt.set_context(context)

    prompt.set_data(prompt_data)

    return prompt
