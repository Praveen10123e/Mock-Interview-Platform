# API Response Standards

All APIs MUST respond using the `BaseResponse` utility or `BaseController.sendSuccess()` / `BaseController.sendCreated()`. 

## Standard Success payload:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "meta": { ...pagination }
}
```

## Standard Error Payload:
Never build this manually. Throw a `BaseError` (via `ErrorFactory`), and the global Error Handler will output:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid data provided.",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```
