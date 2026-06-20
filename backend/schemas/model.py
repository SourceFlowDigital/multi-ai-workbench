from pydantic import BaseModel


class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str


class ModelListResponse(BaseModel):
    models: list[ModelInfo]
