from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from schema.types import JobData

app = FastAPI()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = ".".join(str(x) for x in err["loc"][1:])
        msg = f"'{field}' is {err['msg'].lower()}"
        errors.append(msg)

    return JSONResponse(
        status_code=422,
        content={"errors": errors}
    )

# Endpoint
@app.post("/test")
async def test(job_data: JobData):
    print(job_data.job)
    return {"message": "Hello, World!"}