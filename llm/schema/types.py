from pydantic import BaseModel, conlist

class JobData(BaseModel):
    job: str
    jobDescription: str
    candidates: conlist(dict, min_length=1, max_length=10) # TODO Type this with Candidate info? -> Check If It's really necessary