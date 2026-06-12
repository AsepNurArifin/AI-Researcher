from __future__ import annotations


class BaseAppException(Exception):
    def __init__(self, detail: str, status_code: int = 400, code: str = "BAD_REQUEST"):
        self.detail = detail
        self.status_code = status_code
        self.code = code
        super().__init__(detail)


class NotFoundException(BaseAppException):
    def __init__(self, detail: str = "Resource not found.", code: str = "NOT_FOUND"):
        super().__init__(detail, status_code=404, code=code)


class ForbiddenException(BaseAppException):
    def __init__(self, detail: str = "Forbidden resource.", code: str = "FORBIDDEN"):
        super().__init__(detail, status_code=403, code=code)


class UnauthorizedException(BaseAppException):
    def __init__(self, detail: str = "Unauthorized access.", code: str = "UNAUTHORIZED"):
        super().__init__(detail, status_code=401, code=code)


class BadRequestException(BaseAppException):
    def __init__(self, detail: str = "Bad request.", code: str = "BAD_REQUEST"):
        super().__init__(detail, status_code=400, code=code)


class ConflictException(BaseAppException):
    def __init__(self, detail: str = "Resource conflict.", code: str = "CONFLICT"):
        super().__init__(detail, status_code=409, code=code)
