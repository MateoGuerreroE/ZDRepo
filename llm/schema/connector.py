from abc import ABC, abstractmethod

from schema.types import Prompt


class Connector(ABC):

    @abstractmethod
    def request(self, prompt: Prompt) -> str:
        """
        Send a request to the connector with the given prompt.
        Each connector can handle Prompt normalization as needed
        """
        pass