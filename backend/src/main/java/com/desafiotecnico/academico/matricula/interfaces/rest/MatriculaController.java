package com.desafiotecnico.academico.matricula.interfaces.rest;

import com.desafiotecnico.academico.matricula.application.dto.MatriculaRequest;
import com.desafiotecnico.academico.matricula.application.dto.MatriculaResponse;
import com.desafiotecnico.academico.matricula.application.service.MatriculaService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
public class MatriculaController {

    private final MatriculaService matriculaService;

    public MatriculaController(MatriculaService matriculaService) {
        this.matriculaService = matriculaService;
    }

    @PostMapping("/api/matriculas")
    @Operation(summary = "Cria matricula com status inicial pendente")
    public ResponseEntity<MatriculaResponse> create(@Valid @RequestBody MatriculaRequest request) {
        MatriculaResponse response = matriculaService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @PostMapping("/api/matriculas/{id}/confirmacao")
    @Operation(summary = "Confirma matricula")
    public ResponseEntity<MatriculaResponse> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(matriculaService.confirm(id));
    }

    @PostMapping("/api/matriculas/{id}/cancelamento")
    @Operation(summary = "Cancela matricula")
    public ResponseEntity<MatriculaResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(matriculaService.cancel(id));
    }

    @GetMapping("/api/alunos/{alunoId}/matriculas")
    @Operation(summary = "Lista matriculas por aluno")
    public ResponseEntity<List<MatriculaResponse>> findByAluno(@PathVariable Long alunoId) {
        return ResponseEntity.ok(matriculaService.findByAluno(alunoId));
    }

    @GetMapping("/api/turmas/{turmaId}/matriculas")
    @Operation(summary = "Lista matriculas por turma")
    public ResponseEntity<List<MatriculaResponse>> findByTurma(@PathVariable Long turmaId) {
        return ResponseEntity.ok(matriculaService.findByTurma(turmaId));
    }
}
