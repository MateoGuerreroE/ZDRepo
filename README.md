# ZD Recruitment Assistant

Hey! This is a tool for matching candidates with job descriptions. Using Generative AI to do a first-screening of candidate information and giving main recruiter a score based in the provided information by the candidate.

Based on the information received, information was loaded to a database, but main source can be extended to use SpreadSheets API (Or any other DB). However, for further interaction there won't be need of any sheet since all information lays in database now.

## How It works?

Project has two services

- App (NextJS 15)
- LLM Service (Python 3.12 + FastAPI)

When submitting a job description, candidates will be loaded from database (or redis, If there's a local instance and result was cached), processed by App Backend and sent to LLM Service API.

Service API creates a Prompt using defaults and provided information, so that LLM Model can process and score accordingly. Please note information is processed in batches of 10 candidates for better handling.

App backend then finishes mapping that information and matching with candidate, so It can return a clean result to be rendered on the webpage.

A very basic diagram of how It works:

![Diagram](https://i.ibb.co/27FLzZRZ/Diagram.jpg)

## Setup

These are required envs for current setup:

Required envs: (Nextjs)

```md
DATA_SOURCE={dababase_url}

REDIS_MAX_RETRIES={int} (Will default to 5 If not provided)
```

Required envs: (Python)

```md
GEMINI_KEY={...}

MAX_PARSE_ATTEMPTS={int} -> Max wrong parsing attempts. Model will be reattempted with a "reinforced" version of prompt

MODEL_MAX_RETRIES={} -> Max retry attemps when LLM model request fail.
```

- In case you want to use another LLM Model, make sure to create a new DataSource service and modify configService to include the required variable

### Steps:

1. Clone this repository.

2. Set required .env on each side (llm & app)

3. Install app required dependencies. You can use `npm i` or `pnpm i`

4. Install llm required dependencies. Use `pip install -r requirements.txt`

5. Build and run the app. In case of `npm` you can do `npm run buld & npm start`. Make sure you are in /app folder

6. Run the LLM service. Go to /llm model and run `uvicorn main:app`

7. Go to the app wesbite on your browser and try any Job description!

You can try with this, as results are stored and It won't take much time:

```md
Seeking a Ruby Developer with 2+ yrs of experience in Ruby on Rails. Responsible for building scalable apps, integrating APIs, and collaborating with teams to deliver robust web solutions.
```

## Notes

Please note that there're currently 200 candidates on database, so any new job description will take around 1-3 minutes to fully process depending on your connection specs.

Results will be cached on redis when consulted, and an attempt to save these results on the database will also be triggered.

To be able to use redis caching capabilities you will need to have a local instance of redis running. You can have any (If you have docker) by just running

`docker pull redis`
and then:
`docker run -d --name {container_name} -p 6379:6379 redis
`
