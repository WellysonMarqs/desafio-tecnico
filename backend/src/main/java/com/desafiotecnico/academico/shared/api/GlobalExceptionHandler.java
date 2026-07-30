package com.desafiotecnico.academico.shared.api;

import com.desafiotecnico.academico.shared.correlation.CorrelationIdContext;
import com.desafiotecnico.academico.shared.exception.BusinessRuleException;
import com.desafiotecnico.academico.shared.exception.ConflictException;
import com.desafiotecnico.academico.shared.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException exception, HttpServletRequest request) {
        return buildError(HttpStatus.NOT_FOUND, exception.getCode(), exception.getMessage(), request);
    }

    @ExceptionHandler({ConflictException.class, BusinessRuleException.class})
    public ResponseEntity<ApiError> handleConflict(RuntimeException exception, HttpServletRequest request) {
        String code = exception instanceof ConflictException conflictException
                ? conflictException.getCode()
                : ((BusinessRuleException) exception).getCode();
        return buildError(HttpStatus.CONFLICT, code, exception.getMessage(), request);
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class, IllegalArgumentException.class})
    public ResponseEntity<ApiError> handleValidation(Exception exception, HttpServletRequest request) {
        String message = switch (exception) {
            case MethodArgumentNotValidException methodArgumentNotValidException -> methodArgumentNotValidException
                    .getBindingResult()
                    .getFieldErrors()
                    .stream()
                    .map(this::formatFieldError)
                    .collect(Collectors.joining("; "));
            case ConstraintViolationException constraintViolationException -> constraintViolationException
                    .getConstraintViolations()
                    .stream()
                    .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                    .collect(Collectors.joining("; "));
            default -> exception.getMessage();
        };

        return buildError(HttpStatus.BAD_REQUEST, "VALIDACAO_INVALIDA", message, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception exception, HttpServletRequest request) {
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "ERRO_INTERNO", "Erro interno inesperado.", request);
    }

    private String formatFieldError(FieldError fieldError) {
        return fieldError.getField() + ": " + fieldError.getDefaultMessage();
    }

    private ResponseEntity<ApiError> buildError(HttpStatus status, String code, String message, HttpServletRequest request) {
        ApiError body = new ApiError(
                OffsetDateTime.now(),
                status.value(),
                code,
                message,
                request.getRequestURI(),
                CorrelationIdContext.get()
        );
        return ResponseEntity.status(status).body(body);
    }
}
