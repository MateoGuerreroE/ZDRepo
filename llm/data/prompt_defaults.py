prompt_role = "Recruiter assistant"
prompt_role_description = "helping recruiters filter and evaluate candidates based on some data"

prompt_instruction = "Given a job description, evaluate candidates in some areas depending on their fit for the " \
                     "requirements described. Each area has a different weight and all sum up to 100. The areas are " \
                     "'overallExperience' (0-50), 'education' (0-20), 'questionAlignment' (0-20), and 'completion' (0-10)" \
                     "Include skills and experience in overall experience scoring, and completion refers to the amount " \
                     "of given data, as the information you receive comes from a form. You will need to provide a JSON " \
                     "per each candidate with the areas scored as attributes, including the provided candidateId on each, " \
                     "and include an attribute 'highlights' with a small text (max 40 words) of the main highlights of the candidate."

prompt_context = "For this task, you will be given a job description text, and a list of candidates in a normalized JSON " \
                 "structure, which includes experiences, education, name, and answers to questions. The list of candidates " \
                 "are part of a larger list, so don't base scoring based on the amount of candidates, but their real fit for the job. " \
                 "Some job descriptions are incomplete, so you will need to use your best judgment to fill in the gaps."

prompt_reattempt = ("The last response provided for this prompt was incorrect. Remember that I need a JSON response only, "
                      "with a 'candidates' attribute which is a list of JSON objects, each with the candidateId, the areas "
                      "described and an attribute highlights with a small text of the main highlights of the candidate. Let's "
                      "try again: ")

example_candidate_1 = {
    "candidateName": "Candidate 1",
    "candidateId": "123457894513",
    "education": [
        {
            "institution": "Saint Leo University",
            "title": "Software engineer",
            "startDate": "Jun 2023",
            "endDate": "Dec 2024",
        },
        {
            "institution": "GraphQL Inc",
            "title": "Ruby on Rails developer",
            "startDate": None,
            "endDate": "Mar 2025",
        }
    ],
    "experience": [
        {
            "institution": "Heroku",
            "title": "Ruby Backend Developer",
            "startDate": "Jan 2022",
            "endDate": "Jan 2024",
            "totalExperience": "2 years 0 months",
            "totalMonths": 12,
        },
        {
            "institution": "Garry Software",
            "title": "FullStack engineer",
            "startDate": "Jan 2024",
            "endDAte": "Mar 2025",
            "totalExperience": "1 year 2 months",
            "totalMonths": 14,
        }
    ],
    "questions": [
        {
            "question": "What is your experience with Ruby on Rails?",
            "answer": "I have been working with Ruby on Rails for 3 years.",
        },
        {
            "question": "What is your experience with Python?",
            "answer": None,
        }
    ],
    "skills": ["Ruby", "Python", "JavaScript"],
    "disqualified": False,
    "jobApplied": "Ruby Developer",
}

example_candidate_2 = {
    "candidateName": "Candidate 2",
    "candidateId": "32165467841",
    "education": [
        {
            "institution": "CodeAcademy",
            "title": "Python developer",
            "startDate": "June 2024",
            "endDate": "Mar 2025",
        }
    ],
    "experience": [
        {
            "institution": "Jim Software",
            "title": "Junior Backend Developer",
            "startDate": "Jul 2020",
            "endDate": "Dec 2023",
            "totalExperience": "2 years 4 months",
            "totalMonths": 28,
        },
    ],
    "questions": [
        {
            "question": "What is your experience with Ruby on Rails?",
            "answer": None,
        },
        {
            "question": "What is your experience with Python?",
            "answer": "Yes",
        }
    ],
    "skills": [],
    "disqualified": False,
    "jobApplied": "Ruby Developer",
}

example_job_description_1 = "Job Title: Ruby Developer | Department: Engineering | Tags:  | Required experience: 1+ years | " \
                            "Headline: No job headline"

example_job_description_2 = "Job Title: Pyhton Developer | Department: Engineering | Tags: pyhton, developer | " \
                            "Required experience: No experience requirements defined | Headline: Mid Pyhton Developer"

example_response_1 = {
    "candidates": [
        {
            "candidateId": "123457894513",
            "overallExperience": 42,
            "education": 20,
            "questionAlignment": 12,
            "completion": 8,
            "highlights": "Candidate has required Ruby experience and specialized education in required area, but did not answer all questions"
        },
        {
            "candidateId": "32165467841",
            "overallExperience": 10,
            "education": 8,
            "questionAlignment": 5,
            "completion": 6,
            "highlights": "Candidate has experience but It is unclear If It's related to required area. Education is present but too general. Related questions are unanswered"
        }
    ]
}

example_response_2 = {
    "candidates": [
        {
            "candidateId": "123457894513",
            "overallExperience": 23,
            "education": 15,
            "questionAlignment": 3,
            "completion": 8,
            "highlights": "Candidate has experience but not relevant in python. Education is present but not specialized in the required area. Questions related were not answered."
        },
        {
            "candidateId": "32165467841",
            "overallExperience": 19,
            "education": 16,
            "questionAlignment": 11,
            "completion": 6,
            "highlights": "Candidate has experience, although unclear If It's related to requirements. Python is present on skills, and education is present. Questions responses were not relevant and unrelated."
        }
    ]
}

prompt_examples = [
    {
        "input": f"This is the job description: {example_job_description_1}, and candidate list: [{example_candidate_1}, {example_candidate_2}]",
        "response": f"{example_response_1}"
    },
    {
        "input": f"This is the job description: {example_job_description_2}, and candidate list: [{example_candidate_1}, {example_candidate_2}]",
        "response": f"{example_response_2}"
    }
]
