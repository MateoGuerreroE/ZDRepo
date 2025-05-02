from schema.types import PromptExample, Prompt


class LLModel:
    prompt: Prompt

    def __init__(self, connector):
        self.connector = connector
        self.prompt = Prompt()

    def set_role(self, role: str, role_description=None):
        self.prompt.role = f"You are a {role}" + (
            f", which is in charge of {role_description}" if role_description else '')

    def set_instruction(self, instruction: str):
        self.prompt.instruction = "I need you to: " + instruction

    def set_context(self, context: str):
        self.prompt.context = "Consider that: " + context

    def set_examples(self, examples: list[PromptExample]):
        if not len(examples):
            return
        example_list = []
        for idx, example in enumerate(examples, start=1):
            example_list.append(f"Example {idx}: {example['input']}, Expected: {example['response']}")

        self.prompt.examples = example_list

    def set_data(self, data: str):
        if not len(data):
            return
        self.prompt.data = data

    def generate_prompt(
            self,
            role: str,
            instruction: str,
            context=None,
            examples=None,
            role_description=None,
            data=None,

    ) -> Prompt:
        if examples is None:
            examples = []
        self.set_role(role, role_description)
        self.set_instruction(instruction)
        # TODO Should examples be first?
        if len(examples):
            self.set_examples(examples)
        if context:
            self.set_context(context)

        if data:
            self.set_data(data)

        self.prompt.full_prompt = self.prompt.retry_text + self.prompt.role + "\n" + self.prompt.instruction + "\n" + self.prompt.context + "\n\nThese are some examples:\n\n" + "\n\n".join(
            self.prompt.examples) + "\n" + self.prompt.data

        return self.prompt


    def send_prompt(self, prompt=None):
        if prompt is None:
            response = self.connector.request(self.prompt)
        else:
            response = self.connector.request(prompt)
        return response


