from data.prompt_defaults import prompt_instruction, prompt_role
from schema.types import Prompt, JobData
import unittest
from unittest.mock import MagicMock, patch
from gemini_connector import GeminiConnector
from handler import Handler
from utils import get_json_from_response, verify_parsing, get_prompt


class ResourceExhausted(Exception):
    pass

class TestGeminiConnector(unittest.TestCase):
    @patch("gemini_connector.genai")
    def test_request_successful(self, mock_genai):
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "LLM output"
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model

        prompt = Prompt()
        prompt.set_role("Assistant", "answering questions")
        prompt.set_instruction("provide the requested information clearly")
        prompt.set_context("you are an AI model trained on various domains")
        prompt.set_data("Please explain unit testing in Python.")

        connector = GeminiConnector()

        result = connector.request(prompt)

        self.assertEqual(result, "LLM output")
        mock_model.generate_content.assert_called_once()

    @patch("gemini_connector.time.sleep")
    @patch("gemini_connector.genai")
    def test_request_with_retries_and_success(self, mock_genai, mock_sleep):
        mock_model = MagicMock()

        response = MagicMock()
        response.text = "Recovered output"

        mock_model.generate_content.side_effect = [
            ResourceExhausted("Rate limit"),
            ResourceExhausted("Rate limit"),
            response
        ]

        mock_genai.GenerativeModel.return_value = mock_model

        prompt = Prompt()
        prompt.set_role("Assistant", "answering questions")
        prompt.set_instruction("provide the requested information clearly")
        prompt.set_context("you are an AI model trained on various domains")
        prompt.set_data("Please explain retry handling.")

        import gemini_connector
        gemini_connector.ResourceExhausted = ResourceExhausted

        connector = GeminiConnector()
        result = connector.request(prompt)

        self.assertEqual(result, "Recovered output")
        self.assertEqual(mock_model.generate_content.call_count, 3)

    @patch("gemini_connector.genai")
    @patch("gemini_connector.time.sleep")
    def test_request_exceeds_max_retries(self, mock_sleep, mock_genai):

        mock_model = MagicMock()
        mock_model.generate_content.side_effect = [ResourceExhausted("Maximum retry attempts")] * 5

        mock_genai.GenerativeModel.return_value = mock_model

        prompt = Prompt()
        prompt.set_role("Assistant", "answering questions")
        prompt.set_instruction("provide the requested information clearly")
        prompt.set_context("you are an AI model trained on various domains")
        prompt.set_data("Please explain unit testing in Python.")
        connector = GeminiConnector()

        # Act + Assert
        with self.assertRaises(Exception) as cm:
            connector.request(prompt)

        self.assertIn("Maximum retry attempts", str(cm.exception))
        self.assertEqual(mock_model.generate_content.call_count, 1)


class TestHandler(unittest.TestCase):

    @patch("handler.verify_parsing")
    @patch("handler.get_json_from_response")
    @patch("handler.get_prompt")
    @patch("handler.GeminiConnector")
    def test_handle_request_valid_on_first_try(
        self, mock_connector_class, mock_get_prompt, mock_get_json, mock_verify
    ):
        mock_connector = MagicMock()
        mock_connector.request.return_value = "response content"
        mock_connector_class.return_value = mock_connector

        mock_prompt = MagicMock()
        mock_get_prompt.return_value = mock_prompt

        mock_get_json.return_value = {"result": "ok"}
        mock_verify.return_value = True

        job_data = MagicMock(spec=JobData)
        result = Handler.handle_request(job_data)

        self.assertEqual(result, {"result": "ok"})
        mock_connector.request.assert_called_once()
        mock_get_prompt.assert_called_once_with(job_data)

    @patch("handler.verify_parsing")
    @patch("handler.get_json_from_response")
    @patch("handler.get_prompt")
    @patch("handler.GeminiConnector")
    def test_handle_request_retries_then_succeeds(
        self, mock_connector_class, mock_get_prompt, mock_get_json, mock_verify
    ):
        mock_connector = MagicMock()
        mock_connector.request.side_effect = ["bad", "bad", "good"]
        mock_connector_class.return_value = mock_connector

        mock_prompt = MagicMock()
        mock_get_prompt.return_value = mock_prompt

        mock_get_json.side_effect = [{}, {}, {"result": "done"}]
        mock_verify.side_effect = [False, False, True]

        job_data = MagicMock(spec=JobData)
        result = Handler.handle_request(job_data)

        self.assertEqual(result, {"result": "done"})
        self.assertEqual(mock_connector.request.call_count, 3)
        mock_prompt.set_retry_text.assert_called_once()

    @patch("handler.verify_parsing")
    @patch("handler.get_json_from_response")
    @patch("handler.get_prompt")
    @patch("handler.GeminiConnector")
    def test_handle_request_fails_after_max_attempts(
        self, mock_connector_class, mock_get_prompt, mock_get_json, mock_verify
    ):
        mock_connector = MagicMock()
        mock_connector.request.return_value = "bad"
        mock_connector_class.return_value = mock_connector

        mock_prompt = MagicMock()
        mock_get_prompt.return_value = mock_prompt

        mock_get_json.return_value = {}
        mock_verify.return_value = False

        job_data = MagicMock(spec=JobData)

        with patch("handler.max_attempts", 3):
            with self.assertRaises(Exception) as cm:
                Handler.handle_request(job_data)

        self.assertIn("could not be parsed", str(cm.exception))
        self.assertEqual(mock_connector.request.call_count, 4)  # initial + 3 retries
        self.assertEqual(mock_prompt.set_retry_text.call_count, 1)


class TestUtils(unittest.TestCase):
    def test_verify_parsing_valid(self):
        data = {
            "candidates": [
                {
                    "candidateId": "123",
                    "overallExperience": 5,
                    "education": "Bachelor",
                    "questionAlignment": [],
                    "completion": True,
                    "highlights": []
                }
            ]
        }
        self.assertTrue(verify_parsing(data))

    def test_verify_parsing_missing_fields(self):
        data = {
            "candidates": [
                {
                    "candidateId": "123",
                    "overallExperience": None,
                    "education": "Bachelor",
                    "questionAlignment": [],
                    "completion": True,
                    "highlights": []
                }
            ]
        }
        self.assertFalse(verify_parsing(data))

    def test_verify_parsing_empty_candidates(self):
        data = {"candidates": []}
        self.assertFalse(verify_parsing(data))

    def test_get_json_from_response_valid(self):
        json_str = """```json
    {
        "key": "value"
    }
    ```"""
        self.assertEqual(get_json_from_response(json_str), {"key": "value"})

    def test_get_json_from_response_invalid(self):
        json_str = "this is not json"
        self.assertEqual(get_json_from_response(json_str), {})

    def test_get_prompt_creates_valid_prompt(self):
        job = MagicMock(spec=JobData)
        job.jobDescription = "Test job description"
        job.candidates = [{"id": 1}]

        prompt = get_prompt(job)

        self.assertIsInstance(prompt, Prompt)
        self.assertIn("Test job description", prompt.data)
        self.assertIn(prompt_instruction, prompt.instruction)
        self.assertIn(prompt_role, prompt.role)
        self.assertTrue(len(prompt.examples) > 0)

if __name__ == "__main__":
    unittest.main()

