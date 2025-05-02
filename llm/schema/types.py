from pydantic import BaseModel, conlist

class JobData(BaseModel):
    job: str
    jobDescription: str
    candidates: conlist(dict, min_length=1, max_length=10) # TODO Type this with Candidate info? -> Check If It's really necessary

class PromptExample:
    input: str
    response: str

class Prompt:
    role: str
    instruction: str
    context: str | None = None
    data: str | None = None
    examples: list[str] = []
    full_prompt: str
    retry_text: str = ""

    def set_retry_text(self, text: str):
        self.retry_text = text