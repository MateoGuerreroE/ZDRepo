from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from handler import Handler
from schema.types import JobData
from mangum import Mangum

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
@app.post("/")
async def test(job_data: JobData):
    try:
        result = Handler.handle_request(job_data)
        return {"result": result }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

handler = Mangum(app)