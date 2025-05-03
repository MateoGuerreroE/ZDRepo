from pydantic import BaseModel, conlist

class JobData(BaseModel):
    job: str
    jobDescription: str
    candidates: conlist(dict, min_length=1, max_length=10)

class PromptExample:
    input: str
    response: str

    def __init__(self, receive: str, answers: str):
        self.input = receive
        self.response = answers

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

    def set_role(self, role: str, role_description=None):
        self.role = f"You are a {role}" + (
            f", which is in charge of {role_description}" if role_description else '')

    def set_instruction(self, instruction: str):
        self.instruction = "I need you to: " + instruction

    def set_context(self, context: str):
        self.context = "Consider that: " + context

    def set_examples(self, examples: list[PromptExample]):
        if not len(examples):
            return
        example_list = []
        for idx, example in enumerate(examples, start=1):
            example_list.append(f"Example {idx}: {example['input']}, Expected: {example['response']}")

        self.examples = example_list

    def set_data(self, data: str):
        if not len(data):
            return
        self.data = data

    def get_full_prompt(self):
        return (self.retry_text + self.role + "\n" + self.instruction + "\n" +
         self.context + "\n\nThese are some examples:\n\n" + "\n\n".join(
                    self.examples) + "\n" + self.data)